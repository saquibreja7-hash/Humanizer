/**
 * POST /api/billing/cancel — 1-click self-serve cancellation.
 * Downgrades to Free immediately; live providers should also be told (handled
 * best-effort when a subscription id is on file).
 */
import { NextResponse } from "next/server";
import { requireAuth, authErrorResponse } from "@/lib/api-helpers";
import { applyCancellation } from "@/lib/billing/apply";
import { getUserById } from "@/lib/db";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ctx = requireAuth(request);
  if (!ctx) return authErrorResponse();

  if (ctx.user.plan === "free") {
    return NextResponse.json(
      { ok: true, message: "You are already on the Free plan." },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  // Best-effort remote cancellation (never block local downgrade on it).
  const fresh = getUserById(ctx.user.id);
  if (fresh?.subscription_id) {
    try {
      if (fresh.subscription_provider === "dodo") {
        await fetch(`https://api.dodopayments.com/subscriptions/${fresh.subscription_id}/cancel`, {
          method: "POST",
          headers: { Authorization: `Bearer ${env.billing.dodoApiKey}` },
          signal: AbortSignal.timeout(8000),
        });
      } else if (fresh.subscription_provider === "razorpay") {
        await fetch(
          `https://api.razorpay.com/v1/subscriptions/${fresh.subscription_id}/cancel`,
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${Buffer.from(
                `${env.billing.razorpayKeyId}:${env.billing.razorpayKeySecret}`,
              ).toString("base64")}`,
            },
            signal: AbortSignal.timeout(8000),
          },
        );
      }
    } catch {
      // local downgrade proceeds regardless
    }
  }

  applyCancellation({
    provider: fresh?.subscription_provider ?? "self_serve",
    eventId: `cancel_${ctx.user.id}_${Date.now()}`,
    userId: ctx.user.id,
    eventType: "subscription.cancelled",
  });

  return NextResponse.json(
    { ok: true, plan: "free" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
