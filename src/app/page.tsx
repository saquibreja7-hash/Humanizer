import Image from "next/image";
import { BRAND } from "@/lib/brand";
import BeforeAfter from "@/components/BeforeAfter";
import PricingSection from "@/components/PricingSection";
import Reveal from "@/components/Reveal";
import AnimatedRing from "@/components/AnimatedRing";
import PublicHeader, { BrandAsterisk } from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

const STEPS = [
  {
    num: "01",
    title: "Drop a draft or .docx file",
    body: "Bring rough AI notes, research essays, or full Word documents. Headings, section titles, and short lines stay untouched automatically.",
  },
  {
    num: "02",
    title: "Multi-pass editorial refinement",
    body: "Our base-model engine refines paragraphs in parallel across 3 to 7 gentle passes—rebuilding stiff phrasing into natural human cadence without breaking grammar.",
  },
  {
    num: "03",
    title: "Verify with Fidelity Shield & export",
    body: "Confirm every quote and figure stayed intact, compare Option A & B, regenerate any single paragraph, and export cleanly back to .docx.",
  },
];

const PERSONAS = [
  {
    role: "Researchers & Academics",
    desc: "Keep citations, dates, and exact quotes locked while smoothing out dry, repetitive first drafts.",
  },
  {
    role: "Bloggers & Columnists",
    desc: "Restore conversational pacing, varied sentence rhythm, and a recognizable human voice to long-form posts.",
  },
  {
    role: "Marketing & Content Teams",
    desc: "Eliminate overused filler clichés across briefs and landing pages—or automate via our REST API.",
  },
  {
    role: "Multilingual & ESL Writers",
    desc: "Polish clear ideas into idiomatic, natural English without losing your personal tone or technical precision.",
  },
];

