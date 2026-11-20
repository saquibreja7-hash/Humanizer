import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import Reveal from "@/components/Reveal";
import AnimatedRing from "@/components/AnimatedRing";

export const metadata: Metadata = {
  title: "Features",
  description: `Explore ${BRAND.name}'s multi-pass base-model engine, Fidelity Shield fact checking, .docx support, Option A/B versions, and zero-retention REST API.`,
};

const FEATURE_CARDS = [
  {
    badge: "Engine",
    title: "Iterative Base-Model Refinement",
    desc: "Choose Fast (3 passes), Standard (5 passes), or Deep (7 passes) with Natural (1.0) or Balanced (0.90) cadence—producing smooth, readable English with zero broken grammar.",
  },
  {
    badge: "Verification",
    title: "Fidelity Shield Fact & Quote Check",
    desc: "Automatically compares your refined prose against your source draft, tracking direct quotes, percentages, dates, and numbers and flagging any drift right away.",
  },
  {
    badge: "Documents",
    title: "Word (.docx) Upload & Styled Export",
    desc: "Drag and drop a full .docx manuscript. Headings and section titles stay untouched while body paragraphs are refined and exported back into a clean Word file.",
  },
  {
    badge: "Control",
    title: "Option A / B & Paragraph Regenerate",
    desc: "Generate two distinct phrasings side by side on Pro and Business plans, and click any single paragraph to spin a fresh alternative without re-running the whole document.",
  },
  {
    badge: "Speed",
    title: "6-Way Parallel Cloud Streaming",
    desc: "Multi-paragraph documents are split cleanly and refined in parallel across serverless GPUs, streaming finished blocks live to your screen in ~8 seconds.",
  },
  {
    badge: "Privacy & API",
    title: "Zero Retention & Developer REST API",
    desc: "Drafts live strictly in volatile RAM and are never saved. Business & API plans include pf_sk_... Bearer keys for POST /api/v1/rewrite.",
  },
];

