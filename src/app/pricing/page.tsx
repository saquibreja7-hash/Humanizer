import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import PricingSection from "@/components/PricingSection";

export const metadata: Metadata = {
  title: "Pricing",
  description: `Transparent monthly and annual word credits in USD and INR for ${BRAND.name}. Start with 500 free words, backed by a 7-day refund guarantee.`,
};

const BILLING_FAQ = [
  {
    q: "How do word credits work?",
    a: "Credits count strictly on the words in your submitted draft. Regenerating a single paragraph deducts only that paragraph's word count.",
  },
  {
    q: "Which currencies and payment methods are supported?",
    a: "Pay in USD via Dodo Payments (Cards, Apple Pay, Google Pay, VAT/GST handled) or switch to INR for Razorpay (UPI, RuPay, cards, NetBanking).",
  },
  {
    q: "Can I cancel anytime or get a refund?",
    a: "Cancel in one click anytime from Billing, backed by our 7-day fair refund policy.",
  },
  {
    q: "What happens if a request fails?",
    a: "Failed or interrupted requests never consume your word credits.",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-dvh flex flex-col">
      <PublicHeader />

      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-5 pt-14 md:pt-20 pb-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-[-0.035em]">
            Pay only for the words you refine.
          </h1>
          <p className="pf-muted mt-4 text-base max-w-lg mx-auto">
            500 free words monthly. USD or INR, cancel anytime.
          </p>
        </section>

        <PricingSection />

        <section className="max-w-3xl mx-auto px-5 pb-20">
          <h2 className="text-2xl font-bold tracking-[-0.025em] mb-6">
            Billing &amp; refund questions
          </h2>
          <div className="divide-y border-t border-b" style={{ borderColor: "var(--pf-border)" }}>
            {BILLING_FAQ.map((item) => (
              <details key={item.q} className="pf-faq py-5">
                <summary className="font-semibold text-sm sm:text-base cursor-pointer list-none flex items-center justify-between gap-4">
                  <span>{item.q}</span>
                  <span className="pf-faq-icon pf-muted font-mono text-lg leading-none">+</span>
                </summary>
                <p className="pf-muted text-sm mt-3 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>

          <div className="mt-8 text-xs pf-muted">
            Read full{" "}
            <Link href="/refunds" className="pf-link font-semibold">
              7-Day Refund Policy
            </Link>{" "}
            and{" "}
            <Link href="/terms" className="pf-link font-semibold">
              Terms of Service
            </Link>
            .
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