const FAQ = [
  {
    q: "How is ProseFlow different from ordinary paraphrasing tools?",
    a: "Ordinary paraphrasers swap individual words with awkward synonyms or inject broken grammar. ProseFlow uses an iterative base-model engine that rebuilds sentence rhythm and phrasing from the ground up while preserving clean, readable English.",
  },
  {
    q: "Do you store my drafts or train models on my writing?",
    a: "Never. ProseFlow operates under strict zero text retention: your input and output live only in temporary memory during your request and are discarded immediately. We only record anonymous word counts and timestamps for your credit balance.",
  },
  {
    q: "Will it change my numbers, dates, or direct quotes?",
    a: "Every rewrite is checked automatically by Fidelity Shield, which tracks exact quotes and numeric figures against your source text and highlights any drift immediately—plus you can regenerate any individual paragraph with one click.",
  },
  {
    q: "Does it work with full Word (.docx) documents?",
    a: "Yes. Upload a .docx file directly in the editor—ProseFlow preserves headings and paragraph breaks, refines body sections in parallel, and exports a clean formatted .docx ready to open in Word or Google Docs.",
  },
  {
    q: "Can I integrate ProseFlow into my own app or content pipeline?",
    a: "Yes. Business & API plans include Bearer API keys (pf_sk_...) and a clean POST /api/v1/rewrite endpoint with full JSON responses and live Fidelity Shield metrics. See /docs for curl, Python, and JavaScript examples.",
  },
  {
    q: "What if I want a refund or want to cancel?",
    a: "You can cancel in one click from your billing page anytime, and we offer a straightforward 7-day refund policy—no hoops or support tickets required.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />

      <main className="flex-1">
        {/* Hero on Warm Limestone with Animated Pipeline Pulses + Seamless Pebble Photograph */}
        <section className="relative overflow-hidden">
          {/* Architectural pipeline SVG with animated burgundy pulses */}
          <svg
            className="pointer-events-none absolute inset-0 w-full h-full"
            viewBox="0 0 1440 820"
            fill="none"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
          >
            <g stroke="var(--pf-border)" strokeWidth="1.2" opacity="0.75">
              <path d="M0 190 H190 V310 H520" />
              <path d="M0 370 H270 V490 H540" />
              <path d="M1440 180 H1210 V310 H920" />
              <path d="M1440 380 H1160 V500 H900" />
              <path d="M310 0 V210 H500" />
              <path d="M1130 0 V220 H940" />
              <rect x="166" y="296" width="48" height="28" rx="6" fill="var(--pf-surface)" />
              <rect x="1220" y="368" width="52" height="24" rx="6" fill="var(--pf-surface)" />
              <rect x="82" y="358" width="38" height="24" rx="6" fill="var(--pf-surface)" />
            </g>
            {/* Animated oxblood burgundy light pulses flowing along the paths */}
            <g stroke="var(--pf-accent)" strokeWidth="2" strokeLinecap="round" opacity="0.7">
              <path d="M0 190 H190 V310 H520" className="pf-flow-line" />
              <path d="M1440 180 H1210 V310 H920" className="pf-flow-line-slow" />
              <path d="M0 370 H270 V490 H540" className="pf-flow-line-slow" />
              <path d="M1440 380 H1160 V500 H900" className="pf-flow-line" />
            </g>
          </svg>

          <div className="relative max-w-6xl mx-auto px-5 pt-14 md:pt-20 pb-0">
            {/* Headline & CTAs */}
            <div className="max-w-3xl mx-auto text-center pf-fade-in">
              <h1 className="text-4xl sm:text-6xl md:text-[66px] font-bold tracking-[-0.035em] leading-[1.03]">
                Smarter{" "}
                <span className="pf-muted font-medium">Natural</span>
                <br />
                Writing Refinement
              </h1>

              <p className="pf-muted mt-5 text-base md:text-lg leading-relaxed max-w-xl mx-auto">
                Turn stiff AI drafts into clear prose, keeping every fact and quote intact.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <a href="/login?mode=signup" className="pf-btn pf-btn-primary text-sm px-6 py-3">
                  Get started free
                </a>
                <a href="#demo" className="pf-btn pf-btn-ghost text-sm px-6 py-3">
                  See live demo
                </a>
              </div>
            </div>

            {/* Iconic Reference Composition: Editorial left copy + Seamless Hero Hand/Pebble Center + 2 Espresso Ring Cards */}
            <div className="mt-8 md:mt-6 grid lg:grid-cols-12 gap-6 items-end relative">
              {/* Left editorial blurb */}
              <div className="lg:col-span-4 pb-8 md:pb-12 order-2 lg:order-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold pf-muted mb-3">
                  <BrandAsterisk size={11} />
                  <span>Natural Voice Engine</span>
                </div>
                <p className="text-xl md:text-[22px] font-medium leading-snug tracking-[-0.02em]">
                  {BRAND.name} helps writers remove stiff phrasing, restore natural cadence,{" "}
                  <span className="pf-muted">
                    and keep every citation, quote, and figure locked in place.
                  </span>
                </p>
              </div>

              {/* Center Hero Photograph rising flush out of the Espresso band */}
              <div className="lg:col-span-4 order-1 lg:order-2 flex justify-center relative">
                {/* Floating architectural brand emblem chip */}
                <div
                  className="hidden md:flex pf-float absolute -top-2 -right-4 z-10 w-12 h-12 rounded-xl items-center justify-center border shadow-md"
                  style={{ background: "var(--pf-surface-pure)", borderColor: "var(--pf-border)", color: "var(--pf-text)" }}
                  aria-hidden="true"
                >
                  <BrandAsterisk size={20} />
                </div>

                <div className="relative w-[300px] sm:w-[360px] lg:w-[400px] -mb-1">
                  <Image
                    src="/images/hero-writing.jpg"
                    alt="Hand holding a matte oxblood-burgundy fountain pen with brushed gold nib on warm limestone"
                    width={840}
                    height={934}
                    priority
                    className="w-full h-auto block pf-hero-photo-mask select-none"
                  />
                </div>
              </div>

              {/* Right floating Deep Espresso ring-gauge metric cards */}
              <div className="lg:col-span-4 pb-8 md:pb-10 order-3 space-y-4">
                <div className="pf-dark-card pf-card-hover p-5">
                  <div className="flex items-center justify-between text-[11px]" style={{ color: "var(--pf-espresso-muted)" }}>
                    <span>Phrasing Rebuilt</span>
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-semibold"
                      style={{ background: "var(--pf-accent)", color: "var(--pf-btn-ink)" }}
                    >
                      5 passes
                    </span>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-3xl font-bold tracking-tight pf-mono text-white">96.4%</div>
                      <div className="mt-1 inline-flex items-center gap-1.5 text-[11px]">
                        <span className="px-1.5 py-0.5 rounded font-semibold" style={{ background: "rgba(124,53,57,0.5)", color: "var(--pf-espresso-pill)" }}>
                          ~7.4s
                        </span>
                        <span style={{ color: "var(--pf-espresso-muted)" }}>parallel cloud stream</span>
                      </div>
                    </div>
                    <AnimatedRing percent={96.4} stroke="var(--pf-espresso-ink)" />
                  </div>
                </div>

                <div className="pf-dark-card pf-card-hover p-5">
                  <div className="flex items-center justify-between text-[11px]" style={{ color: "var(--pf-espresso-muted)" }}>
                    <span>Fidelity Shield &amp; Privacy</span>
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-semibold"
                      style={{ background: "var(--pf-accent)", color: "var(--pf-btn-ink)" }}
                    >
                      RAM only
                    </span>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-3xl font-bold tracking-tight pf-mono text-white">100% Kept</div>
                      <div className="mt-1 inline-flex items-center gap-1.5 text-[11px]">
                        <span className="px-1.5 py-0.5 rounded font-semibold" style={{ background: "rgba(124,53,57,0.5)", color: "var(--pf-espresso-pill)" }}>
                          0 bytes
                        </span>
                        <span style={{ color: "var(--pf-espresso-muted)" }}>draft text stored in DB</span>
                      </div>
                    </div>
                    <AnimatedRing percent={100} stroke="var(--pf-accent)" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Full-Width Deep Espresso (#341815) Manifesto Band + Sculpted Editorial Prism Visual */}
        <section id="about" className="pf-espresso-band pt-20 md:pt-24 pb-16 md:pb-20 scroll-mt-16">
          <div className="max-w-5xl mx-auto px-5 text-center">
            <Reveal>
              <h2
                className="text-2xl sm:text-4xl md:text-[42px] font-medium leading-[1.2] tracking-[-0.025em] max-w-4xl mx-auto"
                style={{ color: "var(--pf-espresso-ink)" }}
              >
                {BRAND.name}{" "}
                <span
                  className="inline-flex items-center align-middle mx-1 rounded-md overflow-hidden border"
                  style={{ borderColor: "var(--pf-espresso-border)" }}
                  aria-hidden="true"
                >
                  <span className="px-1.5 py-1" style={{ background: "var(--pf-espresso-deep)", color: "var(--pf-espresso-ink)" }}><BrandAsterisk size={14} /></span>
                  <span className="px-1.5 py-1" style={{ background: "var(--pf-accent)", color: "var(--pf-btn-ink)" }}><BrandAsterisk size={14} /></span>
                  <span className="px-1.5 py-1" style={{ background: "var(--pf-bg)", color: "var(--pf-text)" }}><BrandAsterisk size={14} /></span>
                </span>{" "}
                helps writers eliminate mechanical phrasing, restore authentic rhythm,{" "}
                <span style={{ color: "var(--pf-espresso-muted)" }}>
                  and publish clearer, natural prose across every essay, brief, and document.
                </span>
              </h2>
            </Reveal>

            <Reveal delayMs={120}>
              <div
                className="mt-14 pt-10 border-t grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-0 sm:divide-x"
                style={{ borderColor: "var(--pf-espresso-border)" }}
              >
                {[
                  { big: "~8s", sub: "Parallel Cloud Streaming" },
                  { big: "95%+", sub: "Stiff Phrasing Rebuilt" },
                  { big: "0 bytes", sub: "Draft Text Ever Stored" },
                ].map((stat) => (
                  <div key={stat.sub} className="px-6" style={{ borderColor: "var(--pf-espresso-border)" }}>
                    <div
                      className="text-3xl md:text-4xl font-semibold tracking-tight pf-mono"
                      style={{ color: "var(--pf-espresso-ink)" }}
                    >
                      {stat.big}
                    </div>
                    <div className="text-xs mt-2" style={{ color: "var(--pf-espresso-muted)" }}>
                      {stat.sub}
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>

            {/* Bespoke Writer Desk Visual */}
            <Reveal delayMs={200} className="mt-14">
              <div
                className="relative rounded-2xl overflow-hidden border"
                style={{ borderColor: "var(--pf-espresso-border)" }}
              >
                <Image
                  src="/images/editorial-desk.jpg"
                  alt="Open cream linen notebook with an oxblood-burgundy fountain pen on a dark walnut writer desk in warm sunlight"
                  width={1280}
                  height={714}
                  className="w-full h-[220px] sm:h-[320px] md:h-[400px] object-cover"
                />
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(36, 16, 14, 0.82) 0%, rgba(36, 16, 14, 0.15) 45%, transparent 100%)",
                  }}
                />
                <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 flex flex-wrap items-end justify-between gap-3 text-left">
                  <div>
                    <div className="text-xs font-semibold" style={{ color: "var(--pf-espresso-rose)" }}>
                      Iterative Base-Model Engine
                    </div>
                    <div className="text-lg sm:text-xl font-medium mt-0.5" style={{ color: "var(--pf-espresso-ink)" }}>
                      Clear human cadence on every page.
                    </div>
                  </div>
                  <a href="#demo" className="pf-btn pf-btn-primary text-xs px-4 py-2">
                    Try the live studio
                  </a>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Interactive Studio Demo */}
        <section id="demo" className="max-w-5xl mx-auto px-5 py-20 md:py-24 scroll-mt-16">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h2 className="text-3xl md:text-5xl font-bold tracking-[-0.03em]">
                See the difference line by line
              </h2>
              <p className="pf-muted mt-3 text-base">
                Switch writing genres, compare Option A vs Option B, or inspect the sentence rhythm graph.
              </p>
            </div>
          </Reveal>
          <Reveal delayMs={100}>
            <BeforeAfter />
          </Reveal>
        </section>

        {/* How it works — 3 editorial steps */}
        <section
          id="how"
          className="border-y py-20"
          style={{ background: "var(--pf-surface)", borderColor: "var(--pf-border)" }}
        >
          <div className="max-w-6xl mx-auto px-5">
            <Reveal>
              <div className="max-w-2xl">
                <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.03em]">
                  Three calm steps from rough draft to natural prose.
                </h2>
              </div>
            </Reveal>

            <div
              className="mt-10 grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x border-t border-b"
              style={{ borderColor: "var(--pf-border)" }}
            >
              {STEPS.map((s, idx) => (
                <Reveal key={s.num} delayMs={idx * 90}>
                  <div className="py-7 md:px-7 first:md:pl-0 last:md:pr-0 flex flex-col h-full">
                    <span className="pf-mono text-xs font-bold pf-accent">
                      {s.num}
                    </span>
                    <h3 className="text-xl font-bold mt-3">{s.title}</h3>
                    <p className="pf-muted mt-2.5 text-sm leading-relaxed">{s.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Asymmetric Bento Grid Features */}
        <section id="features" className="max-w-6xl mx-auto px-5 py-20 md:py-24 scroll-mt-16">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl md:text-5xl font-bold tracking-[-0.03em]">
                Keep your facts. Keep your voice.
              </h2>
            </div>
          </Reveal>

          <div className="grid gap-5 md:grid-cols-6">
            <Reveal className="md:col-span-4" delayMs={40}>
              <div className="pf-card-pure pf-card-hover p-6 md:p-7 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold pf-accent">
                      Fidelity Shield
                    </span>
                    <span
                      className="pf-badge text-[11px]"
                      style={{ background: "var(--pf-accent-soft)", color: "var(--pf-accent)", borderColor: "transparent" }}
                    >
                      Live Fact Verification
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold mt-2">
                    Never lose a quote, statistic, or argument.
                  </h3>
                  <p className="pf-muted mt-2.5 text-sm leading-relaxed max-w-xl">
                    After every pass, ProseFlow checks your rewritten draft against your source
                    text, verifying quotes, dates, and numbers automatically. Want a different take
                    on one section? Regenerate just that single paragraph in one click.
                  </p>
                </div>

                <div
                  className="mt-6 rounded-lg border p-4 flex flex-wrap items-center justify-between gap-3 text-xs"
                  style={{ background: "var(--pf-surface)", borderColor: "var(--pf-border)" }}
                >
                  <div className="flex flex-wrap gap-2">
                    <span className="pf-badge" style={{ background: "var(--pf-surface-pure)", color: "var(--pf-good)" }}>
                      ✓ 96.4% phrases rebuilt
                    </span>
                    <span className="pf-badge" style={{ background: "var(--pf-surface-pure)", color: "var(--pf-good)" }}>
                      ✓ Quotes 3/3 kept
                    </span>
                    <span className="pf-badge" style={{ background: "var(--pf-surface-pure)", color: "var(--pf-good)" }}>
                      ✓ Numbers 7/7 kept
                    </span>
                  </div>
                  <span
                    className="font-semibold px-2.5 py-1 rounded border"
                    style={{ background: "var(--pf-surface-pure)", borderColor: "var(--pf-border)" }}
                  >
                    ↻ Regenerate paragraph
                  </span>
                </div>
              </div>
            </Reveal>

            <Reveal className="md:col-span-2" delayMs={110}>
              <div className="pf-dark-card pf-card-hover p-6 md:p-7 h-full flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold" style={{ color: "var(--pf-espresso-rose)" }}>
                    Privacy by Design
                  </span>
                  <h3 className="text-2xl font-bold mt-2 text-white">Zero text retention.</h3>
                  <p className="mt-2.5 text-sm leading-relaxed" style={{ color: "var(--pf-espresso-muted)" }}>
                    Your unpublished essays, client briefs, and research drafts are processed
                    strictly in memory and never written to disk or used for training.
                  </p>
                </div>
                <div
                  className="mt-6 rounded-lg p-3.5 pf-mono text-xs space-y-1.5 border"
                  style={{ background: "rgba(0,0,0,0.22)", borderColor: "var(--pf-espresso-border)" }}
                >
                  <div className="flex justify-between">
                    <span style={{ color: "var(--pf-espresso-muted)" }}>Draft input</span>
                    <span className="text-white">RAM only</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "var(--pf-espresso-muted)" }}>Stored in DB</span>
                    <span className="font-bold" style={{ color: "var(--pf-espresso-rose)" }}>0 bytes</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "var(--pf-espresso-muted)" }}>Model training</span>
                    <span className="font-bold" style={{ color: "var(--pf-espresso-rose)" }}>Never</span>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal className="md:col-span-3" delayMs={60}>
              <div className="pf-card-pure pf-card-hover p-6 md:p-7 h-full">
                <span className="text-xs font-semibold pf-accent">
                  Dual Variations
                </span>
                <h3 className="text-xl font-bold mt-2">Compare Option A &amp; Option B side by side</h3>
                <p className="pf-muted mt-2 text-sm leading-relaxed">
                  Human writing is never one-size-fits-all. Generate two distinct natural takes in
                  one run and pick the rhythm that sounds most like you.
                </p>
                <div className="mt-5 grid grid-cols-2 gap-2.5 text-xs">
                  <div
                    className="rounded-lg border p-3"
                    style={{ background: "var(--pf-accent-soft)", borderColor: "var(--pf-accent)" }}
                  >
                    <div className="font-bold pf-accent mb-1">Option A: Crisp</div>
                    <div className="pf-muted leading-snug">Direct opening, varied mid-sentence turn.</div>
                  </div>
                  <div
                    className="rounded-lg border p-3"
                    style={{ background: "var(--pf-surface)", borderColor: "var(--pf-border)" }}
                  >
                    <div className="font-bold mb-1">Option B: Conversational</div>
                    <div className="pf-muted leading-snug">Warmer editorial flow with natural pacing.</div>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal className="md:col-span-3" delayMs={130}>
              <div className="pf-card-pure pf-card-hover p-6 md:p-7 h-full">
                <span className="text-xs font-semibold pf-accent">
                  Document Workflow
                </span>
                <h3 className="text-xl font-bold mt-2">Upload &amp; export formatted .docx files</h3>
                <p className="pf-muted mt-2 text-sm leading-relaxed">
                  Stop copy-pasting one paragraph at a time. Drop a 3,000-word Word document: section
                  headings stay untouched, body chunks run in parallel, and export returns a clean .docx.
                </p>
                <div
                  className="mt-5 rounded-lg border p-3.5 text-xs flex items-center justify-between gap-3"
                  style={{ background: "var(--pf-surface)", borderColor: "var(--pf-border)" }}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="px-2 py-1 rounded font-bold pf-mono text-[11px]"
                      style={{ background: "var(--pf-accent)", color: "var(--pf-btn-ink)" }}
                    >
                      DOCX
                    </span>
                    <div>
                      <div className="font-semibold">research-review-draft.docx</div>
                      <div className="pf-muted">32 headings preserved, 14 blocks streamed</div>
                    </div>
                  </div>
                  <span className="font-semibold" style={{ color: "var(--pf-good)" }}>
                    Ready
                  </span>
                </div>
              </div>
            </Reveal>

            <Reveal className="md:col-span-6" delayMs={80}>
              <div className="pf-dark-card p-6 md:p-8 grid md:grid-cols-5 gap-6 items-center">
                <div className="md:col-span-2">
                  <span className="text-xs font-semibold" style={{ color: "var(--pf-espresso-rose)" }}>
                    Developer REST API
                  </span>
                  <h3 className="text-2xl font-bold mt-2 text-white">
                    Embed natural voice refinement anywhere.
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed" style={{ color: "var(--pf-espresso-muted)" }}>
                    Generate scoped <code style={{ color: "var(--pf-espresso-pill)" }}>pf_sk_...</code> API keys in
                    seconds. Built for content platforms, editorial pipelines, and agency workflows
                    with predictable word-credit billing.
                  </p>
                  <a href="/docs" className="pf-btn pf-btn-primary mt-5 text-sm px-4 py-2.5">
                    Read API Docs
                  </a>
                </div>
                <div
                  className="md:col-span-3 rounded-lg p-4 pf-mono text-xs overflow-x-auto leading-relaxed border"
                  style={{
                    background: "rgba(0,0,0,0.34)",
                    borderColor: "var(--pf-espresso-border)",
                    color: "var(--pf-espresso-ink)",
                  }}
                >
                  <div className="mb-2" style={{ color: "var(--pf-espresso-muted)" }}>
                    # POST /api/v1/rewrite
                  </div>
                  <pre className="m-0">{`curl -X POST https://proseflow.app/api/v1/rewrite \\
  -H "Authorization: Bearer pf_sk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{"text": "Your rough draft...", "mode": "standard"}'

// Response (200 OK · 7.1s)
{
  "rewritten": "Clear, natural prose...",
  "fidelity": { "phrasesRebuiltPct": 96.2, "quotesKept": 2, "numbersKept": 4 }
}`}</pre>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Who it's built for */}
        <section
          className="border-t py-16"
          style={{ background: "var(--pf-surface)", borderColor: "var(--pf-border)" }}
        >
          <div className="max-w-6xl mx-auto px-5">
            <Reveal>
              <div className="text-center max-w-xl mx-auto mb-10">
                <h2 className="text-2xl md:text-3xl font-bold tracking-[-0.025em]">
                  Built for people who care how their words land
                </h2>
                <p className="pf-muted mt-2 text-sm">
                  Trusted by bloggers, researchers, marketers, founders, and ESL writers who want
                  authentic prose without losing precision.
                </p>
              </div>
            </Reveal>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {PERSONAS.map((p, idx) => (
                <Reveal key={p.role} delayMs={idx * 70}>
                  <div className="pf-card-pure pf-card-hover p-5 h-full">
                    <h3 className="font-bold text-base">{p.role}</h3>
                    <p className="pf-muted text-sm mt-2 leading-relaxed">{p.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <PricingSection />

        {/* FAQ */}
        <section className="max-w-3xl mx-auto px-5 py-16 md:py-20">
          <Reveal>
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.025em]">
                Frequently asked questions
              </h2>
              <p className="pf-muted mt-2 text-sm">
                Straight answers on privacy, accuracy, billing, and API access.
              </p>
            </div>
          </Reveal>
          <div className="space-y-3">
            {FAQ.map((item) => (
              <details key={item.q} className="pf-card-pure pf-faq p-5 group">
                <summary className="font-semibold cursor-pointer flex items-center justify-between gap-4 list-none">
                  <span>{item.q}</span>
                  <span
                    className="pf-faq-icon inline-flex items-center justify-center w-6 h-6 rounded text-sm shrink-0"
                    style={{ background: "var(--pf-surface-2)", color: "var(--pf-text)" }}
                  >
                    +
                  </span>
                </summary>
                <p className="pf-muted mt-3.5 text-sm leading-relaxed pr-6">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Final Deep Espresso CTA Band */}
        <section className="pf-espresso-band py-20">
          <Reveal>
            <div className="max-w-3xl mx-auto px-5 text-center">
              <h2
                className="text-3xl md:text-5xl font-bold tracking-[-0.03em]"
                style={{ color: "var(--pf-espresso-ink)" }}
              >
                Your ideas. Your facts.{" "}
                <span style={{ color: "var(--pf-espresso-muted)" }} className="font-medium">
                  Your natural voice.
                </span>
              </h2>
              <p className="mt-4 text-base md:text-lg" style={{ color: "var(--pf-espresso-muted)" }}>
                Start with 500 free words every month. Zero drafts stored.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <a href="/login?mode=signup" className="pf-btn pf-btn-primary text-sm px-6 py-3.5">
                  Get started free
                </a>
                <a
                  href="/docs"
                  className="pf-btn text-sm px-6 py-3.5"
                  style={{ background: "var(--pf-espresso-ink)", color: "var(--pf-text)" }}
                >
                  Explore Developer API
                </a>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
