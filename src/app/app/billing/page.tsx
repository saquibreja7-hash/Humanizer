"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  PLANS,
  PLAN_ORDER,
  planPrice,
  formatPrice,
  annualTotal,
  type BillingInterval,
  type Currency,
  type PlanId,
} from "@/lib/brand";

interface Me {
  user: { plan: string };
  plan_details: { name: string; words_per_month: number };
  credits: {
    balance: number;
    recent_ledger: Array<{ id: number; delta: number; reason: string; created_at: string }>;
  };
}

function BillingInner() {
  const params = useSearchParams();
  const [me, setMe] = useState<Me | null>(null);
  const [interval, setInterval] = useState<BillingInterval>(
    params.get("interval") === "annual" ? "annual" : "monthly",
  );
  const [currency, setCurrency] = useState<Currency>(
    params.get("currency") === "INR" ? "INR" : "USD",
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(
    params.get("purchased") === "1"
      ? "Plan upgraded. Your fresh word credits are active immediately."
      : null,
  );

  const load = useCallback(async () => {
    const res = await fetch("/api/auth/me");
    if (res.ok) {
      setMe((await res.json()) as Me);
      window.dispatchEvent(new Event("proseflow:credits-updated"));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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
        window.location.href = data.url;
      } else if (data.orderId && data.keyId) {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => {
          const rzp = new (
            window as unknown as Record<string, new (o: object) => { open: () => void }>
          ).Razorpay({
            key: data.keyId,
            order_id: data.orderId,
            name: "ProseFlow",
            description: `${PLANS[plan].name} plan (${interval})`,
            theme: { color: "var(--pf-accent)" },
            handler: () => {
              setNotice("Payment received. Your plan will activate as soon as the webhook arrives.");
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
    setError(null);
    try {
      const res = await fetch("/api/billing/cancel", { method: "POST" });
      if (res.ok) {
        setNotice("Subscription cancelled. You are now on the Free plan.");
        setConfirmCancel(false);
        void load();
      } else {
        setError("Could not cancel right now. Please try again.");
      }
    } finally {
      setBusy(null);
    }
  }

  const currentPlan = me?.user.plan ?? "free";
  const planDetails = me?.plan_details;
  const balance = me?.credits.balance ?? 0;
  const cap = planDetails?.words_per_month ?? 500;
  const pct = Math.min(100, Math.round((balance / Math.max(1, cap)) * 100));
  const ledger = me?.credits.recent_ledger ?? [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
      {/* Clean White Balance Summary */}
      <section className="pf-card p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-xl">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-[-0.03em]">
            {planDetails?.name ?? "Free"} Plan
          </h1>
          <p className="pf-muted text-sm mt-1.5 leading-relaxed">
            Transparent word credits with USD and INR checkout. Cancel anytime, backed by our 7-day
            refund guarantee.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link href="/app" className="pf-btn pf-btn-primary text-xs px-4 py-2">
              Back to Studio
            </Link>
            <Link href="/refunds" className="text-xs font-semibold pf-link">
              7-day refund policy
            </Link>
            {currentPlan !== "free" && !confirmCancel && (
              <button
                type="button"
                onClick={() => setConfirmCancel(true)}
                className="text-xs font-semibold pf-muted hover:text-[var(--pf-bad)] transition-colors cursor-pointer"
              >
                Cancel subscription
              </button>
            )}
          </div>

          {confirmCancel && (
            <div
              className="mt-4 rounded-xl border p-4 text-xs flex flex-wrap items-center justify-between gap-3"
              style={{
                background: "var(--pf-surface-pure)",
                borderColor: "var(--pf-bad)",
              }}
            >
              <span>Switch back to Free immediately? No further renewals will be billed.</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmCancel(false)}
                  className="pf-btn pf-btn-ghost text-xs px-3 py-1.5"
                >
                  Keep plan
                </button>
                <button
                  type="button"
                  disabled={busy === "cancel"}
                  onClick={() => void cancel()}
                  className="pf-btn text-xs px-3 py-1.5"
                  style={{ background: "var(--pf-bad)", color: "var(--pf-btn-ink)" }}
                >
                  {busy === "cancel" ? "Cancelling..." : "Confirm cancel"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div
          className="rounded-xl border p-5 min-w-[260px]"
          style={{ background: "var(--pf-surface-pure)", borderColor: "var(--pf-border)" }}
        >
          <div className="text-xs font-semibold pf-muted">Available balance</div>
          <div className="text-3xl font-bold pf-mono mt-1">{balance.toLocaleString()}</div>
          <div className="text-xs pf-muted mt-0.5">of {cap.toLocaleString()} monthly words</div>
          <div className="mt-3.5 h-2 rounded-full overflow-hidden" style={{ background: "var(--pf-surface-2)" }}>
            <div
              className="h-full rounded-full transition-opacity duration-500"
              style={{ width: `${pct}%`, background: "var(--pf-accent)" }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] pf-muted">
            <span>{pct}% remaining</span>
            <span>0 bytes text logged</span>
          </div>
        </div>
      </section>

      {notice && (
        <div
          className="rounded-xl border px-4 py-3 text-sm font-medium flex items-center gap-2.5"
          style={{
            background: "var(--pf-surface-pure)",
            borderColor: "var(--pf-good)",
            color: "var(--pf-good)",
          }}
        >
          <span>✓</span>
          <span>{notice}</span>
        </div>
      )}
      {error && (
        <div
          role="alert"
          className="rounded-xl border px-4 py-3 text-sm font-medium flex items-center gap-2.5"
          style={{
            background: "var(--pf-surface-pure)",
            borderColor: "var(--pf-bad)",
            color: "var(--pf-bad)",
          }}
        >
          <span>!</span>
          <span>{error}</span>
        </div>
      )}

      {/* Plans Header + Controls */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-[-0.025em]">Choose your plan</h2>
            <p className="pf-muted text-sm mt-1">
              {currency === "INR"
                ? "India checkout via Razorpay (UPI, cards, NetBanking)."
                : "Global checkout via Dodo Payments (cards, Apple Pay, VAT/GST handled)."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div
              className="inline-flex rounded-lg border p-1 gap-1"
              style={{ borderColor: "var(--pf-border)", background: "var(--pf-surface)" }}
            >
              {(["USD", "INR"] as Currency[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCurrency(c)}
                  className="px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors"
                  style={
                    currency === c
                      ? { background: "var(--pf-accent)", color: "var(--pf-btn-ink)" }
                      : { color: "var(--pf-muted)" }
                  }
                >
                  {c === "USD" ? "USD ($)" : "INR (₹)"}
                </button>
              ))}
            </div>

            <div
              className="inline-flex rounded-lg border p-1 gap-1"
              style={{ borderColor: "var(--pf-border)", background: "var(--pf-surface)" }}
            >
              {(["monthly", "annual"] as BillingInterval[]).map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setInterval(i)}
                  className="px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors"
                  style={
                    interval === i
                      ? { background: "var(--pf-accent)", color: "var(--pf-btn-ink)" }
                      : { color: "var(--pf-muted)" }
                  }
                >
                  {i === "monthly" ? "Monthly" : "Annual (-35%)"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Side-by-side payment tiles (2-col on mobile, 4-col on desktop) */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-5 items-stretch">
          {PLAN_ORDER.map((id) => {
            const p = PLANS[id];
            const isCurrent = currentPlan === id;
            const price = planPrice(p, interval, currency);
            const featured = Boolean(p.popular);

            return (
              <div
                key={id}
                className="pf-card-pure pf-card-hover p-4 sm:p-6 flex flex-col justify-between"
                style={
                  isCurrent || featured
                    ? {
                        borderColor: "var(--pf-accent)",
                        borderWidth: 2,
                        background: featured
                          ? "color-mix(in srgb, var(--pf-accent-soft) 24%, var(--pf-surface-pure))"
                          : undefined,
                      }
                    : undefined
                }
              >
                <div>
                  <div className="flex items-center justify-between gap-1.5 flex-wrap">
                    <h3 className="text-base sm:text-lg font-bold">{p.name}</h3>
                    {isCurrent ? (
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-semibold"
                        style={{ background: "var(--pf-accent-soft)", color: "var(--pf-accent)" }}
                      >
                        Current
                      </span>
                    ) : featured ? (
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-semibold"
                        style={{ background: "var(--pf-accent)", color: "var(--pf-btn-ink)" }}
                      >
                        Popular
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 sm:mt-4 flex items-baseline gap-1">
                    <span className="text-2xl sm:text-3xl font-bold pf-mono tracking-tight">
                      {formatPrice(price, currency)}
                    </span>
                    <span className="text-xs pf-muted">/ mo</span>
                  </div>
                  <div className="text-[11px] mt-1 min-h-[16px] pf-muted">
                    {price === 0
                      ? "Free forever"
                      : interval === "annual"
                        ? `${annualTotal(p, currency)} / year`
                        : "Billed monthly"}
                  </div>

                  <ul className="mt-4 space-y-2 text-xs leading-relaxed">
                    {p.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2">
                        <span className="font-bold mt-0.5 pf-accent">✓</span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-5 pt-4 border-t" style={{ borderColor: "var(--pf-border)" }}>
                  {id === "free" ? (
                    <div className="text-center text-xs py-2 font-semibold pf-muted">
                      {isCurrent ? "Active free tier" : "Default tier"}
                    </div>
                  ) : isCurrent ? (
                    <button
                      type="button"
                      disabled
                      className="pf-btn pf-btn-ghost w-full py-2 text-xs opacity-65"
                    >
                      Active plan
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => void upgrade(id)}
                      className={`pf-btn w-full py-2 text-xs whitespace-nowrap ${
                        featured ? "pf-btn-primary" : "pf-btn-ghost"
                      }`}
                    >
                      {busy === id ? "Opening..." : `Upgrade to ${p.name}`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Credit Activity Ledger */}
      <section className="pf-card-pure overflow-hidden">
        <div
          className="px-5 sm:px-6 py-4 border-b flex flex-wrap items-center justify-between gap-2"
          style={{ borderColor: "var(--pf-border)", background: "var(--pf-surface)" }}
        >
          <div>
            <h2 className="text-base font-bold">Credit activity</h2>
            <p className="pf-muted text-xs mt-0.5">
              Only anonymous word counts and timestamps are recorded. Drafts are never saved.
            </p>
          </div>
          <span className="pf-badge pf-mono text-[11px]" style={{ background: "var(--pf-surface-pure)" }}>
            {ledger.length} entries
          </span>
        </div>

        {ledger.length === 0 ? (
          <div className="p-8 text-center text-sm pf-muted">
            No credit transactions yet. Run your first refinement in the{" "}
            <Link href="/app" className="pf-link">
              Studio
            </Link>
            .
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b text-xs pf-muted" style={{ borderColor: "var(--pf-border)" }}>
                  <th className="py-3 px-5 font-semibold">Activity</th>
                  <th className="py-3 px-5 font-semibold">Words</th>
                  <th className="py-3 px-5 font-semibold text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--pf-border)" }}>
                {ledger.map((row) => (
                  <tr key={row.id}>
                    <td className="py-3.5 px-5 font-medium capitalize">
                      {row.reason.replace(/_/g, " ")}
                    </td>
                    <td className="py-3.5 px-5">
                      <span
                        className="pf-mono font-bold px-2 py-0.5 rounded text-xs"
                        style={{
                          background:
                            row.delta >= 0
                              ? "color-mix(in srgb, var(--pf-good) 14%, transparent)"
                              : "var(--pf-accent-soft)",
                          color: row.delta >= 0 ? "var(--pf-good)" : "var(--pf-accent)",
                        }}
                      >
                        {row.delta >= 0 ? `+${row.delta.toLocaleString()}` : row.delta.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right pf-muted pf-mono text-xs">
                      {new Date(row.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
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
