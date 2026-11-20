/**
 * POST /api/rewrite/paragraph — single-paragraph click-to-regenerate.
 * Re-runs the HIP engine on ONE paragraph so the user doesn't spend credits
 * re-running the whole document. Pro plan and above.
 */
import { NextResponse } from "next/server";
import { requireAuth, countWords, authErrorResponse } from "@/lib/api-helpers";
import { humanizeDocument, type RewriteMode, type Creativity } from "@/lib/hip-engine";
import { CREATIVITY_TEMPERATURE, MODE_ROUNDS } from "@/lib/brand";
import { deductCredits, getBalance, recordRewriteEvent } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MAX_PARAGRAPH_WORDS = 320;

export async function POST(request: Request) {
  const ctx = requireAuth(request);
  if (!ctx) return authErrorResponse();

  if (!ctx.plan.paragraphRegen) {
    return NextResponse.json(
      {
        error: "plan_limit",
        error_message: "Click-to-regenerate is available on Pro and Business plans.",
      },
      { status: 403 },
    );
  }

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
      { error: "empty_text", error_message: "Provide the paragraph to regenerate." },
      { status: 400 },
    );
  }
  if (text.includes("\n\n")) {
    return NextResponse.json(
      { error: "not_a_paragraph", error_message: "Send a single paragraph, not multiple blocks." },
      { status: 400 },
    );
  }

  const mode = (body.mode === "fast" || body.mode === "deep" ? body.mode : "standard") as RewriteMode;
  const creativity = (body.creativity === "balanced" ? "balanced" : "natural") as Creativity;
  const rounds = MODE_ROUNDS[mode];
  const temperature = CREATIVITY_TEMPERATURE[creativity];

  const words = countWords(text);
  if (words > MAX_PARAGRAPH_WORDS) {
    return NextResponse.json(
      {
        error: "too_many_words",
        error_message: `Paragraphs up to ${MAX_PARAGRAPH_WORDS} words can be regenerated in one call.`,
      },
      { status: 413 },
    );
  }
  if (words > ctx.balance) {
    return NextResponse.json(
      {
        error: "insufficient_credits",
        error_message: `Not enough word credits: this needs ${words} words, you have ${ctx.balance}.`,
      },
      { status: 402 },
    );
  }

  try {
    const result = await humanizeDocument(text, {
      rounds,
      temperature,
      maxWorkers: 1, // single paragraph — no parallelism needed
    });
    deductCredits(ctx.user.id, words, `paragraph_regen:${mode}`);
    const balance = getBalance(ctx.user.id);
    recordRewriteEvent({
      userId: ctx.user.id,
      apiKeyId: ctx.apiKeyId,
      wordCount: words,
      rounds,
      mode: `paragraph_${mode}`,
      elapsedMs: result.elapsedMs,
      phrasesRebuiltPct: result.report.phrases_rebuilt_pct,
    });
    return NextResponse.json(
      {
        text: result.text,
        fidelity: result.report,
        credits_used: words,
        balance,
        elapsed_ms: result.elapsedMs,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    return NextResponse.json(
      {
        error: "rewrite_failed",
        error_message: err instanceof Error ? err.message : "Regeneration failed.",
      },
      { status: 502 },
    );
  }
}
