"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AnimatedRing from "@/components/AnimatedRing";
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
      ? "Plan upgraded! Your fresh word credits are active immediately."
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
            theme: { color: "#7c3539" },
            handler: () => {
              setNotice("Payment received — your plan will activate as soon as the webhook arrives.");
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
        setNotice("Subscription cancelled — you are now on the Free plan. No further charges.");
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
      {/* Deep Espresso Account Balance Hero Card with Editorial Backdrop */}
      <section
        className="relative rounded-2xl overflow-hidden border pf-espresso-band shadow-xl shadow-black/20"
        style={{ borderColor: "var(--pf-espresso-border)" }}
      >
        <Image
          src="/images/trust-banner.jpg"
          alt="Archival cream cotton paper stack bound with oxblood ribbon on a dark walnut desk"
          fill
          priority
          sizes="(max-width: 1280px) 100vw, 1280px"
          className="object-cover object-right opacity-45"
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(95deg, rgba(36,16,14,0.97) 0%, rgba(36,16,14,0.88) 55%, rgba(36,16,14,0.55) 100%)",
          }}
        />

        <div className="relative z-10 p-6 sm:p-8 lg:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#e5a6aa]">
              <span>✳ Subscription &amp; Word Credits</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-[-0.03em] text-[#f4f1ea] mt-2">
              {planDetails?.name ?? "Free"} Plan
            </h1>
            <p className="text-sm mt-2 leading-relaxed" style={{ color: "#d5c7c2" }}>
              Simple, transparent word credits with instant global USD and India INR checkout.
              Cancel in one click anytime, backed by our 7-day refund guarantee.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link href="/app" className="pf-btn pf-btn-primary text-xs px-4 py-2">
                ← Back to Studio
              </Link>
              <Link
                href="/refunds"
                className="text-xs font-semibold text-[#e5a6aa] hover:underline px-2 py-1"
              >
                7-day refund policy →
              </Link>
              {currentPlan !== "free" && !confirmCancel && (
                <button
                  type="button"
                  onClick={() => setConfirmCancel(true)}
                  className="text-xs font-semibold text-[#bca7a2] hover:text-[#f87171] transition-colors cursor-pointer px-2 py-1"
                >
                  Cancel subscription
                </button>
              )}
            </div>

            {confirmCancel && (
              <div
                className="mt-4 rounded-xl border p-4 text-xs flex flex-wrap items-center justify-between gap-3"
                style={{
                  background: "rgba(36,16,14,0.92)",
                  borderColor: "rgba(248,113,113,0.45)",
                }}
              >
                <span className="text-[#f4f1ea]">
                  Switch back to the Free plan immediately? No further renewals will be billed.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmCancel(false)}
                    className="px-3 py-1.5 rounded-md border text-[#f4f1ea] cursor-pointer"
                    style={{ borderColor: "var(--pf-espresso-border)" }}
                  >
                    Keep plan
                  </button>
                  <button
                    type="button"
                    disabled={busy === "cancel"}
                    onClick={() => void cancel()}
                    className="px-3 py-1.5 rounded-md font-semibold text-white cursor-pointer"
                    style={{ background: "#9f2525" }}
                  >
                    {busy === "cancel" ? "Cancelling..." : "Confirm cancel"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right: Live Ring Gauge + Balance Card */}
          <div
            className="rounded-xl border p-5 sm:p-6 min-w-[280px] backdrop-blur-md"
            style={{
              background: "rgba(36, 16, 14, 0.85)",
              borderColor: "var(--pf-espresso-border)",
            }}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: "var(--pf-espresso-muted)" }}>
                  Available Balance
                </div>
                <div className="text-3xl font-bold pf-mono text-[#f4f1ea] mt-1">
                  {balance.toLocaleString()}
                </div>
                <div className="text-xs mt-1" style={{ color: "var(--pf-espresso-muted)" }}>
                  of {cap.toLocaleString()} monthly words
                </div>
              </div>
              <AnimatedRing percent={pct} stroke="#f4f1ea" size={58} />
            </div>
            <div className="mt-4 h-2 rounded-full overflow-hidden bg-white/10">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: "#c96d72" }}
              />
            </div>
            <div className="mt-2.5 flex items-center justify-between text-[11px]" style={{ color: "var(--pf-espresso-muted)" }}>
              <span>{pct}% remaining</span>
              <span>0 bytes text logged</span>
            </div>
          </div>
        </div>
      </section>

      {/* Alerts */}
      {notice && (
        <div
          className="rounded-xl border px-4 py-3 text-sm font-medium flex items-center gap-2.5"
          style={{
            background: "color-mix(in srgb, var(--pf-good) 12%, var(--pf-surface-pure))",
            borderColor: "color-mix(in srgb, var(--pf-good) 35%, var(--pf-border))",
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
            background: "color-mix(in srgb, var(--pf-bad) 10%, var(--pf-surface-pure))",
            borderColor: "color-mix(in srgb, var(--pf-bad) 35%, var(--pf-border))",
            color: "var(--pf-bad)",
          }}
        >
          <span>!</span>
          <span>{error}</span>
        </div>
      )}

      {/* Plans Header + Currency & Interval Controls */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-[-0.025em]">Choose your writing tier</h2>
            <p className="pf-muted text-sm mt-1">
              {currency === "INR"
                ? "India checkout via Razorpay (UPI, RuPay, Visa, Mastercard, NetBanking)."
                : "Global checkout via Dodo Payments (Cards, Apple Pay, Google Pay, VAT/GST handled)."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Currency Switch */}
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
                      ? { background: "var(--pf-espresso)", color: "#f4f1ea" }
                      : { color: "var(--pf-muted)" }
                  }
                >
                  {c === "USD" ? "USD ($)" : "INR (₹)"}
                </button>
              ))}
            </div>

            {/* Interval Switch */}
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
                      ? { background: "var(--pf-accent)", color: "#ffffff" }
                      : { color: "var(--pf-muted)" }
                  }
                >
                  {i === "monthly" ? "Monthly" : "Annual · Save 33%"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 4 Plan Cards */}
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
          {PLAN_ORDER.map((id) => {
            const p = PLANS[id];
            const isCurrent = currentPlan === id;
            const price = planPrice(p, interval, currency);
            const featured = Boolean(p.popular);

            return (
              <div
                key={id}
                className={`rounded-2xl border p-6 flex flex-col justify-between transition-all ${
                  featured ? "pf-dark-card" : "pf-card-pure pf-card-hover"
                }`}
                style={
                  isCurrent && !featured
                    ? { borderColor: "var(--pf-accent)", borderWidth: 2 }
                    : undefined
                }
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3
                      className={`text-lg font-bold ${featured ? "text-[#f4f1ea]" : ""}`}
                    >
                      {p.name}
                    </h3>
                    {isCurrent ? (
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                        style={{
                          background: featured ? "#dfdacc" : "var(--pf-accent-soft)",
                          color: featured ? "#1a1311" : "var(--pf-accent)",
                        }}
                      >
                        Current
                      </span>
                    ) : featured ? (
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                        style={{ background: "var(--pf-accent)", color: "#ffffff" }}
                      >
                        Most Popular
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-4 flex items-baseline gap-1">
                    <span
                      className={`text-3xl font-bold pf-mono tracking-tight ${
                        featured ? "text-[#f4f1ea]" : ""
                      }`}
                    >
                      {formatPrice(price, currency)}
                    </span>
                    <span
                      className="text-xs"
                      style={{ color: featured ? "var(--pf-espresso-muted)" : "var(--pf-muted)" }}
                    >
                      / month
                    </span>
                  </div>
                  <div
                    className="text-[11px] mt-1 min-h-[16px]"
                    style={{ color: featured ? "var(--pf-espresso-muted)" : "var(--pf-muted)" }}
                  >
                    {price === 0
                      ? "Free forever · 500 starter words"
                      : interval === "annual"
                        ? `Billed ${annualTotal(p, currency)} yearly`
                        : "Billed monthly · cancel anytime"}
                  </div>

                  <ul className="mt-5 space-y-2.5 text-xs leading-relaxed">
                    {p.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2">
                        <span
                          className="font-bold mt-0.5"
                          style={{ color: featured ? "#e5a6aa" : "var(--pf-accent)" }}
                        >
                          ✓
                        </span>
                        <span style={{ color: featured ? "#e7dcd7" : "var(--pf-text)" }}>
                          {feat}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t" style={{ borderColor: featured ? "var(--pf-espresso-border)" : "var(--pf-border)" }}>
                  {id === "free" ? (
                    <div
                      className="text-center text-xs py-2.5 font-semibold"
                      style={{ color: "var(--pf-muted)" }}
                    >
                      {isCurrent ? "Active free tier" : "Included by default"}
                    </div>
                  ) : isCurrent ? (
                    <button
                      type="button"
                      disabled
                      className="pf-btn w-full py-2.5 text-xs opacity-65"
                      style={{
                        background: featured ? "rgba(255,255,255,0.12)" : "var(--pf-surface)",
                        color: featured ? "#f4f1ea" : "var(--pf-text)",
                      }}
                    >
                      Active plan
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => void upgrade(id)}
                      className="pf-btn pf-btn-primary w-full py-2.5 text-xs"
                    >
                      {busy === id ? "Opening checkout..." : `Upgrade to ${p.name} →`}
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
            <h2 className="text-base font-bold">Credit Activity Ledger</h2>
            <p className="pf-muted text-xs mt-0.5">
              Only anonymous word counts and timestamps are recorded — your drafts are never saved.
            </p>
          </div>
          <span className="pf-badge pf-mono text-[11px]" style={{ background: "var(--pf-surface-pure)" }}>
            {ledger.length} recent entries
          </span>
        </div>

        {ledger.length === 0 ? (
          <div className="p-8 text-center text-sm pf-muted">
            No credit transactions yet. Run your first refinement in the{" "}
            <Link href="/app" className="pf-link">
              Writing Studio
            </Link>
            .
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr
                  className="border-b text-[11px] uppercase tracking-wider pf-muted"
                  style={{ borderColor: "var(--pf-border)" }}
                >
                  <th className="py-3 px-5 font-semibold">Activity</th>
                  <th className="py-3 px-5 font-semibold">Words</th>
                  <th className="py-3 px-5 font-semibold text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--pf-border)" }}>
                {ledger.map((row) => (
                  <tr key={row.id} className="hover:bg-black/[0.02]">
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
