/**
 * POST /api/rewrite — authenticated Server-Sent-Events streaming rewrite.
 * Deducts word credits on success; stores only anonymous metrics
 * (ZERO-TEXT-RETENTION: no input/output text is ever persisted or logged).
 */
import { NextResponse } from "next/server";
import { requireAuth, countWords, parseRewriteOptions, authErrorResponse } from "@/lib/api-helpers";
import { humanizeDocument, type BlockResult } from "@/lib/hip-engine";
import { deductCredits, getBalance, recordRewriteEvent } from "@/lib/db";
import { apiRewriteLimiter, clientIp, rateLimitResponse, sessionRewriteLimiter } from "@/lib/rate-limit";
import type { FidelityReport } from "@/lib/fidelity";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const encoder = new TextEncoder();

function sse(event: Record<string, unknown>): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(event)}\n\n`);
}

export async function POST(request: Request) {
  const ctx = requireAuth(request);
  if (!ctx) return authErrorResponse();

  const rl = ctx.apiKeyId
    ? apiRewriteLimiter.check(`key:${ctx.apiKeyId}`)
    : sessionRewriteLimiter.check(`ip:${clientIp(request)}`);
  if (!rl.allowed) return rateLimitResponse(rl);

  let body: { text?: string; mode?: string; creativity?: string; versions?: number };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { error: "invalid_json", error_message: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const text = (body.text ?? "").trim();
  if (!text) {
    return NextResponse.json(
      { error: "empty_text", error_message: "Provide the text to refine." },
      { status: 400 },
    );
  }
  const words = countWords(text);
  if (words > ctx.plan.maxWordsPerRequest) {
    return NextResponse.json(
      {
        error: "too_many_words",
        error_message: `Your ${ctx.plan.name} plan allows up to ${ctx.plan.maxWordsPerRequest.toLocaleString()} words per request (you sent ${words.toLocaleString()}). Split the document or upgrade.`,
      },
      { status: 413 },
    );
  }
  if (words > ctx.balance) {
    return NextResponse.json(
      {
        error: "insufficient_credits",
        error_message: `Not enough word credits: this request needs ${words} words, you have ${ctx.balance}.`,
      },
      { status: 402 },
    );
  }

  const parsed = parseRewriteOptions(body as Record<string, unknown>, ctx.plan);
  if ("error" in parsed && parsed.error) {
    return NextResponse.json({ error: "plan_limit", error_message: parsed.error }, { status: 403 });
  }
  const options = parsed.options!;

  const abort = new AbortController();
  request.signal.addEventListener("abort", () => abort.abort(), { once: true });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const send = (event: Record<string, unknown>): void => {
        if (!closed) controller.enqueue(sse(event));
      };
      try {
        send({
          type: "start",
          mode: options.mode,
          rounds: options.rounds,
          creativity: options.creativity,
          words,
          versions: options.versions,
        });

        const reports: Partial<Record<"A" | "B", FidelityReport>> = {};
        const elapsed: Partial<Record<"A" | "B", number>> = {};
        const versionList: Array<"A" | "B"> = options.versions === 2 ? ["A", "B"] : ["A"];

        for (const version of versionList) {
          const result = await humanizeDocument(
            text,
            { rounds: options.rounds, temperature: options.temperature },
            {
              onProgress: (ev) => {
                send({
                  type: "progress",
                  block: ev.blockIndex + 1,
                  total_blocks: ev.totalBlocks,
                  active_block: ev.activeBlock,
                  active_total: ev.activeTotal,
                  round: ev.round,
                  rounds: ev.rounds,
                  round_elapsed_ms: ev.elapsedMs,
                  version: ev.version,
                });
              },
              onBlock: (block: BlockResult, v) => {
                send({
                  type: "block",
                  block: block.index + 1,
                  total_blocks: 0,
                  version: v,
                  passthrough: block.passthrough,
                  text: block.text,
                });
              },
            },
            abort.signal,
            version,
          );
          reports[version] = result.report;
          elapsed[version] = result.elapsedMs;
          send({
            type: "version_done",
            version,
            elapsed_ms: result.elapsedMs,
            fidelity: result.report,
          });
        }

        // Success → deduct credits + record anonymous metrics only.
        let balance = ctx.balance;
        try {
          deductCredits(ctx.user.id, words, `rewrite:${options.mode}`);
          balance = getBalance(ctx.user.id);
          const reportA = reports.A!;
          recordRewriteEvent({
            userId: ctx.user.id,
            apiKeyId: ctx.apiKeyId,
            wordCount: words,
            rounds: options.rounds,
            mode: options.mode,
            elapsedMs: elapsed.A ?? 0,
            phrasesRebuiltPct: reportA.phrases_rebuilt_pct,
          });
        } catch (err) {
          send({
            type: "error",
            message: err instanceof Error ? err.message : "Credit deduction failed.",
          });
        }

        send({
          type: "done",
          elapsed_ms: elapsed.A ?? 0,
          credits_used: words,
          balance,
          fidelity: reports,
        });
      } catch (err) {
        const message =
          err instanceof Error && err.name === "AbortError"
            ? "Request cancelled."
            : err instanceof Error
              ? err.message
              : "Rewrite failed.";
        // No deduction on failure — the user keeps their credits.
        send({ type: "error", message });
      } finally {
        closed = true;
        controller.close();
      }
    },
    cancel() {
      abort.abort();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
