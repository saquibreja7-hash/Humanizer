import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import PublicHeader, { BrandAsterisk } from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import BeforeAfter from "@/components/BeforeAfter";
import Reveal from "@/components/Reveal";
import AnimatedRing from "@/components/AnimatedRing";

export const metadata: Metadata = {
  title: "Live Demo",
  description: `Inspect real before-and-after prose transformations, Option A/B comparisons, and sentence rhythm analysis in the ${BRAND.name} interactive studio.`,
};

const PASS_STAGES = [
  {
    step: "Pass 01",
    title: "Structure & Heading Guard",
    detail: "Headings, section titles, and short labels are separated automatically so your document outline never shifts.",
  },
  {
    step: "Pass 02",
    title: "Parallel Multi-Round Flow",
    detail: "Body paragraphs run side by side across 3, 5, or 7 gentle passes—replacing uniform phrasing with natural cadence.",
  },
  {
    step: "Pass 03",
    title: "Fidelity Shield Verification",
    detail: "Every direct quote, date, percentage, and dollar figure is cross-checked against your original draft before display.",
  },
];

export default function DemoPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />

      {/* Deep Espresso Editorial Hero */}
      <section className="relative pf-espresso-band overflow-hidden border-b" style={{ borderColor: "var(--pf-espresso-border)" }}>
        <Image
          src="/images/editorial-desk.jpg"
          alt="Open cream cotton notebook with oxblood fountain pen and brass bookmark clip on dark walnut desk"
          fill
          priority
          sizes="100vw"
          className="object-cover object-right opacity-50"
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
              <span>Interactive Studio Demo</span>
            </span>

            <h1 className="text-3xl sm:text-5xl font-bold tracking-[-0.035em] leading-[1.08] text-[#f4f1ea]">
              See how 5 parallel passes{" "}
              <span className="pf-serif italic font-normal text-[#dfdacc]">reshape stiff prose.</span>
            </h1>

            <p className="mt-4 text-sm sm:text-base leading-relaxed" style={{ color: "#d5c7c2" }}>
              Switch genres, compare Option A and Option B side by side, and inspect sentence
              rhythm below—then test your own draft inside the live editor with 500 free words.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/login?mode=signup" className="pf-btn pf-btn-primary text-xs sm:text-sm px-5 py-2.5">
                Test your own draft free →
              </Link>
              <a
                href="#interactive-studio"
                className="pf-btn text-xs sm:text-sm px-4 py-2.5 border text-[#f4f1ea] hover:bg-white/10"
                style={{ borderColor: "var(--pf-espresso-border)", background: "rgba(255,255,255,0.05)" }}
              >
                Explore samples ↓
              </a>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1">
        {/* Interactive Before/After Studio */}
        <section id="interactive-studio" className="max-w-5xl mx-auto px-5 py-16 md:py-20 scroll-mt-20">
          <Reveal className="text-center max-w-2xl mx-auto mb-10">
            <span
              className="pf-badge uppercase tracking-wider text-[11px] mb-3"
              style={{ background: "var(--pf-surface-pure)", color: "var(--pf-accent)" }}
            >
              ✳ Line-by-Line Comparison
            </span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.03em]">
              Compare original vs. refined output
            </h2>
            <p className="pf-muted mt-2.5 text-sm sm:text-base">
              Notice how short and long sentences mix naturally while numbers, quotes, and meaning stay locked.
            </p>
          </Reveal>

          <Reveal delayMs={80}>
            <BeforeAfter />
          </Reveal>
        </section>

        {/* 3-Stage Walkthrough */}
        <section className="pf-espresso-band py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-5">
            <Reveal className="max-w-2xl mb-10">
              <div className="text-[11px] font-bold uppercase tracking-widest text-[#e5a6aa] mb-2">
                Under the Hood
              </div>
              <h2 className="text-2xl sm:text-4xl font-bold tracking-[-0.03em] text-[#f4f1ea]">
                What happens during a single click
              </h2>
            </Reveal>

            <div className="grid md:grid-cols-3 gap-6">
              {PASS_STAGES.map((stage, i) => (
                <Reveal key={stage.step} delayMs={i * 80}>
                  <div className="pf-dark-card p-6 h-full">
                    <div className="pf-mono text-xs font-bold text-[#e5a6aa] mb-2">{stage.step}</div>
                    <h3 className="text-lg font-bold text-[#f4f1ea]">{stage.title}</h3>
                    <p className="mt-2.5 text-sm leading-relaxed" style={{ color: "#d5c7c2" }}>
                      {stage.detail}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Visual Craft + Fidelity Guarantee */}
        <section className="max-w-6xl mx-auto px-5 py-16 md:py-20 grid lg:grid-cols-12 gap-8 items-center">
          <Reveal className="lg:col-span-5">
            <div className="pf-card-pure overflow-hidden shadow-lg shadow-black/[0.06]">
              <div className="relative h-72 sm:h-96">
                <Image
                  src="/images/login-studio.jpg"
                  alt="Stacked deckle-edge cream notebooks, oxblood journal, and burgundy fountain pen on walnut desk"
                  fill
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  className="object-cover"
                />
              </div>
            </div>
          </Reveal>

          <Reveal delayMs={100} className="lg:col-span-7 space-y-6">
            <h2 className="text-2xl sm:text-4xl font-bold tracking-[-0.03em]">
              What changes—and what stays locked
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="pf-card-pure p-5">
                <div className="text-xs font-bold uppercase tracking-wider pf-accent mb-2">
                  Refined Automatically
                </div>
                <ul className="space-y-2 text-sm pf-muted">
                  <li>• Repetitive sentence starters &amp; filler</li>
                  <li>• Monotonous sentence lengths</li>
                  <li>• Stiff, overly formal transitions</li>
                  <li>• Passive, robotic phrasing</li>
                </ul>
              </div>
              <div className="pf-card-pure p-5">
                <div className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--pf-good)" }}>
                  Protected by Fidelity Shield
                </div>
                <ul className="space-y-2 text-sm pf-muted">
                  <li>• Exact numbers, percentages &amp; currency</li>
                  <li>• Years, dates &amp; statistics</li>
                  <li>• Direct quotations in &ldquo;quotes&rdquo;</li>
                  <li>• Document headings &amp; paragraph breaks</li>
                </ul>
              </div>
            </div>

            <div className="pf-dark-card p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <AnimatedRing percent={100} stroke="#c96d72" size={48} />
                <div>
                  <div className="text-sm font-bold text-[#f4f1ea]">Ready to try your own text?</div>
                  <div className="text-xs" style={{ color: "var(--pf-espresso-muted)" }}>
                    500 free words included on signup — streams live in seconds.
                  </div>
                </div>
              </div>
              <Link href="/login?mode=signup" className="pf-btn pf-btn-primary text-xs px-5 py-2.5">
                Open live studio →
              </Link>
            </div>
          </Reveal>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
