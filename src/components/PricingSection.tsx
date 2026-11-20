"use client";

import { useState } from "react";
import {
  BRAND,
  PLANS,
  PLAN_ORDER,
  planPrice,
  formatPrice,
  annualTotal,
  type BillingInterval,
  type Currency,
} from "@/lib/brand";

export default function PricingSection() {
  const [interval, setInterval] = useState<BillingInterval>("annual");
  const [currency, setCurrency] = useState<Currency>("USD");

  return (
    <section id="pricing" className="max-w-6xl mx-auto px-4 sm:px-5 py-16 md:py-20">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h2 className="text-3xl md:text-5xl font-bold tracking-[-0.03em]">
          Simple pricing that scales with your writing
        </h2>
        <p className="pf-muted mt-3 text-base">
          Zero text retention, Fidelity Shield fact checks, and one-click cancellation.
        </p>

        <div className="mt-7 flex items-center justify-center gap-3 flex-wrap">
          <div
            className="inline-flex gap-1 rounded-lg border p-1"
            style={{ background: "var(--pf-surface-pure)", borderColor: "var(--pf-border)" }}
          >
            {(["monthly", "annual"] as BillingInterval[]).map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setInterval(i)}
                className={`pf-btn text-xs sm:text-sm px-3.5 sm:px-4 py-1.5 ${
                  interval === i ? "pf-btn-primary" : ""
                }`}
                style={interval === i ? undefined : { color: "var(--pf-muted)" }}
              >
                {i === "monthly" ? "Monthly" : "Annual"}
                {i === "annual" && (
                  <span
                    className="text-[11px] font-bold px-1.5 py-0.5 rounded"
                    style={
                      interval === i
                        ? { background: "rgba(255,255,255,0.18)", color: "inherit" }
                        : { background: "var(--pf-accent-soft)", color: "var(--pf-accent)" }
                    }
                  >
                    -35%
                  </span>
                )}
              </button>
            ))}
          </div>

          <div
            className="inline-flex gap-1 rounded-lg border p-1"
            style={{ background: "var(--pf-surface-pure)", borderColor: "var(--pf-border)" }}
          >
            {(["USD", "INR"] as Currency[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCurrency(c)}
                className={`pf-btn text-xs sm:text-sm px-3 py-1.5 ${
                  currency === c ? "pf-btn-primary" : ""
                }`}
                style={currency === c ? undefined : { color: "var(--pf-muted)" }}
              >
                {c === "USD" ? "$ USD" : "₹ INR"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Side-by-side horizontal row (swipeable on mobile, 4 equal columns on desktop) */}
      <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pt-2 pb-4 -mx-4 px-4 lg:mx-0 lg:px-0 lg:pb-0 lg:grid lg:grid-cols-4 lg:gap-5 lg:overflow-visible items-stretch">
        {PLAN_ORDER.map((id) => {
          const plan = PLANS[id];
          const monthly = planPrice(plan, interval, currency);
          const isPro = Boolean(plan.popular);
          return (
            <div
              key={plan.id}
              className={`pf-card-pure pf-lift p-5 sm:p-6 flex flex-col shrink-0 w-[265px] sm:w-[290px] lg:w-auto snap-start relative ${
                isPro ? "pf-glow" : ""
              }`}
              style={
                isPro
                  ? {
                      borderColor: "var(--pf-gold)",
                      borderWidth: 2,
                      background: "linear-gradient(180deg, var(--pf-gold-soft) 0%, var(--pf-surface-pure) 55%)",
                    }
                  : undefined
              }
            >
              <div className="flex items-center justify-between gap-1.5 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold">{plan.name}</h3>
                {isPro && (
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: "var(--pf-gold)", color: "#1b1406" }}
                  >
                    ★ Most popular
                  </span>
                )}
              </div>

              <div className="mt-3 sm:mt-4 flex items-baseline gap-1">
                <span className="text-2xl sm:text-4xl font-bold tracking-tight pf-mono">
                  {formatPrice(monthly, currency)}
                </span>
                <span className="text-xs sm:text-sm pf-muted">/ mo</span>
              </div>

              <p className="text-[11px] sm:text-xs mt-1 pf-muted min-h-[18px]">
                {interval === "annual" && id !== "free"
                  ? `${annualTotal(plan, currency)} / year`
                  : id === "free"
                    ? "Free forever"
                    : "Billed monthly"}
              </p>

              <div className="my-3.5 sm:my-5 border-t" style={{ borderColor: "var(--pf-border)" }} />

              <ul className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span
                      className="mt-0.5 inline-flex items-center justify-center w-4 h-4 rounded shrink-0 text-[10px] font-bold"
                      style={{ background: "var(--pf-sage-soft)", color: "var(--pf-sage)" }}
                    >
                      ✓
                    </span>
                    <span className="leading-snug">{f}</span>
                  </li>
                ))}
              </ul>

              <a
                href={
                  id === "free"
                    ? "/login?mode=signup"
                    : `/login?mode=signup&plan=${id}&interval=${interval}&currency=${currency}`
                }
                className={`pf-btn mt-5 sm:mt-6 text-xs sm:text-sm w-full py-2.5 whitespace-nowrap ${
                  isPro ? "pf-btn-primary" : "pf-btn-ghost"
                }`}
              >
                {id === "free" ? "Start free" : `Choose ${plan.name}`}
              </a>
            </div>
          );
        })}
      </div>

      <p className="pf-muted text-xs text-center mt-8">
        {currency === "INR"
          ? "India checkout via Razorpay (UPI, cards, NetBanking)."
          : "Global checkout via Dodo Payments (cards, Apple Pay, VAT/GST handled)."}{" "}
        <a href="/refunds" className="pf-link">
          {BRAND.refundWindowDays}-day refund policy
        </a>
        .
      </p>
    </section>
  );
}
