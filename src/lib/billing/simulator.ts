/**
 * Local dev billing simulator — used when no live billing keys are configured
 * and DEV_BILLING_SIMULATOR=true. Produces an in-app "checkout" URL; the
 * confirm endpoint applies the plan change exactly like a real webhook would
 * (through recordBillingEventOnce for idempotency).
 */
import { env } from "../env";
import type { BillingProvider, CheckoutRequest, CheckoutResult, WebhookVerification } from "./types";

export const simulatorProvider: BillingProvider = {
  name: "simulator",

  isConfigured() {
    return env.devBillingSimulator;
  },

  async createCheckout(req: CheckoutRequest): Promise<CheckoutResult> {
    return {
      provider: "simulator",
      simulateUrl: `/app/billing/simulate?plan=${req.planId}&interval=${req.interval}`,
    };
  },

  verifyWebhook(): WebhookVerification {
    // The simulator never receives external webhooks; checkout completion is
    // driven by the authenticated confirm endpoint.
    return { valid: false, error: "Simulator does not accept webhooks" };
  },
};
