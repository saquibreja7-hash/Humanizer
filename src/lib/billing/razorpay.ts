/**
 * Razorpay adapter (India: UPI, cards, netbanking).
 *
 * Checkout: create an Order via POST https://api.razorpay.com/v1/orders with
 * HTTP Basic auth (key_id:key_secret); the client opens Razorpay checkout with
 * the returned order_id. Webhooks: X-Razorpay-Signature is HMAC-SHA256(raw
 * body, RAZORPAY_WEBHOOK_SECRET) in hex.
 */
import crypto from "node:crypto";
import { env } from "../env";
import { PLANS, type BillingInterval } from "../brand";
import type {
  BillingProvider,
  CheckoutRequest,
  CheckoutResult,
  WebhookVerification,
} from "./types";

const API_BASE = "https://api.razorpay.com/v1";

function inrMinor(planId: "starter" | "pro" | "business", interval: BillingInterval): number {
  const plan = PLANS[planId];
  const perMonth = interval === "annual" ? plan.annualMonthlyInr : plan.monthlyInr;
  const months = interval === "annual" ? 12 : 1;
  return Math.round(perMonth * months * 100); // paise
}

export const razorpayProvider: BillingProvider = {
  name: "razorpay",

  isConfigured() {
    return Boolean(env.billing.razorpayKeyId && env.billing.razorpayKeySecret);
  },

  async createCheckout(req: CheckoutRequest): Promise<CheckoutResult> {
    const auth = Buffer.from(
      `${env.billing.razorpayKeyId}:${env.billing.razorpayKeySecret}`,
    ).toString("base64");
    const res = await fetch(`${API_BASE}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: inrMinor(req.planId, req.interval),
        currency: "INR",
        receipt: `pf_${req.userId}_${req.planId}_${req.interval}_${Date.now()}`,
        notes: {
          user_id: String(req.userId),
          plan: req.planId,
          interval: req.interval,
        },
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => res.statusText);
      throw new Error(`Razorpay order failed (HTTP ${res.status}): ${detail.slice(0, 300)}`);
    }
    const data = (await res.json()) as { id?: string };
    if (!data.id) throw new Error("Razorpay response missing order id");
    return { provider: "razorpay", orderId: data.id, keyId: env.billing.razorpayKeyId };
  },

  verifyWebhook(rawBody: string, headers: Headers): WebhookVerification {
    const secret = env.billing.razorpayWebhookSecret;
    if (!secret) {
      return { valid: false, error: "RAZORPAY_WEBHOOK_SECRET not configured" };
    }
    const signature = headers.get("x-razorpay-signature") ?? "";
    if (!signature) return { valid: false, error: "Missing X-Razorpay-Signature header" };
    const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    const a = Buffer.from(signature, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return { valid: false, error: "Invalid webhook signature" };
    }
    try {
      const payload = JSON.parse(rawBody) as Record<string, unknown>;
      const eventId =
        headers.get("x-razorpay-event-id") ??
        (payload.id as string | undefined) ??
        `rzp_${crypto.createHash("sha256").update(rawBody).digest("hex").slice(0, 24)}`;
      return { valid: true, payload, eventId };
    } catch {
      return { valid: false, error: "Invalid JSON payload" };
    }
  },
};

// ---------------------------------------------------------------------------
// Webhook payload → facts
// ---------------------------------------------------------------------------

interface RazorpayWebhookPayload {
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        amount?: number;
        currency?: string;
        notes?: Record<string, string>;
        order_id?: string;
      };
    };
    subscription?: {
      entity?: {
        id?: string;
        notes?: Record<string, string>;
      };
    };
  };
}

export function razorpayWebhookFacts(payload: Record<string, unknown>): {
  eventType: string;
  userId: number | null;
  planId: string | null;
  interval: string | null;
  amountMinor: number;
  currency: string;
  subscriptionId: string | null;
} {
  const p = payload as unknown as RazorpayWebhookPayload;
  const payment = p.payload?.payment?.entity;
  const subscription = p.payload?.subscription?.entity;
  const notes = payment?.notes ?? subscription?.notes ?? {};
  return {
    eventType: p.event ?? "unknown",
    userId: notes.user_id ? Number(notes.user_id) : null,
    planId: notes.plan ?? null,
    interval: notes.interval ?? null,
    amountMinor: typeof payment?.amount === "number" ? payment.amount : 0,
    currency: payment?.currency ?? "INR",
    subscriptionId: subscription?.id ?? payment?.order_id ?? null,
  };
}
