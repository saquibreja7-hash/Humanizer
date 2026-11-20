import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import PublicHeader, { BrandAsterisk } from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import PricingSection from "@/components/PricingSection";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Pricing",
  description: `Transparent monthly and annual word credits in USD and INR for ${BRAND.name}. Start with 500 free words—backed by a 7-day fair refund guarantee.`,
};

const BILLING_FAQ = [
  {
    q: "How do word credits work?",
    a: "Credits are counted strictly on the words in your submitted draft. Regenerating a single paragraph deducts only that paragraph's word count.",
  },
  {
    q: "Which currencies and payment methods are supported?",
    a: "Global customers pay in USD via Dodo Payments (Cards, Apple Pay, Google Pay, with VAT/GST handled automatically). Customers in India can switch to INR and pay via Razorpay (UPI, RuPay, Visa, Mastercard, NetBanking).",
  },
  {
    q: "Can I cancel anytime or get a refund?",
    a: "Yes. You can cancel in one click anytime from Studio → Billing with zero retention hoops, and every new plan is covered by our 7-day fair refund policy.",
  },
  {
    q: "What happens if an AI request fails or times out?",
    a: "Failed or interrupted requests never consume your word credits.",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />

      {/* Deep Espresso Hero */}
      <section className="relative pf-espresso-band overflow-hidden border-b" style={{ borderColor: "var(--pf-espresso-border)" }}>
        <Image
          src="/images/trust-banner.jpg"
          alt="Archival cream paper stack bound with oxblood ribbon, brass paperweight, and fountain pen on dark walnut"
          fill
          priority
          sizes="100vw"
          className="object-cover object-right opacity-45"
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(95deg, rgba(36,16,14,0.97) 0%, rgba(36,16,14,0.88) 54%, rgba(36,16,14,0.42) 100%)",
          }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-5 py-16 sm:py-20">
          <div className="max-w-2xl">
            <span
              className="inline-flex items-center gap-2 px-3 py-1 rounded text-[11px] font-bold uppercase tracking-widest mb-5"
              style={{ background: "#dfdacc", color: "#1a1311" }}
            >
              <BrandAsterisk size={11} />
              <span>Simple, Honest Pricing</span>
            </span>

            <h1 className="text-3xl sm:text-5xl font-bold tracking-[-0.035em] leading-[1.08] text-[#f4f1ea]">
              Pay only for the{" "}
              <span className="pf-serif italic font-normal text-[#dfdacc]">words you refine.</span>
            </h1>

            <p className="mt-4 text-sm sm:text-base leading-relaxed" style={{ color: "#d5c7c2" }}>
              Start free with 500 words every month. Upgrade anytime in USD or INR, save 33% on
              annual billing, and cancel in one click whenever you want.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-4 pt-6 border-t max-w-lg" style={{ borderColor: "rgba(255,255,255,0.14)" }}>
              {[
                { val: "500 words", label: "Free on signup" },
                { val: "USD & INR", label: "Global + UPI" },
                { val: "7-day", label: "Fair refund policy" },
              ].map((m) => (
                <div key={m.label}>
                  <div className="text-base sm:text-lg font-bold pf-mono text-[#f4f1ea]">{m.val}</div>
                  <div className="text-[11px]" style={{ color: "var(--pf-espresso-muted)" }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1">
        {/* Interactive Plans & Currency Toggle */}
        <section className="max-w-6xl mx-auto px-5 py-16 md:py-20">
          <Reveal>
            <PricingSection />
          </Reveal>
        </section>

        {/* Billing FAQ */}
        <section className="max-w-4xl mx-auto px-5 pb-20">
          <Reveal className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-[-0.025em]">
              Billing &amp; Refund Questions
            </h2>
          </Reveal>
          <div className="space-y-3">
            {BILLING_FAQ.map((item) => (
              <details key={item.q} className="pf-faq pf-card-pure p-5">
                <summary className="font-semibold text-sm sm:text-base cursor-pointer list-none flex items-center justify-between gap-4">
                  <span>{item.q}</span>
                  <span className="pf-faq-icon pf-accent font-mono text-lg leading-none">+</span>
                </summary>
                <p className="pf-muted text-sm mt-3 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>

          <div className="mt-10 text-center text-xs pf-muted">
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
