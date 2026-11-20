/**
 * POST /api/billing/webhook/dodo — Dodo Payments webhook (Standard Webhooks).
 * Verifies the signature over the RAW body, then applies plan purchases /
 * renewals / cancellations idempotently via billing_events.
 */
import { NextResponse } from "next/server";
import { dodoProvider, dodoWebhookFacts } from "@/lib/billing/dodo";
import { applyCancellation, applyPlanPurchase, userExists } from "@/lib/billing/apply";
import type { PlanId } from "@/lib/brand";

export const dynamic = "force-dynamic";

const PAID_PLANS = new Set(["starter", "pro", "business"]);

export async function POST(request: Request) {
  const rawBody = await request.text();
  const verification = dodoProvider.verifyWebhook(rawBody, request.headers);
  if (!verification.valid) {
    return NextResponse.json(
      { error: "invalid_signature", error_message: verification.error ?? "Invalid signature." },
      { status: 401 },
    );
  }

  const payload = verification.payload!;
  const facts = dodoWebhookFacts(payload);
  const type = facts.eventType;

  // Cancellations / failures
  if (type === "subscription.cancelled" || type === "subscription.failed" || type === "payment.failed") {
    if (facts.userId && userExists(facts.userId)) {
      applyCancellation({ provider: "dodo", eventId: verification.eventId!, userId: facts.userId, eventType: type });
    }
    return NextResponse.json({ received: true });
  }

  // Successful purchase / renewal
  if (type === "payment.succeeded" || type === "subscription.active" || type === "subscription.renewed") {
    const planId = facts.planId as PlanId | null;
    if (facts.userId && planId && PAID_PLANS.has(planId) && userExists(facts.userId)) {
      applyPlanPurchase({
        provider: "dodo",
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

  // Unhandled event types are acknowledged so Dodo stops retrying.
  return NextResponse.json({ received: true, ignored: type });
}
