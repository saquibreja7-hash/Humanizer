/**
 * Shared billing-effect applier. Both real webhooks and the dev simulator
 * funnel through here so credit grants are always idempotent and audit-logged
 * in billing_events (amounts only — never any document text).
 */
import { PLANS, type PlanId } from "../brand";
import {
  grantCredits,
  recordBillingEventOnce,
  setPlan,
  setSubscription,
  getBalance,
  getUserById,
} from "../db";

export interface ApplyBillingInput {
  provider: string;
  eventId: string;
  userId: number;
  planId: PlanId;
  interval: "monthly" | "annual";
  amountMinor: number;
  currency: string;
  eventType: string;
  subscriptionId?: string | null;
}

export interface ApplyBillingResult {
  applied: boolean;
  wordsGranted: number;
  balance: number;
}

export function applyPlanPurchase(input: ApplyBillingInput): ApplyBillingResult {
  const plan = PLANS[input.planId];
  if (!plan || plan.id === "free") throw new Error(`Invalid plan: ${input.planId}`);

  const wordsGranted = plan.wordsPerMonth;
  const inserted = recordBillingEventOnce({
    provider: input.provider,
    event_id: input.eventId,
    user_id: input.userId,
    plan: input.planId,
    billing_interval: input.interval,
    words_granted: wordsGranted,
    amount_minor: input.amountMinor,
    currency: input.currency,
    event_type: input.eventType,
  });

  if (!inserted) {
    return { applied: false, wordsGranted: 0, balance: getBalance(input.userId) };
  }

  setPlan(input.userId, input.planId);
  grantCredits(input.userId, wordsGranted, `plan_purchase:${input.planId}:${input.interval}`);
  if (input.subscriptionId) {
    setSubscription(input.userId, input.provider, input.subscriptionId);
  }
  return { applied: true, wordsGranted, balance: getBalance(input.userId) };
}

export function applyCancellation(params: {
  provider: string;
  eventId: string;
  userId: number;
  eventType: string;
}): { applied: boolean } {
  const inserted = recordBillingEventOnce({
    provider: params.provider,
    event_id: params.eventId,
    user_id: params.userId,
    plan: "free",
    billing_interval: "monthly",
    words_granted: 0,
    amount_minor: 0,
    currency: "USD",
    event_type: params.eventType,
  });
  if (!inserted) return { applied: false };
  setPlan(params.userId, "free");
  setSubscription(params.userId, null, null);
  return { applied: true };
}

export function userExists(userId: number): boolean {
  return getUserById(userId) !== null;
}
