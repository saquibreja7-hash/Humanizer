/**
 * Dodo Payments adapter (global Merchant of Record).
 *
 * Checkout: POST https://api.dodopayments.com/checkout_sessions → { checkout_url }
 * Webhooks: Standard Webhooks format — webhook-id / webhook-timestamp /
 * webhook-signature headers, HMAC-SHA256 over `{id}.{timestamp}.{body}` with
 * the base64-decoded `whsec_...` secret; signature header is `v1,<base64>`.
 */
import crypto from "node:crypto";
import { env } from "../env";
import type {
  BillingProvider,
  CheckoutRequest,
  CheckoutResult,
  WebhookVerification,
} from "./types";

const API_BASE = "https://api.dodopayments.com";

export const dodoProvider: BillingProvider = {
  name: "dodo",

  isConfigured() {
    return Boolean(env.billing.dodoApiKey);
  },

  async createCheckout(req: CheckoutRequest): Promise<CheckoutResult> {
    const productId = env.billing.dodoProductId(req.planId);
    const res = await fetch(`${API_BASE}/checkout_sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.billing.dodoApiKey}`,
      },
      body: JSON.stringify({
        product_cart: [{ product_id: productId, quantity: 1 }],
        customer: { email: req.email },
        return_url: `${env.appUrl}/app/billing?checkout=success`,
        metadata: {
          user_id: String(req.userId),
          plan: req.planId,
          interval: req.interval,
        },
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => res.statusText);
      throw new Error(`Dodo checkout failed (HTTP ${res.status}): ${detail.slice(0, 300)}`);
    }
    const data = (await res.json()) as { checkout_url?: string; payment_id?: string };
    if (!data.checkout_url) throw new Error("Dodo checkout response missing checkout_url");
    return { provider: "dodo", url: data.checkout_url };
  },

  verifyWebhook(rawBody: string, headers: Headers): WebhookVerification {
    const secret = env.billing.dodoWebhookKey;
    if (!secret) {
      return { valid: false, error: "DODO_PAYMENTS_WEBHOOK_KEY not configured" };
    }
    const id = headers.get("webhook-id") ?? "";
    const timestamp = headers.get("webhook-timestamp") ?? "";
    const signatureHeader = headers.get("webhook-signature") ?? "";
    if (!id || !timestamp || !signatureHeader) {
      return { valid: false, error: "Missing webhook headers" };
    }

    const tsAge = Math.abs(Date.now() / 1000 - Number(timestamp));
    if (!Number.isFinite(tsAge) || tsAge > 5 * 60) {
      return { valid: false, error: "webhook-timestamp too old (possible replay)" };
    }

    let key = secret;
    if (key.startsWith("whsec_")) key = key.slice("whsec_".length);
    const signedContent = `${id}.${timestamp}.${rawBody}`;
    const expected = crypto
      .createHmac("sha256", Buffer.from(key, "base64"))
      .update(signedContent)
      .digest("base64");

    const signatures = signatureHeader
      .split(" ")
      .map((s) => s.trim())
      .filter(Boolean);
    const ok = signatures.some((s) => {
      const [version, sig] = s.split(",");
      if (version !== "v1" || !sig) return false;
      const a = Buffer.from(sig);
      const b = Buffer.from(expected);
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    });

    if (!ok) return { valid: false, error: "Invalid webhook signature" };
    try {
      return { valid: true, payload: JSON.parse(rawBody) as Record<string, unknown>, eventId: id };
    } catch {
      return { valid: false, error: "Invalid JSON payload" };
    }
  },
};

// ---------------------------------------------------------------------------
// Webhook payload → facts
// ---------------------------------------------------------------------------

interface DodoWebhookPayload {
  type?: string;
  data?: {
    metadata?: Record<string, string>;
    amount?: number;
    currency?: string;
    subscription_id?: string;
    payment_id?: string;
  };
}

export function dodoWebhookFacts(payload: Record<string, unknown>): {
  eventType: string;
  userId: number | null;
  planId: string | null;
  interval: string | null;
  amountMinor: number;
  currency: string;
  subscriptionId: string | null;
} {
  const p = payload as unknown as DodoWebhookPayload;
  const meta = p.data?.metadata ?? {};
  const amount = typeof p.data?.amount === "number" ? p.data.amount : 0;
  return {
    eventType: p.type ?? "unknown",
    userId: meta.user_id ? Number(meta.user_id) : null,
    planId: meta.plan ?? null,
    interval: meta.interval ?? null,
    amountMinor: amount,
    currency: p.data?.currency ?? "USD",
    subscriptionId: p.data?.subscription_id ?? p.data?.payment_id ?? null,
  };
}
