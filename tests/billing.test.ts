import crypto from "node:crypto";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { setupTestDb, cleanupTestDb } from "./helpers";
import { razorpayProvider, razorpayWebhookFacts } from "@/lib/billing/razorpay";
import { dodoProvider, dodoWebhookFacts } from "@/lib/billing/dodo";
import { simulatorProvider } from "@/lib/billing/simulator";
import { applyPlanPurchase, applyCancellation } from "@/lib/billing/apply";
import { createUser, getBalance, getUserById } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

let dbFile: string;

beforeAll(() => {
  dbFile = setupTestDb("billing");
  process.env.RAZORPAY_WEBHOOK_SECRET = "rzp_test_webhook_secret";
  process.env.DODO_PAYMENTS_WEBHOOK_KEY = "whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw";
  process.env.DEV_BILLING_SIMULATOR = "true";
});

afterAll(() => {
  cleanupTestDb(dbFile);
});

function headers(obj: Record<string, string>): Headers {
  return new Headers(obj);
}

describe("Razorpay webhook verification", () => {
  const body = JSON.stringify({
    event: "payment.captured",
    payload: {
      payment: {
        entity: {
          id: "pay_123",
          amount: 99900,
          currency: "INR",
          order_id: "order_abc",
          notes: { user_id: "7", plan: "pro", interval: "monthly" },
        },
      },
    },
  });

  it("accepts a correctly signed webhook", () => {
    const sig = crypto.createHmac("sha256", "rzp_test_webhook_secret").update(body).digest("hex");
    const res = razorpayProvider.verifyWebhook(body, headers({ "x-razorpay-signature": sig }));
    expect(res.valid).toBe(true);
    expect(res.eventId).toBeTruthy();
    const facts = razorpayWebhookFacts(res.payload!);
    expect(facts.eventType).toBe("payment.captured");
    expect(facts.userId).toBe(7);
    expect(facts.planId).toBe("pro");
    expect(facts.amountMinor).toBe(99900);
    expect(facts.currency).toBe("INR");
  });

  it("rejects bad signatures and missing headers", () => {
    expect(
      razorpayProvider.verifyWebhook(body, headers({ "x-razorpay-signature": "deadbeef" })).valid,
    ).toBe(false);
    expect(razorpayProvider.verifyWebhook(body, headers({})).valid).toBe(false);
    const tampered = body.replace("pro", "business");
    const sig = crypto.createHmac("sha256", "rzp_test_webhook_secret").update(body).digest("hex");
    expect(razorpayProvider.verifyWebhook(tampered, headers({ "x-razorpay-signature": sig })).valid).toBe(
      false,
    );
  });
});

describe("Dodo webhook verification (Standard Webhooks)", () => {
  const secret = "MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw";
  const body = JSON.stringify({
    type: "payment.succeeded",
    data: {
      metadata: { user_id: "9", plan: "starter", interval: "annual" },
      amount: 7200,
      currency: "USD",
      subscription_id: "sub_1",
    },
  });

  function sign(id: string, timestamp: string, payload: string): string {
    const signed = `${id}.${timestamp}.${payload}`;
    return crypto
      .createHmac("sha256", Buffer.from(secret, "base64"))
      .update(signed)
      .digest("base64");
  }

  it("accepts a correctly signed webhook", () => {
    const id = "msg_test_1";
    const ts = Math.floor(Date.now() / 1000).toString();
    const sig = sign(id, ts, body);
    const res = dodoProvider.verifyWebhook(body, headers({ "webhook-id": id, "webhook-timestamp": ts, "webhook-signature": `v1,${sig}` }));
    expect(res.valid).toBe(true);
    expect(res.eventId).toBe(id);
    const facts = dodoWebhookFacts(res.payload!);
    expect(facts.eventType).toBe("payment.succeeded");
    expect(facts.userId).toBe(9);
    expect(facts.planId).toBe("starter");
    expect(facts.amountMinor).toBe(7200);
  });

  it("rejects stale timestamps (replay protection)", () => {
    const id = "msg_test_2";
    const ts = Math.floor(Date.now() / 1000 - 600).toString(); // 10 minutes old
    const sig = sign(id, ts, body);
    const res = dodoProvider.verifyWebhook(body, headers({ "webhook-id": id, "webhook-timestamp": ts, "webhook-signature": `v1,${sig}` }));
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/timestamp/i);
  });

  it("rejects wrong signatures", () => {
    const id = "msg_test_3";
    const ts = Math.floor(Date.now() / 1000).toString();
    const res = dodoProvider.verifyWebhook(body, headers({ "webhook-id": id, "webhook-timestamp": ts, "webhook-signature": "v1,AAAAAAAAA=" }));
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/Invalid webhook signature/);
  });
});

describe("billing effect application", () => {
  it("grants plan words once and sets the plan (idempotent)", () => {
    const u = createUser("bill1@example.com", hashPassword("password123"));
    const first = applyPlanPurchase({
      provider: "dodo",
      eventId: "evt_unique_1",
      userId: u.id,
      planId: "pro",
      interval: "monthly",
      amountMinor: 1900,
      currency: "USD",
      eventType: "payment.succeeded",
      subscriptionId: "sub_77",
    });
    expect(first.applied).toBe(true);
    expect(first.wordsGranted).toBe(75_000);
    expect(getBalance(u.id)).toBe(75_000);
    expect(getUserById(u.id)?.plan).toBe("pro");
    expect(getUserById(u.id)?.subscription_id).toBe("sub_77");

    const dup = applyPlanPurchase({
      provider: "dodo",
      eventId: "evt_unique_1",
      userId: u.id,
      planId: "pro",
      interval: "monthly",
      amountMinor: 1900,
      currency: "USD",
      eventType: "payment.succeeded",
      subscriptionId: "sub_77",
    });
    expect(dup.applied).toBe(false);
    expect(getBalance(u.id)).toBe(75_000); // not double-granted
  });

  it("cancels back to free and clears the subscription", () => {
    const u = createUser("bill2@example.com", hashPassword("password123"));
    applyPlanPurchase({
      provider: "simulator",
      eventId: "evt_unique_2",
      userId: u.id,
      planId: "starter",
      interval: "monthly",
      amountMinor: 900,
      currency: "USD",
      eventType: "simulated_payment.succeeded",
    });
    expect(getUserById(u.id)?.plan).toBe("starter");
    applyCancellation({
      provider: "simulator",
      eventId: `cancel_${u.id}_1`,
      userId: u.id,
      eventType: "subscription.cancelled",
    });
    expect(getUserById(u.id)?.plan).toBe("free");
    expect(getUserById(u.id)?.subscription_id).toBeNull();
  });
});

describe("dev simulator", () => {
  it("produces an in-app checkout URL when enabled", async () => {
    expect(simulatorProvider.isConfigured()).toBe(true);
    const res = await simulatorProvider.createCheckout({
      userId: 1,
      email: "x@example.com",
      planId: "pro",
      interval: "monthly",
      currency: "USD",
    });
    expect(res.provider).toBe("simulator");
    expect(res.simulateUrl).toContain("/app/billing/simulate?plan=pro&interval=monthly");
  });

  it("never validates webhooks", () => {
    expect(simulatorProvider.verifyWebhook("{}", headers({})).valid).toBe(false);
  });
});
