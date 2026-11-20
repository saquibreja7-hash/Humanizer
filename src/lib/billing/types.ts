/**
 * Unified billing provider interface. Live adapters (Dodo Payments for global
 * MoR, Razorpay for India UPI/cards) implement this; when no live keys are
 * configured the local dev simulator steps in (DEV_BILLING_SIMULATOR=true).
 */
import type { BillingInterval, Currency, PlanId } from "../brand";

export interface CheckoutRequest {
  userId: number;
  email: string;
  planId: Exclude<PlanId, "free">;
  interval: BillingInterval;
  currency: Currency;
}

export interface CheckoutResult {
  provider: string;
  /** Hosted-checkout URL to redirect the browser to (Dodo). */
  url?: string;
  /** Order id for client-side checkout widgets (Razorpay). */
  orderId?: string;
  /** Public key id for client-side checkout widgets (Razorpay). */
  keyId?: string;
  /** In-app confirmation URL (simulator). */
  simulateUrl?: string;
}

export interface WebhookVerification {
  valid: boolean;
  /** Parsed, typed-enough webhook payload when valid. */
  payload?: Record<string, unknown>;
  /** Provider-unique event id for idempotency. */
  eventId?: string;
  error?: string;
}

export interface BillingProvider {
  readonly name: "dodo" | "razorpay" | "simulator";
  isConfigured(): boolean;
  createCheckout(req: CheckoutRequest): Promise<CheckoutResult>;
  verifyWebhook(rawBody: string, headers: Headers): WebhookVerification;
}

export interface WebhookFacts {
  eventType: string;
  eventId: string;
  userId: number | null;
  planId: string | null;
  interval: string | null;
  amountMinor: number;
  currency: string;
  subscriptionId: string | null;
}
