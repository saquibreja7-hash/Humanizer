import Image from "next/image";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import BeforeAfter from "@/components/BeforeAfter";
import PricingSection from "@/components/PricingSection";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import HeroLiveDemo from "@/components/HeroLiveDemo";
import Reveal from "@/components/Reveal";
import CountUp from "@/components/CountUp";
import WipeCompare from "@/components/WipeCompare";
import UseCaseMarquee from "@/components/UseCaseMarquee";

const STEPS = [
  {
    num: "01",
    title: "Drop a draft or .docx",
    body: "Paste text or upload Word files. Headings stay untouched.",
    color: "var(--pf-accent)",
    soft: "var(--pf-accent-soft)",
  },
  {
    num: "02",
    title: "Multi-pass refinement",
    body: "Paragraphs run in parallel across 3 to 7 gentle passes.",
    color: "var(--pf-ink)",
    soft: "var(--pf-ink-soft)",
  },
  {
    num: "03",
    title: "Verify & export",
    body: "Check quotes and figures, then export cleanly to .docx.",
    color: "var(--pf-sage)",
    soft: "var(--pf-sage-soft)",
  },
];

const FAQ = [
  {
    q: "How is ProseFlow different from ordinary paraphrasing tools?",
    a: "It rebuilds sentence rhythm with an iterative base model instead of swapping awkward synonyms or breaking grammar.",
  },
  {
    q: "Do you store my drafts or train models on my writing?",
    a: "Never. Drafts stay in temporary RAM during your request and are discarded immediately.",
  },
  {
    q: "Will it change my numbers, dates, or direct quotes?",
    a: "Fidelity Shield verifies every quote and number against your source draft, and you can regenerate any single paragraph.",
  },
  {
    q: "Does it work with full Word (.docx) documents?",
    a: "Yes. Upload a .docx file to refine body paragraphs while keeping headings intact, then export back to Word.",
  },
  {
    q: "What if I want a refund or want to cancel?",
    a: "Cancel in one click from Billing anytime, backed by a 7-day refund policy.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-dvh flex flex-col">
      <PublicHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute -top-40 -right-40 w-[520px] h-[520px] rounded-full opacity-60"
            style={{ background: "radial-gradient(circle, var(--pf-gold-soft) 0%, transparent 70%)" }}
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute top-40 -left-48 w-[480px] h-[480px] rounded-full opacity-60"
            style={{ background: "radial-gradient(circle, var(--pf-ink-soft) 0%, transparent 70%)" }}
            aria-hidden="true"
          />
          <svg
            className="pointer-events-none absolute inset-0 w-full h-full"
            viewBox="0 0 1440 760"
            fill="none"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
          >
            <g stroke="var(--pf-border)" strokeWidth="1" opacity="0.65">
              <path d="M0 160 H180 V280 H460" />
              <path d="M0 420 H220 V520 H440" />
              <path d="M1440 150 H1220 V270 H960" />
              <path d="M1440 430 H1180 V530 H960" />
            </g>
            <g strokeWidth="1.8" strokeLinecap="round" opacity="0.75">
              <path d="M0 160 H180 V280 H460" className="pf-flow-line" stroke="var(--pf-accent)" />
              <path d="M1440 150 H1220 V270 H960" className="pf-flow-line-slow" stroke="var(--pf-gold)" />
              <path d="M0 420 H220 V520 H440" className="pf-flow-line-slow" stroke="var(--pf-ink)" />
              <path d="M1440 430 H1180 V530 H960" className="pf-flow-line" stroke="var(--pf-accent)" />
            </g>
          </svg>

          <div className="relative max-w-5xl mx-auto px-5 pt-14 md:pt-20 pb-14">
            <div className="text-center max-w-3xl mx-auto pf-fade-in">
              <span
                className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full"
                style={{ background: "var(--pf-gold-soft)", color: "var(--pf-gold-deep)" }}
              >
                <span className="w-1.5 h-1.5 rounded-full pf-pulse-dot" style={{ background: "var(--pf-gold)" }} />
                500 free words every month
              </span>
              <h1 className="mt-5 text-4xl sm:text-6xl font-bold tracking-[-0.035em] leading-[1.04]">
                Smarter{" "}
                <span className="pf-serif italic font-medium" style={{ color: "var(--pf-accent)" }}>
                  natural
                </span>{" "}
                writing refinement
              </h1>

              <p className="pf-muted mt-5 text-base md:text-lg leading-relaxed max-w-md mx-auto">
                Clear, natural prose with every fact preserved.
              </p>

              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <Link href="/login?mode=signup" className="pf-btn pf-btn-primary text-sm px-6 py-3">
                  Get started free
                </Link>
                <a href="#compare" className="pf-btn pf-btn-ghost text-sm px-6 py-3">
                  See it in action
                </a>
              </div>
            </div>

            <div className="mt-10 md:mt-12 grid lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 flex justify-center">
                <div className="w-[230px] sm:w-[270px] lg:w-[300px] pf-float">
                  <Image
                    src="/images/hero-writing.jpg"
                    alt="Hand holding a crimson fountain pen with gold nib on white background"
                    width={840}
                    height={934}
                    priority
                    className="w-full h-auto block select-none"
                  />
                </div>
              </div>

              <div className="lg:col-span-7">
                <HeroLiveDemo />
              </div>
            </div>
          </div>
        </section>

        {/* Stats band (ink blue) */}
        <section className="pf-ink-band">
          <div className="max-w-5xl mx-auto px-5 py-12 md:py-14 grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-6">
            {[
              { node: <CountUp to={96.4} decimals={1} suffix="%" />, label: "Phrases rebuilt", color: "#f3d48f" },
              { node: <CountUp to={100} suffix="%" />, label: "Quotes & numbers kept", color: "#a8dcbf" },
              { node: <CountUp to={0} suffix=" bytes" />, label: "Of your text stored", color: "#f2b8bb" },
              { node: <CountUp to={7} prefix="3–" />, label: "Gentle passes per draft", color: "#c4d6ee" },
            ].map((s, i) => (
              <Reveal key={s.label} delay={i * 90}>
                <div className="text-3xl md:text-4xl font-bold tracking-tight" style={{ color: s.color }}>
                  {s.node}
                </div>
                <div className="mt-1.5 text-sm" style={{ color: "var(--pf-ink-muted)" }}>
                  {s.label}
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Drag-to-compare wipe */}
        <section id="compare" className="max-w-5xl mx-auto px-5 py-16 md:py-20 scroll-mt-16">
          <Reveal className="max-w-2xl mb-8">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--pf-accent)" }}>
              Before / after
            </span>
            <h2 className="mt-2 text-3xl md:text-4xl font-bold tracking-[-0.03em]">
              AI drafts write in clichés.
            </h2>
            <p className="pf-muted mt-2.5 text-base">Drag the gold handle to watch them disappear.</p>
          </Reveal>
          <Reveal delay={120}>
            <WipeCompare />
          </Reveal>
        </section>

        {/* Interactive Studio Demo (gold tint band) */}
        <section
          id="demo"
          className="py-16 md:py-20 scroll-mt-16"
          style={{ background: "linear-gradient(180deg, var(--pf-gold-soft) 0%, var(--pf-bg) 100%)" }}
        >
          <div className="max-w-5xl mx-auto px-5">
            <Reveal className="text-center max-w-xl mx-auto mb-10">
              <span className="text-xs font-bold uppercase tracking-wider pf-gold-text">Try it</span>
              <h2 className="mt-2 text-3xl md:text-4xl font-bold tracking-[-0.03em]">Compare line by line</h2>
              <p className="pf-muted mt-2.5 text-base">Switch genres, Option A/B, or sentence rhythm.</p>
            </Reveal>
            <Reveal delay={100}>
              <BeforeAfter />
            </Reveal>
          </div>
        </section>

        {/* 3 Steps */}
        <section id="how" className="max-w-5xl mx-auto px-5 py-16 md:py-20">
          <Reveal>
            <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.03em] mb-10 max-w-xl">
              Three calm steps from draft to natural prose.
            </h2>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-5">
            {STEPS.map((s, i) => (
              <Reveal key={s.num} delay={i * 120}>
                <div className="pf-card-pure pf-lift p-6 h-full relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ background: s.color }} />
                  <span
                    className="inline-flex items-center justify-center w-10 h-10 rounded-full pf-mono text-sm font-bold"
                    style={{ background: s.soft, color: s.color }}
                  >
                    {s.num}
                  </span>
                  <h3 className="text-lg font-bold mt-4">{s.title}</h3>
                  <p className="pf-muted mt-2 text-sm leading-relaxed">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Feature rows on tinted panels */}
        <section
          id="features"
          className="border-y py-16 md:py-20 scroll-mt-16"
          style={{ background: "var(--pf-surface)", borderColor: "var(--pf-border)" }}
        >
          <div className="max-w-5xl mx-auto px-5 space-y-16">
            {/* Row 1: Fidelity Shield (sage) */}
            <div className="grid md:grid-cols-12 gap-8 items-center">
              <Reveal className="md:col-span-5 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--pf-sage)" }}>
                  Fidelity Shield
                </span>
                <h2 className="text-2xl md:text-3xl font-bold tracking-[-0.025em]">
                  Never lose a quote or statistic.
                </h2>
                <p className="pf-muted text-sm md:text-base leading-relaxed">
                  Quotes, dates, and numbers are checked automatically. Regenerate any paragraph in one click.
                </p>
              </Reveal>
              <Reveal delay={120} className="md:col-span-7">
                <div className="rounded-2xl p-6 space-y-4 pf-lift" style={{ background: "var(--pf-sage-soft)" }}>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {["96.4% phrases rebuilt", "Quotes 3/3 kept", "Numbers 7/7 kept"].map((b) => (
                      <span
                        key={b}
                        className="pf-badge"
                        style={{ background: "var(--pf-surface-pure)", color: "var(--pf-sage)", borderColor: "transparent" }}
                      >
                        ✓ {b}
                      </span>
                    ))}
                  </div>
                  <div
                    className="rounded-lg p-4 text-xs flex items-center justify-between gap-3"
                    style={{ background: "var(--pf-surface-pure)" }}
                  >
                    <span className="pf-muted">Paragraph 2 verified against source draft</span>
                    <span className="font-semibold" style={{ color: "var(--pf-sage)" }}>
                      ↻ Regenerate
                    </span>
                  </div>
                </div>
              </Reveal>
            </div>

            {/* Row 2: .docx & Option A/B (gold) */}
            <div className="grid md:grid-cols-12 gap-8 items-center">
              <Reveal delay={120} className="md:col-span-7 order-2 md:order-1">
                <div className="rounded-2xl p-6 space-y-3 pf-lift" style={{ background: "var(--pf-gold-soft)" }}>
                  <div
                    className="rounded-lg p-4 text-xs flex items-center justify-between gap-3"
                    style={{ background: "var(--pf-surface-pure)" }}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="px-2 py-1 rounded font-bold pf-mono text-[11px]"
                        style={{ background: "#1f3a5f", color: "#fff" }}
                      >
                        DOCX
                      </span>
                      <div>
                        <div className="font-semibold">research-review-draft.docx</div>
                        <div className="pf-muted">32 headings preserved, 14 blocks streamed</div>
                      </div>
                    </div>
                    <span className="font-semibold" style={{ color: "var(--pf-sage)" }}>
                      Ready
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div
                      className="rounded-lg border-2 p-3.5"
                      style={{ background: "var(--pf-surface-pure)", borderColor: "var(--pf-gold)" }}
                    >
                      <div className="font-bold pf-gold-text mb-1">Option A: Crisp</div>
                      <div className="pf-muted">Direct opening, varied mid-sentence turn.</div>
                    </div>
                    <div className="rounded-lg p-3.5" style={{ background: "var(--pf-surface-pure)" }}>
                      <div className="font-bold mb-1">Option B: Conversational</div>
                      <div className="pf-muted">Warmer editorial flow with natural pacing.</div>
                    </div>
                  </div>
                </div>
              </Reveal>
              <Reveal className="md:col-span-5 order-1 md:order-2 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider pf-gold-text">Word files</span>
                <h2 className="text-2xl md:text-3xl font-bold tracking-[-0.025em]">
                  Upload .docx and compare Option A &amp; B.
                </h2>
                <p className="pf-muted text-sm md:text-base leading-relaxed">
                  Keep headings intact, compare two natural takes side by side, and export a clean .docx.
                </p>
              </Reveal>
            </div>

            {/* Row 3: Zero retention & REST API (ink) */}
            <div className="grid md:grid-cols-12 gap-8 items-center">
              <Reveal className="md:col-span-5 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--pf-ink)" }}>
                  Private by design
                </span>
                <h2 className="text-2xl md:text-3xl font-bold tracking-[-0.025em]">
                  Zero text retention. Simple REST API.
                </h2>
                <p className="pf-muted text-sm md:text-base leading-relaxed">
                  Drafts run in memory only and never touch disk. Automate pipelines with scoped{" "}
                  <code className="pf-mono text-xs">pf_sk_...</code> keys.
                </p>
                <div className="pt-1">
                  <Link href="/docs" className="pf-btn pf-btn-ghost text-xs px-4 py-2">
                    Read API Docs
                  </Link>
                </div>
              </Reveal>
              <Reveal delay={120} className="md:col-span-7">
                <div
                  className="rounded-2xl p-5 pf-mono text-xs overflow-x-auto leading-relaxed pf-lift"
                  style={{ background: "var(--pf-ink-deep)", color: "#dbe5f2" }}
                >
                  <div className="flex gap-1.5 mb-4" aria-hidden="true">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--pf-accent)" }} />
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--pf-gold)" }} />
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--pf-sage)" }} />
                  </div>
                  <pre className="m-0">
                    <span style={{ color: "#f3d48f" }}>curl</span>
                    {` -X POST https://proseflow.app/api/v1/rewrite \\
  -H "Authorization: Bearer pf_sk_live_..." \\
  -d '{"text": "Your rough draft...", "mode": "standard"}'

`}
                    <span style={{ color: "#a8dcbf" }}>{"// 200 OK · 0 bytes stored"}</span>
                    {`
{
  "text": "Clear, natural prose...",
  "fidelity": { "phrases_rebuilt_pct": 96.2, "quotes_kept": 2 }
}`}
                  </pre>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Built for real writers: scrolling use cases */}
        <section className="py-16">
          <Reveal className="text-center max-w-xl mx-auto mb-8 px-5">
            <h2 className="text-2xl md:text-3xl font-bold tracking-[-0.025em]">Built for real writers</h2>
            <p className="pf-muted mt-2 text-sm">
              For bloggers, researchers, marketers, founders, and ESL writers.
            </p>
          </Reveal>
          <UseCaseMarquee />
        </section>

        {/* Pricing */}
        <PricingSection />

        {/* FAQ */}
        <section className="max-w-3xl mx-auto px-5 py-16">
          <Reveal className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.025em]">Frequently asked questions</h2>
          </Reveal>
          <div className="divide-y border-t border-b" style={{ borderColor: "var(--pf-border)" }}>
            {FAQ.map((item) => (
              <details key={item.q} className="pf-faq py-5 group">
                <summary className="font-semibold cursor-pointer flex items-center justify-between gap-4 list-none">
                  <span>{item.q}</span>
                  <span
                    className="pf-faq-icon font-mono text-lg shrink-0 w-7 h-7 rounded-full inline-flex items-center justify-center"
                    style={{ background: "var(--pf-accent-soft)", color: "var(--pf-accent)" }}
                  >
                    +
                  </span>
                </summary>
                <p className="pf-muted mt-3 text-sm leading-relaxed pr-6">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Bottom CTA (ink band) */}
        <section className="pf-ink-band relative overflow-hidden">
          <div
            className="pointer-events-none absolute -bottom-32 -right-24 w-[420px] h-[420px] rounded-full opacity-25"
            style={{ background: "radial-gradient(circle, var(--pf-gold) 0%, transparent 65%)" }}
            aria-hidden="true"
          />
          <Reveal className="relative max-w-3xl mx-auto px-5 py-16 md:py-20 text-center">
            <h2 className="text-3xl md:text-5xl font-bold tracking-[-0.03em]">
              Your ideas.{" "}
              <span className="pf-serif italic font-medium" style={{ color: "#f3d48f" }}>
                Your voice.
              </span>
            </h2>
            <p className="mt-3 text-base" style={{ color: "var(--pf-ink-muted)" }}>
              Start with 500 free words every month. Zero drafts stored.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/login?mode=signup"
                className="pf-btn text-sm px-6 py-3"
                style={{ background: "var(--pf-gold)", color: "#1b1406" }}
              >
                Get started free
              </Link>
              <Link
                href="/docs"
                className="pf-btn text-sm px-6 py-3 border"
                style={{ borderColor: "var(--pf-ink-border)", color: "#f3f6fa" }}
              >
                Explore API
              </Link>
            </div>
            <p className="mt-6 text-xs" style={{ color: "var(--pf-ink-muted)" }}>
              {BRAND.refundWindowDays}-day refunds · Cancel in one click
            </p>
          </Reveal>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