const MATRIX = [
  { feature: "Iterative base-model engine", free: "Fast & Standard", starter: "Fast & Standard", pro: "Fast, Standard & Deep", business: "Fast, Standard & Deep" },
  { feature: "Monthly word credits", free: "500", starter: "20,000", pro: "75,000", business: "250,000" },
  { feature: "Max words per request", free: "250", starter: "2,000", pro: "4,000", business: "8,000" },
  { feature: "Word (.docx) upload & export", free: "—", starter: "Included", pro: "Included", business: "Included" },
  { feature: "Fidelity Shield verification", free: "Included", starter: "Included", pro: "Included", business: "Included" },
  { feature: "Option A / B dual versions", free: "—", starter: "—", pro: "Included", business: "Included" },
  { feature: "Per-paragraph regenerate", free: "—", starter: "—", pro: "Included", business: "Included" },
  { feature: "REST API (pf_sk_ keys)", free: "—", starter: "—", pro: "—", business: "Included" },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />

      {/* Deep Espresso Hero */}
      <section className="relative pf-espresso-band overflow-hidden border-b" style={{ borderColor: "var(--pf-espresso-border)" }}>
        <Image
          src="/images/login-studio.jpg"
          alt="Stacked cream linen notebooks, burgundy journal, and gold-nib fountain pen on walnut desk"
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
            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#e5a6aa] mb-4">
              Studio Capabilities
            </div>

            <h1 className="text-3xl sm:text-5xl font-bold tracking-[-0.035em] leading-[1.08] text-[#f4f1ea]">
              Precision tools for natural, accurate prose.
            </h1>

            <p className="mt-4 text-sm sm:text-base leading-relaxed" style={{ color: "#d5c7c2" }}>
              Every feature in {BRAND.name} is built around one goal: helping writers produce clear,
              human-sounding documents faster—without risking factual drift or exposing private drafts.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/login?mode=signup" className="pf-btn pf-btn-primary text-xs sm:text-sm px-5 py-2.5">
                Start free in Studio →
              </Link>
              <Link
                href="/docs"
                className="pf-btn text-xs sm:text-sm px-4 py-2.5 border text-[#f4f1ea] hover:bg-white/10"
                style={{ borderColor: "var(--pf-espresso-border)", background: "rgba(255,255,255,0.05)" }}
              >
                Explore REST API
              </Link>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1">
        {/* 6-Card Feature Grid */}
        <section className="max-w-6xl mx-auto px-5 py-16 md:py-20">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURE_CARDS.map((f, idx) => (
              <Reveal key={f.title} delayMs={idx * 60}>
                <div className="pf-card-pure pf-card-hover p-6 sm:p-7 h-full flex flex-col">
                  <span
                    className="self-start px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-4"
                    style={{ background: "var(--pf-accent-soft)", color: "var(--pf-accent)" }}
                  >
                    {f.badge}
                  </span>
                  <h2 className="text-lg font-bold tracking-[-0.015em]">{f.title}</h2>
                  <p className="pf-muted text-sm mt-2.5 leading-relaxed">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Visual Spotlight: Dual Espresso Cards + Developer Desk */}
        <section className="max-w-6xl mx-auto px-5 pb-16 md:pb-20">
          <Reveal>
            <div className="pf-dark-card p-6 sm:p-10 grid lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div className="text-[11px] font-bold uppercase tracking-widest text-[#e5a6aa]">
                  Built-In Safeguards
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#f4f1ea] tracking-[-0.025em]">
                  Real-time telemetry on every rewrite
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: "#d5c7c2" }}>
                  Whether you work in the browser Studio or integrate via{" "}
                  <code className="pf-mono text-[#f3b6ba]">POST /api/v1/rewrite</code>, every
                  response reports phrasing rebuilt percentage, exact quote &amp; number retention,
                  and zero-storage confirmation.
                </p>
                <div className="pt-2 grid sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border p-4 flex items-center justify-between gap-3" style={{ borderColor: "var(--pf-espresso-border)", background: "rgba(255,255,255,0.04)" }}>
                    <div>
                      <div className="text-xs" style={{ color: "var(--pf-espresso-muted)" }}>Phrasing Rebuilt</div>
                      <div className="text-2xl font-bold pf-mono text-[#f4f1ea]">96.4%</div>
                    </div>
                    <AnimatedRing percent={96.4} stroke="#f4f1ea" size={46} />
                  </div>
                  <div className="rounded-xl border p-4 flex items-center justify-between gap-3" style={{ borderColor: "var(--pf-espresso-border)", background: "rgba(255,255,255,0.04)" }}>
                    <div>
                      <div className="text-xs" style={{ color: "var(--pf-espresso-muted)" }}>Fidelity Lock</div>
                      <div className="text-2xl font-bold pf-mono text-[#f4f1ea]">100%</div>
                    </div>
                    <AnimatedRing percent={100} stroke="#c96d72" size={46} />
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="relative h-60 sm:h-72 rounded-xl overflow-hidden border" style={{ borderColor: "var(--pf-espresso-border)" }}>
                  <Image
                    src="/images/docs-banner.jpg"
                    alt="Minimalist mechanical keyboard and cream grid notebook with oxblood fountain pen"
                    fill
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* Feature Comparison Matrix */}
        <section className="max-w-6xl mx-auto px-5 pb-20">
          <Reveal className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-[-0.025em]">
              Compare capabilities by plan
            </h2>
          </Reveal>

          <div className="pf-card-pure overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr
                    className="border-b text-[11px] uppercase tracking-wider pf-muted"
                    style={{ borderColor: "var(--pf-border)", background: "var(--pf-surface)" }}
                  >
                    <th className="py-3.5 px-5 font-semibold">Capability</th>
                    <th className="py-3.5 px-4 font-semibold">Free</th>
                    <th className="py-3.5 px-4 font-semibold">Starter</th>
                    <th className="py-3.5 px-4 font-semibold pf-accent">Pro</th>
                    <th className="py-3.5 px-5 font-semibold">Business &amp; API</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--pf-border)" }}>
                  {MATRIX.map((row) => (
                    <tr key={row.feature}>
                      <td className="py-3.5 px-5 font-semibold">{row.feature}</td>
                      <td className="py-3.5 px-4 pf-muted">{row.free}</td>
                      <td className="py-3.5 px-4 pf-muted">{row.starter}</td>
                      <td className="py-3.5 px-4 font-semibold">{row.pro}</td>
                      <td className="py-3.5 px-5 pf-muted">{row.business}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link href="/pricing" className="pf-btn pf-btn-primary text-sm px-6 py-3">
              View pricing &amp; currency options →
            </Link>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
