"use client";

import { useState } from "react";
import {
  PLANS,
  PLAN_ORDER,
  formatPrice,
  planPrice,
  annualTotal,
  BRAND,
  type BillingInterval,
  type Currency,
} from "@/lib/brand";

export default function PricingSection() {
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const [currency, setCurrency] = useState<Currency>("USD");

  return (
    <section id="pricing" className="max-w-6xl mx-auto px-5 py-16">
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
          Simple pricing that scales with your writing
        </h2>
        <p className="pf-muted mt-3 max-w-xl mx-auto">
          Start free with 500 words a month. Upgrade when your drafts grow.
        </p>

        <div className="mt-8 flex items-center justify-center gap-4 flex-wrap">
          <div className="flex gap-1 rounded-full border p-1" style={{ borderColor: "var(--pf-border)" }}>
            {(["monthly", "annual"] as BillingInterval[]).map((i) => (
              <button
                key={i}
                onClick={() => setInterval(i)}
                className={`pf-btn text-sm px-4 py-1.5 rounded-full ${interval === i ? "pf-btn-primary" : ""}`}
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
                className={`pf-btn text-sm px-4 py-1.5 rounded-full ${currency === c ? "pf-btn-primary" : ""}`}
              >
                {c === "USD" ? "$ USD" : "₹ INR"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {PLAN_ORDER.map((id) => {
          const plan = PLANS[id];
          const monthly = planPrice(plan, interval, currency);
          return (
            <div
              key={plan.id}
              className="pf-card p-6 flex flex-col relative"
              style={
                plan.popular
                  ? { borderColor: "var(--pf-accent)", borderWidth: 2 }
                  : undefined
              }
            >
              {plan.popular && (
                <span
                  className="pf-badge absolute -top-3 left-1/2 -translate-x-1/2"
                  style={{ background: "var(--pf-accent)", color: "#fff", borderColor: "var(--pf-accent)" }}
                >
                  Most popular
                </span>
              )}
              <h3 className="text-lg font-bold">{plan.name}</h3>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-3xl font-bold">{formatPrice(monthly, currency)}</span>
                <span className="pf-muted text-sm">/ month</span>
              </div>
              {interval === "annual" && id !== "free" && (
                <p className="pf-muted text-xs mt-1">
                  {annualTotal(plan, currency)} billed yearly
                </p>
              )}
              <ul className="mt-5 space-y-2.5 text-sm flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="pf-accent font-bold">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <a
                href={id === "free" ? "/login" : `/login?plan=${id}&interval=${interval}&currency=${currency}`}
                className={`pf-btn mt-6 text-sm ${plan.popular ? "pf-btn-primary" : "pf-btn-ghost"}`}
              >
                {id === "free" ? "Start free" : `Choose ${plan.name}`}
              </a>
            </div>
          );
        })}
      </div>

      <p className="pf-muted text-xs text-center mt-8">
        Prices in USD and INR. 7-day refund policy — see{" "}
        <a className="pf-link" href="/refunds">
          refunds
        </a>
        . Cancel anytime in one click. Questions? {BRAND.supportEmail}
      </p>
    </section>
  );
}
