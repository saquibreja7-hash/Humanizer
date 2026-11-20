"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PLANS, PLAN_ORDER, planPrice, formatPrice, type BillingInterval, type Currency, type PlanId } from "@/lib/brand";

interface Me {
  user: { plan: string };
  plan_details: { name: string; words_per_month: number };
  credits: { balance: number; recent_ledger: Array<{ id: number; delta: number; reason: string; created_at: string }> };
}

function BillingInner() {
  const params = useSearchParams();
  const [me, setMe] = useState<Me | null>(null);
  const [interval, setInterval] = useState<BillingInterval>(
    params.get("interval") === "annual" ? "annual" : "monthly",
  );
  const [currency, setCurrency] = useState<Currency>(params.get("currency") === "INR" ? "INR" : "USD");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/auth/me");
    if (res.ok) setMe((await res.json()) as Me);
  }

  useEffect(() => {
    void load();
  }, []);

  async function upgrade(plan: PlanId) {
    setError(null);
    setNotice(null);
    setBusy(plan);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, interval, currency }),
      });
      const data = (await res.json()) as {
        provider?: string;
        url?: string;
        simulateUrl?: string;
        orderId?: string;
        keyId?: string;
        error_message?: string;
      };
      if (!res.ok) {
        setError(data.error_message ?? "Checkout failed.");
        return;
      }
      if (data.provider === "simulator" && data.simulateUrl) {
        window.location.href = data.simulateUrl + `&currency=${currency}`;
      } else if (data.url) {
        window.location.href = data.url; // Dodo hosted checkout
      } else if (data.orderId && data.keyId) {
        // Razorpay: load checkout.js with the created order.
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => {
          const rzp = new (window as unknown as Record<string, new (o: object) => { open: () => void }>).Razorpay({
            key: data.keyId,
            order_id: data.orderId,
            name: "ProseFlow",
            description: `${PLANS[plan].name} plan (${interval})`,
            theme: { color: "#b45309" },
            handler: () => {
              setNotice("Payment received — your plan will activate the moment the webhook arrives.");
              void load();
            },
          });
          rzp.open();
        };
        document.body.appendChild(script);
      }
    } finally {
      setBusy(null);
    }
  }

  async function cancel() {
    setBusy("cancel");
    try {
      const res = await fetch("/api/billing/cancel", { method: "POST" });
      if (res.ok) {
        setNotice("Subscription cancelled — you are now on the Free plan. No further charges.");
        void load();
      }
    } finally {
      setBusy(null);
    }
  }

  const plan = me?.user.plan ?? "free";
  const planDetails = me?.plan_details;
  const balance = me?.credits.balance ?? 0;
  const cap = planDetails?.words_per_month ?? 500;
  const pct = Math.min(100, Math.round((balance / cap) * 100));

  return (
    <div className="max-w-5xl mx-auto px-5 py-8">
      <h1 className="text-2xl font-bold mb-6">Billing</h1>

      <div className="pf-card p-6 mb-8">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-sm pf-muted">Current plan</div>
            <div className="text-xl font-bold">
              {planDetails?.name ?? "Free"}
              {plan !== "free" && (
                <span className="pf-badge ml-2" style={{ background: "var(--pf-accent-soft)" }}>
                  active
                </span>
              )}
            </div>
          </div>
          {plan !== "free" && (
            <button
              onClick={() => void cancel()}
              disabled={busy === "cancel"}
              className="pf-btn pf-btn-ghost text-sm"
              style={{ color: "var(--pf-bad)" }}
            >
              {busy === "cancel" ? "Cancelling..." : "Cancel subscription (1 click)"}
            </button>
          )}
        </div>
        <div className="mt-6">
          <div className="flex justify-between text-sm mb-1.5">
            <span className="pf-muted">Word credits remaining this cycle</span>
            <span>
              <strong>{balance.toLocaleString()}</strong> / {cap.toLocaleString()}
            </span>
          </div>
          <div className="h-2.5 rounded-full" style={{ background: "var(--pf-surface-2)" }}>
            <div
              className="h-2.5 rounded-full transition-all"
              style={{ width: `${pct}%`, background: "var(--pf-accent)" }}
            />
          </div>
        </div>
      </div>

      {notice && (
        <p className="text-sm mb-6" style={{ color: "var(--pf-good)" }}>
          {notice}
        </p>
      )}
      {error && (
        <p className="text-sm mb-6" style={{ color: "var(--pf-bad)" }}>
          {error}
        </p>
      )}
      {params.get("checkout") === "success" && (
        <p className="text-sm mb-6 pf-muted">
          Checkout complete — your plan activates as soon as the payment provider confirms (usually
          a few seconds). This page updates automatically when the webhook lands; reload if needed.
        </p>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <h2 className="text-lg font-bold">Change plan</h2>
        <div className="flex gap-3">
          <div className="flex gap-1 rounded-full border p-1" style={{ borderColor: "var(--pf-border)" }}>
            {(["monthly", "annual"] as BillingInterval[]).map((i) => (
              <button
                key={i}
                onClick={() => setInterval(i)}
                className={`pf-btn text-xs px-3 py-1.5 rounded-full ${interval === i ? "pf-btn-primary" : ""}`}
              >
                {i === "monthly" ? "Monthly" : "Annual — save ~35%"}
              </button>
            ))}
          </div>
          <div className="flex gap-1 rounded-full border p-1" style={{ borderColor: "var(--pf-border)" }}>
            {(["USD", "INR"] as Currency[]).map((c) => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={`pf-btn text-xs px-3 py-1.5 rounded-full ${currency === c ? "pf-btn-primary" : ""}`}
              >
                {c === "USD" ? "$ USD" : "₹ INR"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {PLAN_ORDER.filter((p): p is Exclude<PlanId, "free"> => p !== "free").map((p) => {
          const pl = PLANS[p];
          const price = planPrice(pl, interval, currency);
          const current = plan === p;
          return (
            <div
              key={p}
              className="pf-card p-6 flex flex-col"
              style={pl.popular ? { borderColor: "var(--pf-accent)", borderWidth: 2 } : undefined}
            >
              <h3 className="font-bold">{pl.name}</h3>
              <div className="mt-2 text-2xl font-bold">
                {formatPrice(price, currency)}
                <span className="pf-muted text-sm font-normal"> / month</span>
              </div>
              <ul className="mt-4 text-sm space-y-2 flex-1 pf-muted">
                {pl.features.slice(0, 4).map((f) => (
                  <li key={f}>· {f}</li>
                ))}
              </ul>
              <button
                onClick={() => void upgrade(p)}
                disabled={current || busy !== null}
                className={`pf-btn mt-5 text-sm ${current ? "pf-btn-ghost" : "pf-btn-primary"}`}
              >
                {current ? "Current plan" : busy === p ? "Starting checkout..." : `Choose ${pl.name}`}
              </button>
            </div>
          );
        })}
      </div>

      <h2 className="text-lg font-bold mt-10 mb-3">Credit history</h2>
      <div className="pf-card divide-y" style={{ borderColor: "var(--pf-border)" }}>
        {(me?.credits.recent_ledger ?? []).length === 0 ? (
          <p className="p-5 pf-muted text-sm">No credit activity yet.</p>
        ) : (
          (me?.credits.recent_ledger ?? []).map((row) => (
            <div key={row.id} className="p-4 flex items-center justify-between text-sm">
              <span className="pf-muted">
                {row.reason.replace(/_/g, " ")} · {row.created_at.slice(0, 16).replace("T", " ")}
              </span>
              <span style={{ color: row.delta > 0 ? "var(--pf-good)" : "var(--pf-text)" }}>
                {row.delta > 0 ? "+" : ""}
                {row.delta.toLocaleString()} words
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense>
      <BillingInner />
    </Suspense>
  );
}
