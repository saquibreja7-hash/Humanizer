"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PLANS, type BillingInterval, type PlanId } from "@/lib/brand";

const VALID: PlanId[] = ["starter", "pro", "business"];

function SimulateInner() {
  const params = useSearchParams();
  const router = useRouter();
  const plan = (params.get("plan") as PlanId) ?? "pro";
  const interval: BillingInterval = params.get("interval") === "annual" ? "annual" : "monthly";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!VALID.includes(plan)) {
    return (
      <div className="max-w-lg mx-auto px-5 py-16">
        <p>Unknown plan.</p>
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
      router.replace("/app/billing?purchased=1");
    } catch {
      setError("Network error.");
      setBusy(false);
    }
  }

  const details = PLANS[plan];

  return (
    <div className="max-w-lg mx-auto px-5 py-16">
      <div className="pf-card p-8" style={{ borderColor: "var(--pf-accent)", borderWidth: 2 }}>
        <span className="pf-badge" style={{ background: "var(--pf-accent-soft)" }}>
          DEV BILLING SIMULATOR
        </span>
        <h1 className="text-2xl font-bold mt-4">Simulated checkout</h1>
        <p className="pf-muted text-sm mt-2 leading-relaxed">
          No live payment provider is configured, so this in-app simulator stands in for the real
          Dodo Payments / Razorpay checkout. It applies the exact same plan-change and credit-grant
          code path a real webhook would.
        </p>
        <div className="mt-6 text-sm space-y-2">
          <div className="flex justify-between">
            <span className="pf-muted">Plan</span>
            <strong>{details.name}</strong>
          </div>
          <div className="flex justify-between">
            <span className="pf-muted">Billing</span>
            <strong>{interval}</strong>
          </div>
          <div className="flex justify-between">
            <span className="pf-muted">Words granted</span>
            <strong>{details.wordsPerMonth.toLocaleString()}</strong>
          </div>
          <div className="flex justify-between">
            <span className="pf-muted">Charge</span>
            <strong>$0.00 (simulated)</strong>
          </div>
        </div>
        {error && (
          <p className="text-sm mt-4" style={{ color: "var(--pf-bad)" }}>
            {error}
          </p>
        )}
        <button onClick={() => void confirm()} disabled={busy} className="pf-btn pf-btn-primary w-full mt-6">
          {busy ? "Processing..." : "Complete simulated payment"}
        </button>
        <a href="/app/billing" className="block text-center text-sm pf-muted mt-3 hover:opacity-70">
          Cancel
        </a>
      </div>
    </div>
  );
}

export default function SimulatePage() {
  return (
    <Suspense>
      <SimulateInner />
    </Suspense>
  );
}
