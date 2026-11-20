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
    <section id="pricing" className="max-w-6xl mx-auto px-5 py-20 md:py-24">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-3xl md:text-5xl font-bold tracking-[-0.03em]">
          Simple pricing that scales with your writing
        </h2>
        <p className="pf-muted mt-4 text-base md:text-lg">
          Every plan includes zero text retention, Fidelity Shield fact checks, and one-click cancellation.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
          <div
            className="inline-flex gap-1 rounded-lg border p-1"
            style={{ background: "var(--pf-surface-pure)", borderColor: "var(--pf-border)" }}
          >
            {(["monthly", "annual"] as BillingInterval[]).map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setInterval(i)}
                className={`pf-btn text-sm px-4 py-1.5 ${
                  interval === i ? "pf-btn-primary" : ""
                }`}
                style={interval === i ? undefined : { color: "var(--pf-muted)" }}
              >
                {i === "monthly" ? "Monthly" : "Annual"}
                {i === "annual" && (
                  <span
                    className="text-[11px] font-bold px-2 py-0.5 rounded"
                    style={
                      interval === i
                        ? { background: "rgba(255,255,255,0.18)", color: "inherit" }
                        : { background: "var(--pf-accent-soft)", color: "var(--pf-accent)" }
                    }
                  >
                    Save ~35%
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
                className={`pf-btn text-sm px-3.5 py-1.5 ${
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

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4 items-stretch">
        {PLAN_ORDER.map((id) => {
          const plan = PLANS[id];
          const monthly = planPrice(plan, interval, currency);
          const isPro = Boolean(plan.popular);
          return (
            <div
              key={plan.id}
              className={`pf-card-pure pf-card-hover p-6 flex flex-col relative ${
                isPro ? "lg:-translate-y-2 shadow-xl shadow-stone-900/15" : ""
              }`}
              style={
                isPro
                  ? {
                      background: "var(--pf-espresso)",
                      color: "var(--pf-espresso-ink)",
                      borderColor: "var(--pf-accent)",
                      borderWidth: 2,
                    }
                  : undefined
              }
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  {isPro && (
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded"
                      style={{ background: "var(--pf-accent)", color: "var(--pf-btn-ink)" }}
                    >
                      Popular
                    </span>
                  )}
                </div>
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded pf-mono"
                  style={
                    isPro
                      ? { background: "rgba(255,255,255,0.08)", color: "var(--pf-espresso-soft)" }
                      : { background: "var(--pf-surface-2)", color: "var(--pf-muted)" }
                  }
                >
                  {plan.features[0]}
                </span>
              </div>

              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="text-4xl font-bold tracking-tight">
                  {formatPrice(monthly, currency)}
                </span>
                <span
                  className="text-sm"
                  style={{ color: isPro ? "var(--pf-espresso-muted)" : "var(--pf-muted)" }}
                >
                  / month
                </span>
              </div>

              <p
                className="text-xs mt-1.5 min-h-[18px]"
                style={{ color: isPro ? "var(--pf-espresso-muted)" : "var(--pf-muted)" }}
              >
                {interval === "annual" && id !== "free"
                  ? `${annualTotal(plan, currency)} billed yearly`
                  : id === "free"
                    ? "Free forever · no card needed"
                    : "Billed monthly · cancel anytime"}
              </p>

              <div
                className="my-5 border-t"
                style={{ borderColor: isPro ? "var(--pf-espresso-border)" : "var(--pf-border)" }}
              />

              <ul className="space-y-3 text-sm flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <span
                      className="mt-0.5 inline-flex items-center justify-center w-4 h-4 rounded shrink-0 text-[10px] font-bold"
                      style={
                        isPro
                          ? { background: "var(--pf-accent)", color: "var(--pf-btn-ink)" }
                          : { background: "var(--pf-accent-soft)", color: "var(--pf-accent)" }
                      }
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
                className={`pf-btn mt-7 text-sm w-full ${
                  isPro ? "pf-btn-primary" : "pf-btn-ghost"
                }`}
              >
                {id === "free" ? "Start free" : `Choose ${plan.name} →`}
              </a>
            </div>
          );
        })}
      </div>

      <p className="pf-muted text-xs text-center mt-10">
        Prices in USD and INR (UPI &amp; global cards). Fair 7-day refund policy — see{" "}
        <a className="pf-link" href="/refunds">
          refunds
        </a>
        . Questions?{" "}
        <a className="pf-link" href={`mailto:${BRAND.supportEmail}`}>
          {BRAND.supportEmail}
        </a>
      </p>
    </section>
  );
}
