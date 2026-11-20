"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PLANS, formatPrice, planPrice, type BillingInterval, type Currency, type PlanId } from "@/lib/brand";

const VALID: PlanId[] = ["starter", "pro", "business"];

function SimulateInner() {
  const params = useSearchParams();
  const router = useRouter();
  const plan = (params.get("plan") as PlanId) ?? "pro";
  const interval: BillingInterval = params.get("interval") === "annual" ? "annual" : "monthly";
  const currency: Currency = params.get("currency") === "INR" ? "INR" : "USD";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!VALID.includes(plan)) {
    return (
      <div className="max-w-lg mx-auto px-5 py-16 text-center">
        <p className="font-semibold">Unknown plan selected.</p>
        <Link href="/app/billing" className="pf-btn pf-btn-primary text-xs mt-4">
          Back to Billing
        </Link>
      </div>
    );
  }

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/simulate/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, interval }),
      });
      const data = (await res.json()) as { ok?: boolean; error_message?: string };
      if (!res.ok) {
        setError(data.error_message ?? "Simulated checkout failed.");
        setBusy(false);
        return;
      }
      window.dispatchEvent(new Event("proseflow:credits-updated"));
      router.replace("/app/billing?purchased=1");
    } catch {
      setError("Network error.");
      setBusy(false);
    }
  }

  const details = PLANS[plan];
  const displayPrice = formatPrice(planPrice(details, interval, currency), currency);

  return (
    <div className="max-w-xl mx-auto px-5 py-12 sm:py-16">
      <div className="pf-card-pure overflow-hidden">
        <div className="p-6 sm:p-7 border-b" style={{ background: "var(--pf-surface)", borderColor: "var(--pf-border)" }}>
          <span
            className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold"
            style={{ background: "var(--pf-accent-soft)", color: "var(--pf-accent)" }}
          >
            Dev Billing Simulator
          </span>
          <h1 className="text-2xl font-bold mt-3">
            Confirm {details.name} Plan Upgrade
          </h1>
          <p className="pf-muted text-xs sm:text-sm mt-1.5 leading-relaxed">
            Sandbox preview mode: no live payment gateway is charged. Completing this step runs the
            same activation and credit-grant pipeline as a live webhook.
          </p>
        </div>

        <div className="p-6 sm:p-7 space-y-5">
          <div
            className="rounded-xl border p-4 space-y-3 text-sm"
            style={{ borderColor: "var(--pf-border)", background: "var(--pf-surface)" }}
          >
            <div className="flex justify-between">
              <span className="pf-muted">Selected Plan</span>
              <strong>{details.name}</strong>
            </div>
            <div className="flex justify-between">
              <span className="pf-muted">Billing Cycle</span>
              <strong className="capitalize">{interval}</strong>
            </div>
            <div className="flex justify-between">
              <span className="pf-muted">Monthly Word Credits</span>
              <strong className="pf-mono">{details.wordsPerMonth.toLocaleString()} words</strong>
            </div>
            <div className="flex justify-between">
              <span className="pf-muted">List Price ({currency})</span>
              <span className="pf-mono pf-muted">{displayPrice} / mo</span>
            </div>
            <div
              className="flex justify-between pt-3 border-t text-base"
              style={{ borderColor: "var(--pf-border)" }}
            >
              <span className="font-semibold">Amount Charged Today</span>
              <strong className="pf-mono pf-accent">$0.00 (Simulated)</strong>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg border px-3.5 py-2.5 text-xs"
              style={{ borderColor: "var(--pf-bad)", color: "var(--pf-bad)" }}
            >
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => void confirm()}
              disabled={busy}
              className="pf-btn pf-btn-primary flex-1 py-3 text-sm"
            >
              {busy ? "Activating plan..." : "Complete simulated payment"}
            </button>
            <Link href="/app/billing" className="pf-btn pf-btn-ghost py-3 text-sm">
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SimulateCheckoutPage() {
  return (
    <Suspense>
      <SimulateInner />
    </Suspense>
  );
}
