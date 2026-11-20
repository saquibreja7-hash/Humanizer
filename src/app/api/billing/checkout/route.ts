/**
 * POST /api/billing/checkout — create a checkout session with whichever
 * provider is configured: Razorpay (INR + keys set), Dodo (keys set), or the
 * local dev simulator (DEV_BILLING_SIMULATOR=true).
 */
import { NextResponse } from "next/server";
import { requireAuth, authErrorResponse } from "@/lib/api-helpers";
import { dodoProvider } from "@/lib/billing/dodo";
import { razorpayProvider } from "@/lib/billing/razorpay";
import { simulatorProvider } from "@/lib/billing/simulator";
import type { BillingProvider } from "@/lib/billing/types";
import type { BillingInterval, Currency, PlanId } from "@/lib/brand";
import { PLANS } from "@/lib/brand";

export const dynamic = "force-dynamic";

const PAID_PLANS: PlanId[] = ["starter", "pro", "business"];

export async function POST(request: Request) {
  const ctx = requireAuth(request);
  if (!ctx) return authErrorResponse();

  let body: { plan?: string; interval?: string; currency?: string };
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
  const currency: Currency = body.currency === "INR" ? "INR" : "USD";

  let provider: BillingProvider | null = null;
  if (currency === "INR" && razorpayProvider.isConfigured()) {
    provider = razorpayProvider;
  } else if (dodoProvider.isConfigured()) {
    provider = dodoProvider;
  } else if (simulatorProvider.isConfigured()) {
    provider = simulatorProvider;
  }

  if (!provider) {
    return NextResponse.json(
      {
        error: "billing_not_configured",
        error_message:
          "No payment provider is configured. Add DODO_PAYMENTS_API_KEY / RAZORPAY_KEY_ID, or set DEV_BILLING_SIMULATOR=true for local testing.",
      },
      { status: 503 },
    );
  }

  try {
    const result = await provider.createCheckout({
      userId: ctx.user.id,
      email: ctx.user.email,
      planId: planId as Exclude<PlanId, "free">,
      interval,
      currency,
    });
    return NextResponse.json(
      { ...result, plan: PLANS[planId].name },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    return NextResponse.json(
      {
        error: "checkout_failed",
        error_message: err instanceof Error ? err.message : "Could not start checkout.",
      },
      { status: 502 },
    );
  }
}
