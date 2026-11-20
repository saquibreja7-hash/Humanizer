/**
 * POST /api/billing/webhook/razorpay — Razorpay webhook with HMAC-SHA256
 * verification over the raw body (X-Razorpay-Signature), then idempotent
 * plan application.
 */
import { NextResponse } from "next/server";
import { razorpayProvider, razorpayWebhookFacts } from "@/lib/billing/razorpay";
import { applyCancellation, applyPlanPurchase, userExists } from "@/lib/billing/apply";
import type { PlanId } from "@/lib/brand";

export const dynamic = "force-dynamic";

const PAID_PLANS = new Set(["starter", "pro", "business"]);

export async function POST(request: Request) {
  const rawBody = await request.text();
  const verification = razorpayProvider.verifyWebhook(rawBody, request.headers);
  if (!verification.valid) {
    return NextResponse.json(
      { error: "invalid_signature", error_message: verification.error ?? "Invalid signature." },
      { status: 401 },
    );
  }

  const payload = verification.payload!;
  const facts = razorpayWebhookFacts(payload);
  const type = facts.eventType;

  if (
    type === "subscription.cancelled" ||
    type === "subscription.halted" ||
    type === "payment.failed"
  ) {
    if (facts.userId && userExists(facts.userId)) {
      applyCancellation({
        provider: "razorpay",
        eventId: verification.eventId!,
        userId: facts.userId,
        eventType: type,
      });
    }
    return NextResponse.json({ received: true });
  }

  if (type === "payment.captured" || type === "subscription.charged" || type === "subscription.active") {
    const planId = facts.planId as PlanId | null;
    if (facts.userId && planId && PAID_PLANS.has(planId) && userExists(facts.userId)) {
      applyPlanPurchase({
        provider: "razorpay",
        eventId: verification.eventId!,
        userId: facts.userId,
        planId,
        interval: facts.interval === "annual" ? "annual" : "monthly",
        amountMinor: facts.amountMinor,
        currency: facts.currency,
        eventType: type,
        subscriptionId: facts.subscriptionId,
      });
    }
    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ received: true, ignored: type });
}
