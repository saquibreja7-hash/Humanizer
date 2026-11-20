/**
 * POST /api/v1/rewrite — PUBLIC Developer REST API.
 *
 * Auth: `Authorization: Bearer pf_sk_...` (Business & API plan).
 * Body:   { "text": "...", "mode": "fast"|"standard"|"deep",
 *           "creativity": "balanced"|"natural" }
 * Response: JSON with the rewritten text, fidelity report, and credits used.
 * Zero text Retention: only word counts and fidelity metrics are recorded.
 */
import { NextResponse } from "next/server";
import { requireAuth, countWords, parseRewriteOptions } from "@/lib/api-helpers";
import { humanizeDocument } from "@/lib/hip-engine";
import { deductCredits, getBalance, recordRewriteEvent } from "@/lib/db";
import { apiRewriteLimiter, rateLimitResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  const ctx = requireAuth(request);
  if (!ctx || !ctx.apiKeyId) {
    return NextResponse.json(
      { error: "unauthorized", error_message: "Provide a valid API key: Authorization: Bearer pf_sk_..." },
      { status: 401 },
    );
  }
  if (!ctx.plan.apiAccess) {
    return NextResponse.json(
      { error: "plan_limit", error_message: "The REST API requires the Business & API plan." },
      { status: 403 },
    );
  }

  const rl = apiRewriteLimiter.check(`key:${ctx.apiKeyId}`);
  if (!rl.allowed) return rateLimitResponse(rl);

  let body: { text?: string; mode?: string; creativity?: string };
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
      { error: "empty_text", error_message: "Provide the 'text' field." },
      { status: 400 },
    );
  }
  const words = countWords(text);
  if (words > ctx.plan.maxWordsPerRequest) {
    return NextResponse.json(
      {
        error: "too_many_words",
        error_message: `Max ${ctx.plan.maxWordsPerRequest.toLocaleString()} words per request (you sent ${words.toLocaleString()}).`,
      },
      { status: 413 },
    );
  }
  if (words > ctx.balance) {
    return NextResponse.json(
      {
        error: "insufficient_credits",
        error_message: `Not enough word credits: needs ${words}, available ${ctx.balance}.`,
      },
      { status: 402 },
    );
  }

  const parsed = parseRewriteOptions({ ...body, versions: 1 }, ctx.plan);
  if ("error" in parsed && parsed.error) {
    return NextResponse.json({ error: "plan_limit", error_message: parsed.error }, { status: 403 });
  }
  const options = parsed.options!;

  try {
    const result = await humanizeDocument(text, {
      rounds: options.rounds,
      temperature: options.temperature,
    });
    deductCredits(ctx.user.id, words, `api_rewrite:${options.mode}`);
    const balance = getBalance(ctx.user.id);
    recordRewriteEvent({
      userId: ctx.user.id,
      apiKeyId: ctx.apiKeyId,
      wordCount: words,
      rounds: options.rounds,
      mode: options.mode,
      elapsedMs: result.elapsedMs,
      phrasesRebuiltPct: result.report.phrases_rebuilt_pct,
    });
    return NextResponse.json(
      {
        text: result.text,
        mode: options.mode,
        rounds: options.rounds,
        words: words,
        credits_used: words,
        credits_remaining: balance,
        elapsed_ms: result.elapsedMs,
        fidelity: result.report,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    return NextResponse.json(
      {
        error: "rewrite_failed",
        error_message: err instanceof Error ? err.message : "Rewrite failed.",
      },
      { status: 502 },
    );
  }
}
