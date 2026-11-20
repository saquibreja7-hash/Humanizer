import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-helpers";
import { listLedger, rewriteStats } from "@/lib/db";
import { PLANS, type PlanId } from "@/lib/brand";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = requireAuth(request);
  if (!ctx) {
    return NextResponse.json(
      { error: "unauthorized", error_message: "Not signed in." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }
  const plan = PLANS[(ctx.user.plan as PlanId) ?? "free"] ?? PLANS.free;
  return NextResponse.json(
    {
      user: { id: ctx.user.id, email: ctx.user.email, plan: ctx.user.plan, created_at: ctx.user.created_at },
      plan_details: {
        name: plan.name,
        words_per_month: plan.wordsPerMonth,
        max_words_per_request: plan.maxWordsPerRequest,
        features: plan.features,
        api_access: plan.apiAccess,
        docx_support: plan.docxSupport,
        dual_versions: plan.dualVersions,
        paragraph_regen: plan.paragraphRegen,
        modes: plan.modes,
      },
      credits: {
        balance: ctx.balance,
        recent_ledger: listLedger(ctx.user.id, 10),
        usage: rewriteStats(ctx.user.id),
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
