/**
 * POST /api/billing/simulate/confirm — dev-simulator "payment completed"
 * button. Applies the plan purchase exactly like a real webhook would,
 * through the same idempotent billing_events path.
 */
import { NextResponse } from "next/server";
import { requireAuth, authErrorResponse } from "@/lib/api-helpers";
import { applyPlanPurchase } from "@/lib/billing/apply";
import { env } from "@/lib/env";
import { PLANS, type BillingInterval, type PlanId } from "@/lib/brand";

export const dynamic = "force-dynamic";

const PAID_PLANS: PlanId[] = ["starter", "pro", "business"];

export async function POST(request: Request) {
  const ctx = requireAuth(request);
  if (!ctx) return authErrorResponse();

  if (!env.devBillingSimulator) {
    return NextResponse.json(
      { error: "simulator_disabled", error_message: "DEV_BILLING_SIMULATOR is not enabled." },
      { status: 403 },
    );
  }

  let body: { plan?: string; interval?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { error: "invalid_json", error_message: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const planId = body.plan as PlanId | undefined;
  if (!planId || !PAID_PLANS.includes(planId)) {
    return NextResponse.json(
      { error: "bad_plan", error_message: "Choose Starter, Pro, or Business & API." },
      { status: 400 },
    );
  }
  const interval: BillingInterval = body.interval === "annual" ? "annual" : "monthly";
  const plan = PLANS[planId];

  const result = applyPlanPurchase({
    provider: "simulator",
    eventId: `sim_${ctx.user.id}_${planId}_${interval}_${Date.now()}`,
    userId: ctx.user.id,
    planId,
    interval,
    amountMinor: 0,
    currency: "DEV",
    eventType: "simulated_payment.succeeded",
    subscriptionId: null,
  });

  return NextResponse.json(
    {
      ok: true,
      applied: result.applied,
      words_granted: result.wordsGranted,
      balance: result.balance,
      plan: plan.name,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
