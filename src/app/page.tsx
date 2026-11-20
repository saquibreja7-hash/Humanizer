import Image from "next/image";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import BeforeAfter from "@/components/BeforeAfter";
import PricingSection from "@/components/PricingSection";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import HeroLiveDemo from "@/components/HeroLiveDemo";
import WipeCompare from "@/components/WipeCompare";

const STEPS = [
  {
    num: "01",
    title: "Drop a draft or .docx",
    body: "Paste text or upload Word files. Headings stay untouched.",
    color: "var(--pf-accent)",
  },
  {
    num: "02",
    title: "Multi-pass refinement",
    body: "Paragraphs run in parallel across 3 to 7 gentle passes.",
    color: "var(--pf-ink)",
  },
  {
    num: "03",
    title: "Verify & export",
    body: "Check quotes and figures, then export cleanly to .docx.",
    color: "var(--pf-sage)",
  },
];

const PERSONAS = [
  { role: "Researchers", desc: "Citations, dates, and quotes stay locked.", accent: "var(--pf-ink)" },
  { role: "Bloggers", desc: "Natural pacing and varied sentence rhythm.", accent: "var(--pf-accent)" },
  { role: "Marketing Teams", desc: "Cleaner briefs, or automate via REST API.", accent: "var(--pf-gold)" },
  { role: "ESL Writers", desc: "Idiomatic English in your own voice.", accent: "var(--pf-sage)" },
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
        {/* Hero: Architectural Flow Lines + Floating Pen + Live Streamer */}
        <section className="relative overflow-hidden">
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
              <h1 className="text-4xl sm:text-6xl font-bold tracking-[-0.035em] leading-[1.04]">
                Smarter Natural Writing Refinement
              </h1>

              <p className="pf-muted mt-5 text-base md:text-lg leading-relaxed max-w-md mx-auto">
                Clear, natural prose with every fact preserved.
              </p>

              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <Link href="/login?mode=signup" className="pf-btn pf-btn-primary text-sm px-6 py-3">
                  Get started free
                </Link>
                <a href="#compare" className="pf-btn pf-btn-ghost text-sm px-6 py-3">
                  See live demo
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

        {/* Interactive Drag-to-Compare Wipe */}
        <section
          id="compare"
          className="border-y py-16 md:py-20 scroll-mt-16"
          style={{ background: "var(--pf-surface)", borderColor: "var(--pf-border)" }}
        >
          <div className="max-w-5xl mx-auto px-5">
            <div className="max-w-2xl mb-8">
              <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.03em]">
                AI drafts write in clichés.
              </h2>
              <p className="pf-muted mt-2.5 text-base">
                Drag the handle across the paragraph to compare the stiff draft with the refined rewrite.
              </p>
            </div>
            <WipeCompare />
          </div>
        </section>

        {/* Interactive Studio Demo */}
        <section id="demo" className="max-w-5xl mx-auto px-5 py-16 md:py-20 scroll-mt-16">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.03em]">
              Compare line by line
            </h2>
            <p className="pf-muted mt-2.5 text-base">
              Switch genres, Option A/B, or sentence rhythm.
            </p>
          </div>
          <BeforeAfter />
        </section>

        {/* 3 Calm Steps (Hairline Editorial Index) */}
        <section
          id="how"
          className="border-y py-16 md:py-20"
          style={{ background: "var(--pf-surface)", borderColor: "var(--pf-border)" }}
        >
          <div className="max-w-5xl mx-auto px-5">
            <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.03em] mb-10">
              Three calm steps from draft to natural prose.
            </h2>

            <div
              className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x border-t border-b"
              style={{ borderColor: "var(--pf-border)" }}
            >
              {STEPS.map((s) => (
                <div key={s.num} className="py-7 md:px-7 first:md:pl-0 last:md:pr-0">
                  <span className="pf-mono text-xs font-bold" style={{ color: s.color }}>
                    {s.num}
                  </span>
                  <h3 className="text-lg font-bold mt-2.5">{s.title}</h3>
                  <p className="pf-muted mt-2 text-sm leading-relaxed">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Alternating 2-Column Feature Rows with Intentional Color Panels */}
        <section id="features" className="max-w-5xl mx-auto px-5 py-16 md:py-20 space-y-16 scroll-mt-16">
          {/* Row 1: Fidelity Shield (Sage panel) */}
          <div className="grid md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-5 space-y-3">
              <h2 className="text-2xl md:text-3xl font-bold tracking-[-0.025em]">
                Never lose a quote or statistic.
              </h2>
              <p className="pf-muted text-sm md:text-base leading-relaxed">
                Fidelity Shield checks quotes, dates, and numbers automatically. Regenerate any
                paragraph in one click.
              </p>
            </div>
            <div className="md:col-span-7 rounded-2xl border p-6 space-y-4" style={{ background: "var(--pf-sage-soft)", borderColor: "var(--pf-border)" }}>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="pf-badge" style={{ background: "var(--pf-surface-pure)", color: "var(--pf-sage)" }}>
                  ✓ 96.4% phrases rebuilt
                </span>
                <span className="pf-badge" style={{ background: "var(--pf-surface-pure)", color: "var(--pf-sage)" }}>
                  ✓ Quotes 3/3 kept
                </span>
                <span className="pf-badge" style={{ background: "var(--pf-surface-pure)", color: "var(--pf-sage)" }}>
                  ✓ Numbers 7/7 kept
                </span>
              </div>
              <div
                className="rounded-lg border p-4 text-xs flex items-center justify-between gap-3"
                style={{ background: "var(--pf-surface-pure)", borderColor: "var(--pf-border)" }}
              >
                <span className="pf-muted">Paragraph 2 verified against source draft</span>
                <span className="font-semibold" style={{ color: "var(--pf-sage)" }}>
                  ↻ Regenerate paragraph
                </span>
              </div>
            </div>
          </div>

          {/* Row 2: .docx & Option A/B (Gold panel) */}
          <div className="grid md:grid-cols-12 gap-8 items-center">
            <div
              className="md:col-span-7 order-2 md:order-1 rounded-2xl border p-6 space-y-3"
              style={{ background: "var(--pf-gold-soft)", borderColor: "var(--pf-border)" }}
            >
              <div
                className="rounded-lg border p-4 text-xs flex items-center justify-between gap-3"
                style={{ background: "var(--pf-surface-pure)", borderColor: "var(--pf-border)" }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="px-2 py-1 rounded font-bold pf-mono text-[11px]"
                    style={{ background: "var(--pf-ink)", color: "var(--pf-ink-text)" }}
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
                <div
                  className="rounded-lg border p-3.5"
                  style={{ background: "var(--pf-surface-pure)", borderColor: "var(--pf-border)" }}
                >
                  <div className="font-bold mb-1">Option B: Conversational</div>
                  <div className="pf-muted">Warmer editorial flow with natural pacing.</div>
                </div>
              </div>
            </div>
            <div className="md:col-span-5 order-1 md:order-2 space-y-3">
              <h2 className="text-2xl md:text-3xl font-bold tracking-[-0.025em]">
                Upload .docx and compare Option A &amp; B.
              </h2>
              <p className="pf-muted text-sm md:text-base leading-relaxed">
                Drop a Word file, keep headings intact, compare two natural takes side by side, and
                export a clean .docx.
              </p>
            </div>
          </div>

          {/* Row 3: Zero retention & REST API (Ink-Blue panel) */}
          <div className="grid md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-5 space-y-3">
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
            </div>
            <div
              className="md:col-span-7 rounded-2xl border p-5 pf-mono text-xs overflow-x-auto leading-relaxed"
              style={{
                background: "var(--pf-ink-deep)",
                borderColor: "var(--pf-ink-border)",
                color: "var(--pf-ink-text)",
              }}
            >
              <pre className="m-0">
                <span style={{ color: "var(--pf-code-gold)" }}>curl</span>
                {` -X POST https://proseflow.app/api/v1/rewrite \\
  -H "Authorization: Bearer pf_sk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{"text": "Your rough draft...", "mode": "standard"}'

`}
                <span style={{ color: "var(--pf-code-sage)" }}>{"// 200 OK · 0 bytes stored"}</span>
                {`
{
  "text": "Clear, natural prose...",
  "fidelity": { "phrases_rebuilt_pct": 96.2, "quotes_kept": 2 }
}`}
              </pre>
            </div>
          </div>
        </section>

        {/* Editorial Craft Photo + Built for Real Writers */}
        <section
          className="border-y py-16"
          style={{ background: "var(--pf-surface)", borderColor: "var(--pf-border)" }}
        >
          <div className="max-w-5xl mx-auto px-5">
            <div className="grid md:grid-cols-12 gap-8 items-center mb-12">
              <div className="md:col-span-6 overflow-hidden rounded-2xl border" style={{ borderColor: "var(--pf-border)" }}>
                <Image
                  src="/images/editorial-desk.jpg"
                  alt="Open notebook with crimson fountain pen on a walnut writing desk"
                  width={1200}
                  height={800}
                  className="w-full h-auto block object-cover"
                />
              </div>
              <div className="md:col-span-6 space-y-3">
                <h2 className="text-2xl md:text-3xl font-bold tracking-[-0.025em]">
                  Built for real writers
                </h2>
                <p className="pf-muted text-sm md:text-base leading-relaxed">
                  Designed for bloggers, researchers, marketers, founders, and ESL writers who care
                  about clear voice and accurate facts.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {PERSONAS.map((p) => (
                <div
                  key={p.role}
                  className="pf-card-pure p-5 border-l-4"
                  style={{ borderLeftColor: p.accent }}
                >
                  <h3 className="font-bold text-base">{p.role}</h3>
                  <p className="pf-muted text-sm mt-2 leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <PricingSection />

        {/* FAQ */}
        <section className="max-w-3xl mx-auto px-5 py-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.025em]">
              Frequently asked questions
            </h2>
          </div>
          <div className="divide-y border-t border-b" style={{ borderColor: "var(--pf-border)" }}>
            {FAQ.map((item) => (
              <details key={item.q} className="pf-faq py-5 group">
                <summary className="font-semibold cursor-pointer flex items-center justify-between gap-4 list-none">
                  <span>{item.q}</span>
                  <span className="pf-faq-icon pf-muted font-mono text-lg shrink-0">+</span>
                </summary>
                <p className="pf-muted mt-3 text-sm leading-relaxed pr-6">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Deep Ink-Blue Bottom CTA Band */}
        <section className="pf-ink-band border-t" style={{ borderColor: "var(--pf-ink-border)" }}>
          <div className="max-w-3xl mx-auto px-5 py-16 md:py-20 text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.03em]">
              Your ideas. Your voice.
            </h2>
            <p className="mt-3 text-base" style={{ color: "var(--pf-ink-muted)" }}>
              Start with 500 free words every month. Zero drafts stored.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/login?mode=signup"
                className="pf-btn text-sm px-6 py-3"
                style={{ background: "var(--pf-gold)", color: "var(--pf-gold-ink)" }}
              >
                Get started free
              </Link>
              <Link
                href="/docs"
                className="pf-btn text-sm px-6 py-3 border"
                style={{ borderColor: "var(--pf-ink-border)", color: "var(--pf-ink-text)" }}
              >
                Explore API
              </Link>
            </div>
            <p className="mt-6 text-xs" style={{ color: "var(--pf-ink-muted)" }}>
              {BRAND.refundWindowDays}-day refunds · Cancel in one click
            </p>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
