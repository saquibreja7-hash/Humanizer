import Link from "next/link";
import { BRAND } from "@/lib/brand";
import BeforeAfter from "@/components/BeforeAfter";
import PricingSection from "@/components/PricingSection";

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

function BrandAsterisk({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
      <line x1="12" y1="3" x2="12" y2="21" />
      <line x1="4.2" y1="7.5" x2="19.8" y2="16.5" />
      <line x1="19.8" y1="7.5" x2="4.2" y2="16.5" />
    </svg>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Architectural Top Bar (reference-inspired brand dock + burgundy/white CTAs) */}
      <header
        className="sticky top-0 z-40 pf-glass border-b"
        style={{ borderColor: "color-mix(in srgb, var(--pf-border) 80%, transparent)" }}
      >
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="inline-flex items-center rounded-md overflow-hidden border shadow-2xs"
              style={{ borderColor: "var(--pf-border)", background: "var(--pf-surface-2)" }}
            >
              <span className="inline-flex items-center gap-2 px-3 py-1.5 font-bold text-sm tracking-tight">
                <span
                  className="inline-flex items-center justify-center w-5 h-5 rounded"
                  style={{ background: "var(--pf-espresso)", color: "#f4f1ea" }}
                >
                  <BrandAsterisk size={12} />
                </span>
                <span>{BRAND.name.toLowerCase()}.</span>
              </span>
              <span
                className="px-2.5 py-2 text-[11px] font-mono hidden sm:inline-flex items-center"
                style={{ background: "var(--pf-espresso)", color: "#f4f1ea" }}
                aria-hidden="true"
              >
                =
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-sm font-medium pf-muted">
              <a href="#demo" className="hover:text-[var(--pf-text)] transition-colors">
                Live Demo
              </a>
              <a href="#about" className="hover:text-[var(--pf-text)] transition-colors">
                About
              </a>
              <a href="#features" className="hover:text-[var(--pf-text)] transition-colors">
                Features
              </a>
              <a href="#pricing" className="hover:text-[var(--pf-text)] transition-colors">
                Pricing
              </a>
              <a href="/docs" className="hover:text-[var(--pf-text)] transition-colors">
                API Docs
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <a href="/login" className="pf-btn pf-btn-primary text-xs sm:text-sm px-4 py-2">
              Log in
            </a>
            <a href="/login?mode=signup" className="pf-btn pf-btn-ghost text-xs sm:text-sm px-4 py-2">
              Sign up
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero on Warm Limestone (#E4E1D2) with subtle architectural node lines */}
        <section className="relative overflow-hidden">
          {/* Subtle architectural pipeline grid backdrop */}
          <svg
            className="pointer-events-none absolute inset-0 w-full h-full opacity-55"
            viewBox="0 0 1440 760"
            fill="none"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
          >
            <g stroke="var(--pf-border)" strokeWidth="1.2">
              <path d="M0 160 H180 V270 H420" />
              <path d="M0 320 H260 V450 H520" />
              <path d="M1440 150 H1210 V280 H980" />
              <path d="M1440 340 H1150 V460 H910" />
              <path d="M290 0 V190 H470" />
              <path d="M1130 0 V210 H940" />
              <rect x="155" y="255" width="48" height="28" rx="6" fill="var(--pf-surface)" />
              <rect x="1188" y="198" width="44" height="44" rx="10" fill="var(--pf-surface-pure)" />
              <rect x="1220" y="328" width="52" height="24" rx="6" fill="var(--pf-surface)" />
              <rect x="82" y="308" width="38" height="24" rx="6" fill="var(--pf-surface)" />
            </g>
          </svg>

          <div className="relative max-w-6xl mx-auto px-5 pt-16 md:pt-22 pb-16 md:pb-20">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 text-xs font-semibold mb-6 px-3 py-1.5 rounded-md border" style={{ background: "var(--pf-surface)", borderColor: "var(--pf-border)" }}>
                <span
                  className="inline-flex items-center justify-center w-4 h-4 rounded-xs text-[10px] font-bold"
                  style={{ background: "var(--pf-accent)", color: "#fff" }}
                >
                  ✳
                </span>
                <span>Iterative Base-Model Engine · Parallel Cloud Streaming</span>
              </div>

              <h1 className="text-4xl sm:text-6xl md:text-[66px] font-bold tracking-[-0.035em] leading-[1.03]">
                Smarter{" "}
                <span className="pf-muted font-medium">Natural</span>
                <br />
                Writing Refinement
              </h1>

              <p className="pf-muted mt-6 text-base md:text-lg leading-relaxed max-w-xl mx-auto">
                Gain complete, confident control over every draft. Turn stiff AI phrasing into
                clear, authentic prose—with every fact, quote, and figure preserved.
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

            {/* Editorial intro + 2 signature Deep Espresso (#341815) metric ring cards */}
            <div className="mt-14 grid gap-5 lg:grid-cols-12 items-end">
              <div className="lg:col-span-5 pb-1">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider pf-muted mb-3">
                  <BrandAsterisk size={11} />
                  <span>Natural Voice Engine</span>
                </div>
                <p className="text-xl md:text-2xl font-medium leading-snug tracking-[-0.02em]">
                  {BRAND.name} helps writers eliminate robotic phrasing, restore natural cadence,{" "}
                  <span className="pf-muted">
                    and keep every citation, quote, and figure locked with effortless precision.
                  </span>
                </p>
              </div>

              {/* Espresso Card 1: Phrasing Rebuilt */}
              <div className="pf-dark-card p-5 lg:col-span-3">
                <div className="flex items-center justify-between text-[11px]" style={{ color: "var(--pf-espresso-muted)" }}>
                  <span>Phrasing Rebuilt</span>
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-semibold"
                    style={{ background: "var(--pf-accent)", color: "#fff" }}
                  >
                    5 passes
                  </span>
                </div>
                <div className="mt-3 text-3xl font-bold tracking-tight pf-mono text-white">96.4%</div>
                <div className="mt-1 inline-flex items-center gap-1.5 text-[11px]">
                  <span className="px-1.5 py-0.5 rounded font-semibold" style={{ background: "rgba(124,53,57,0.45)", color: "#f6c9cc" }}>
                    ~7.4s
                  </span>
                  <span style={{ color: "var(--pf-espresso-muted)" }}>parallel cloud stream</span>
                </div>
                <div className="mt-4 pt-3 border-t flex items-center gap-4" style={{ borderColor: "var(--pf-espresso-border)" }}>
                  <svg width="46" height="46" viewBox="0 0 42 42" className="shrink-0" aria-hidden="true">
                    <circle cx="21" cy="21" r="16" fill="none" stroke="#4f2a26" strokeWidth="4.5" />
                    <circle cx="21" cy="21" r="16" fill="none" stroke="#f4f1ea" strokeWidth="4.5" strokeDasharray="96 100" strokeLinecap="round" transform="rotate(-90 21 21)" />
                  </svg>
                  <div className="text-[11px] space-y-1" style={{ color: "var(--pf-espresso-muted)" }}>
                    <div><span className="text-white font-semibold">Clean grammar</span> · zero noise</div>
                    <div><span className="text-white font-semibold">Varied rhythm</span> · Option A &amp; B</div>
                  </div>
                </div>
              </div>

              {/* Espresso Card 2: Fidelity & Privacy */}
              <div className="lg:col-span-4 pf-dark-card p-5">
                <div className="flex items-center justify-between text-[11px]" style={{ color: "var(--pf-espresso-muted)" }}>
                  <span>Fidelity Shield &amp; Privacy</span>
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-semibold"
                    style={{ background: "var(--pf-accent)", color: "#fff" }}
                  >
                    RAM only
                  </span>
                </div>
                <div className="mt-3 text-3xl font-bold tracking-tight pf-mono text-white">100% Kept</div>
                <div className="mt-1 inline-flex items-center gap-1.5 text-[11px]">
                  <span className="px-1.5 py-0.5 rounded font-semibold" style={{ background: "rgba(124,53,57,0.45)", color: "#f6c9cc" }}>
                    0 bytes
                  </span>
                  <span style={{ color: "var(--pf-espresso-muted)" }}>draft text stored in DB</span>
                </div>
                <div className="mt-4 pt-3 border-t flex items-center gap-4" style={{ borderColor: "var(--pf-espresso-border)" }}>
                  <svg width="46" height="46" viewBox="0 0 42 42" className="shrink-0" aria-hidden="true">
                    <circle cx="21" cy="21" r="16" fill="none" stroke="#4f2a26" strokeWidth="4.5" />
                    <circle cx="21" cy="21" r="16" fill="none" stroke="#c96d72" strokeWidth="4.5" strokeDasharray="100 100" strokeLinecap="round" transform="rotate(-90 21 21)" />
                  </svg>
                  <div className="text-[11px] space-y-1" style={{ color: "var(--pf-espresso-muted)" }}>
                    <div><span className="text-white font-semibold">Quotes &amp; numbers</span> verified live</div>
                    <div><span className="text-white font-semibold">.docx headings</span> preserved intact</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Full-Width Deep Espresso (#341815) Manifesto Band (Signature Reference Block!) */}
        <section id="about" className="pf-espresso-band py-20 md:py-24 scroll-mt-16">
          <div className="max-w-5xl mx-auto px-5 text-center">
            <span
              className="inline-flex items-center gap-2 px-3 py-1 rounded text-[11px] font-bold uppercase tracking-widest mb-8"
              style={{ background: "#e4e1d2", color: "#1a1311" }}
            >
              <BrandAsterisk size={11} />
              <span>About {BRAND.name}</span>
            </span>

            <h2 className="text-2xl sm:text-4xl md:text-[42px] font-medium leading-[1.2] tracking-[-0.025em] max-w-4xl mx-auto text-[#f4f1ea]">
              {BRAND.name}{" "}
              <span
                className="inline-flex items-center align-middle mx-1 rounded-md overflow-hidden border"
                style={{ borderColor: "var(--pf-espresso-border)" }}
                aria-hidden="true"
              >
                <span className="px-1.5 py-1 bg-[#24100e] text-[#f4f1ea]"><BrandAsterisk size={14} /></span>
                <span className="px-1.5 py-1 bg-[#7c3539] text-white"><BrandAsterisk size={14} /></span>
                <span className="px-1.5 py-1 bg-[#e4e1d2] text-[#1a1311]"><BrandAsterisk size={14} /></span>
              </span>{" "}
              helps writers eliminate mechanical phrasing, restore authentic rhythm,{" "}
              <span style={{ color: "var(--pf-espresso-muted)" }}>
                and publish clearer, natural prose across every essay, brief, and document.
              </span>
            </h2>

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
                  <div className="text-3xl md:text-4xl font-semibold tracking-tight text-[#f4f1ea] pf-mono">
                    {stat.big}
                  </div>
                  <div className="text-xs mt-2" style={{ color: "var(--pf-espresso-muted)" }}>
                    {stat.sub}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Interactive Studio Demo */}
        <section id="demo" className="max-w-5xl mx-auto px-5 py-20 md:py-24 scroll-mt-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span
              className="pf-badge mb-4 uppercase tracking-wider text-[11px]"
              style={{ background: "var(--pf-surface-pure)", color: "var(--pf-accent)" }}
            >
              ✳ Interactive Studio
            </span>
            <h2 className="text-3xl md:text-5xl font-bold tracking-[-0.03em]">
              See the difference{" "}
              <span className="pf-muted font-medium">line by line</span>
            </h2>
            <p className="pf-muted mt-3 text-base">
              Switch writing genres, compare Option A vs Option B, or inspect the sentence rhythm graph.
            </p>
          </div>
          <BeforeAfter />
        </section>

        {/* How it works — 3 editorial steps */}
        <section
          id="how"
          className="border-y py-20"
          style={{ background: "var(--pf-surface)", borderColor: "var(--pf-border)" }}
        >
          <div className="max-w-6xl mx-auto px-5">
            <div className="max-w-2xl">
              <span
                className="pf-badge mb-4 uppercase tracking-wider text-[11px]"
                style={{ background: "var(--pf-accent-soft)", color: "var(--pf-accent)", borderColor: "transparent" }}
              >
                How it works
              </span>
              <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.03em]">
                Three calm steps{" "}
                <span className="pf-muted font-medium">from rough draft to natural prose.</span>
              </h2>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {STEPS.map((s) => (
                <div key={s.num} className="pf-card-pure pf-card-hover p-6 md:p-7 flex flex-col">
                  <span
                    className="pf-mono text-xs font-bold px-2.5 py-1 rounded self-start"
                    style={{ background: "var(--pf-accent-soft)", color: "var(--pf-accent)" }}
                  >
                    STEP {s.num}
                  </span>
                  <h3 className="text-xl font-bold mt-4">{s.title}</h3>
                  <p className="pf-muted mt-2.5 text-sm leading-relaxed">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Asymmetric Bento Grid Features */}
        <section id="features" className="max-w-6xl mx-auto px-5 py-20 md:py-24 scroll-mt-16">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span
              className="pf-badge mb-4 uppercase tracking-wider text-[11px]"
              style={{ background: "var(--pf-surface-pure)", color: "var(--pf-accent)" }}
            >
              ✳ Crafted for real writers
            </span>
            <h2 className="text-3xl md:text-5xl font-bold tracking-[-0.03em]">
              Keep your facts.{" "}
              <span className="pf-muted font-medium">Keep your voice.</span>
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-6">
            {/* Bento 1: Fidelity Shield (span 4) */}
            <div className="pf-card-pure pf-card-hover p-6 md:p-7 md:col-span-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider pf-accent">
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
                  text—verifying quotes, dates, and numbers automatically. Want a different take on
                  one section? Regenerate just that single paragraph in one click.
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

            {/* Bento 2: Zero Text Retention (span 2, espresso dark card) */}
            <div className="pf-dark-card p-6 md:p-7 md:col-span-2 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#e5a6aa" }}>
                  Privacy by Design
                </span>
                <h3 className="text-2xl font-bold mt-2 text-white">Zero text retention.</h3>
                <p className="mt-2.5 text-sm leading-relaxed" style={{ color: "var(--pf-espresso-muted)" }}>
                  Your unpublished essays, client briefs, and research drafts are processed strictly
                  in memory and never written to disk or used for training.
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
                  <span className="font-bold" style={{ color: "#e5a6aa" }}>0 bytes</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "var(--pf-espresso-muted)" }}>Model training</span>
                  <span className="font-bold" style={{ color: "#e5a6aa" }}>Never</span>
                </div>
              </div>
            </div>

            {/* Bento 3: Option A & B (span 3) */}
            <div className="pf-card-pure pf-card-hover p-6 md:p-7 md:col-span-3">
              <span className="text-xs font-bold uppercase tracking-wider pf-accent">
                Dual Variations
              </span>
              <h3 className="text-xl font-bold mt-2">Compare Option A &amp; Option B side-by-side</h3>
              <p className="pf-muted mt-2 text-sm leading-relaxed">
                Human writing is never one-size-fits-all. Generate two distinct natural takes in
                one run and pick the rhythm that sounds most like you.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-2.5 text-xs">
                <div
                  className="rounded-lg border p-3"
                  style={{ background: "var(--pf-accent-soft)", borderColor: "var(--pf-accent)" }}
                >
                  <div className="font-bold pf-accent mb-1">Option A · Crisp</div>
                  <div className="pf-muted leading-snug">Direct opening, varied mid-sentence turn…</div>
                </div>
                <div
                  className="rounded-lg border p-3"
                  style={{ background: "var(--pf-surface)", borderColor: "var(--pf-border)" }}
                >
                  <div className="font-bold mb-1">Option B · Conversational</div>
                  <div className="pf-muted leading-snug">Warmer editorial flow with natural pacing…</div>
                </div>
              </div>
            </div>

            {/* Bento 4: .docx Round-Trip (span 3) */}
            <div className="pf-card-pure pf-card-hover p-6 md:p-7 md:col-span-3">
              <span className="text-xs font-bold uppercase tracking-wider pf-accent">
                Document Workflow
              </span>
              <h3 className="text-xl font-bold mt-2">Upload &amp; export formatted .docx files</h3>
              <p className="pf-muted mt-2 text-sm leading-relaxed">
                Stop copy-pasting one paragraph at a time. Drop a 3,000-word Word document—we keep
                section headings untouched, refine body chunks in parallel, and export a clean
                .docx.
              </p>
              <div
                className="mt-5 rounded-lg border p-3.5 text-xs flex items-center justify-between gap-3"
                style={{ background: "var(--pf-surface)", borderColor: "var(--pf-border)" }}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="px-2 py-1 rounded font-bold pf-mono text-[11px]"
                    style={{ background: "var(--pf-accent)", color: "#fff" }}
                  >
                    DOCX
                  </span>
                  <div>
                    <div className="font-semibold">research-review-draft.docx</div>
                    <div className="pf-muted">32 headings preserved · 14 blocks streamed</div>
                  </div>
                </div>
                <span className="font-semibold" style={{ color: "var(--pf-good)" }}>
                  Ready ↓
                </span>
              </div>
            </div>

            {/* Bento 5: Developer REST API (span 6 espresso card) */}
            <div className="pf-dark-card p-6 md:p-8 md:col-span-6 grid md:grid-cols-5 gap-6 items-center">
              <div className="md:col-span-2">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#e5a6aa" }}>
                  Developer REST API
                </span>
                <h3 className="text-2xl font-bold mt-2 text-white">
                  Embed natural voice refinement anywhere.
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed" style={{ color: "var(--pf-espresso-muted)" }}>
                  Generate scoped <code className="text-[#f4d4d6]">pf_sk_...</code> API keys in
                  seconds. Built for content platforms, editorial pipelines, and agency workflows
                  with predictable word-credit billing.
                </p>
                <a href="/docs" className="pf-btn pf-btn-primary mt-5 text-sm px-4 py-2.5">
                  Read API Docs →
                </a>
              </div>
              <div
                className="md:col-span-3 rounded-lg p-4 pf-mono text-xs text-[#f4f1ea] overflow-x-auto leading-relaxed border"
                style={{ background: "rgba(0,0,0,0.34)", borderColor: "var(--pf-espresso-border)" }}
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
          </div>
        </section>

        {/* Who it's built for */}
        <section
          className="border-t py-16"
          style={{ background: "var(--pf-surface)", borderColor: "var(--pf-border)" }}
        >
          <div className="max-w-6xl mx-auto px-5">
            <div className="text-center max-w-xl mx-auto mb-10">
              <h2 className="text-2xl md:text-3xl font-bold tracking-[-0.025em]">
                Built for people who care how their words land
              </h2>
              <p className="pf-muted mt-2 text-sm">
                Trusted by bloggers, researchers, marketers, founders, and ESL writers who want
                authentic prose without losing precision.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {PERSONAS.map((p) => (
                <div key={p.role} className="pf-card-pure pf-card-hover p-5">
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
        <section className="max-w-3xl mx-auto px-5 py-16 md:py-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.025em]">
              Frequently asked questions
            </h2>
            <p className="pf-muted mt-2 text-sm">
              Straight answers on privacy, accuracy, billing, and API access.
            </p>
          </div>
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
          <div className="max-w-3xl mx-auto px-5 text-center">
            <h2 className="text-3xl md:text-5xl font-bold tracking-[-0.03em] text-[#f4f1ea]">
              Your ideas. Your facts.{" "}
              <span style={{ color: "var(--pf-espresso-muted)" }} className="font-medium">
                Your natural voice.
              </span>
            </h2>
            <p className="mt-4 text-base md:text-lg" style={{ color: "var(--pf-espresso-muted)" }}>
              Start with 500 free words every month—no credit card required, zero drafts stored.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a href="/login?mode=signup" className="pf-btn pf-btn-primary text-sm px-6 py-3.5">
                Get started free →
              </a>
              <a
                href="/docs"
                className="pf-btn text-sm px-6 py-3.5 bg-[#f4f1ea] hover:bg-white text-[#1a1311]"
              >
                Explore Developer API
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer
        className="border-t"
        style={{ borderColor: "var(--pf-border)", background: "var(--pf-surface)" }}
      >
        <div className="max-w-6xl mx-auto px-5 py-12 grid gap-8 md:grid-cols-4 text-sm">
          <div>
            <div className="font-bold text-lg flex items-center gap-2">
              <span
                className="inline-flex items-center justify-center w-5 h-5 rounded"
                style={{ background: "var(--pf-accent)", color: "#fff" }}
              >
                <BrandAsterisk size={11} />
              </span>
              {BRAND.name.toLowerCase()}.
            </div>
            <p className="pf-muted mt-2.5 leading-relaxed">
              {BRAND.tagline}. Clear, authentic prose — with every fact, quote, and figure preserved.
            </p>
          </div>
          <div>
            <div className="font-semibold mb-3">Product</div>
            <ul className="pf-muted space-y-2.5">
              <li><a href="#demo" className="hover:text-[var(--pf-text)]">Live Demo</a></li>
              <li><a href="#pricing" className="hover:text-[var(--pf-text)]">Pricing</a></li>
              <li><a href="/docs" className="hover:text-[var(--pf-text)]">Developer API</a></li>
              <li><a href="/login" className="hover:text-[var(--pf-text)]">Log in</a></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold mb-3">Legal</div>
            <ul className="pf-muted space-y-2.5">
              <li><a href="/terms" className="hover:text-[var(--pf-text)]">Terms of Service</a></li>
              <li><a href="/privacy" className="hover:text-[var(--pf-text)]">Privacy Policy</a></li>
              <li><a href="/refunds" className="hover:text-[var(--pf-text)]">Refund Policy</a></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold mb-3">Support</div>
            <ul className="pf-muted space-y-2.5">
              <li>
                <a href={`mailto:${BRAND.supportEmail}`} className="hover:text-[var(--pf-text)]">
                  {BRAND.supportEmail}
                </a>
              </li>
              <li className="text-xs">7-day fair refund guarantee</li>
            </ul>
          </div>
        </div>
        <div
          className="border-t py-5 text-center text-xs pf-muted"
          style={{ borderColor: "var(--pf-border)" }}
        >
          © {new Date().getFullYear()} {BRAND.name}. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
