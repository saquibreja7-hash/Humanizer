import Link from "next/link";
import { BRAND } from "@/lib/brand";
import BeforeAfter from "@/components/BeforeAfter";
import PricingSection from "@/components/PricingSection";

const STEPS = [
  {
    num: "01",
    title: "Paste a draft or drop a .docx",
    body: "Bring rough AI notes, essays, or full Word documents. Headings, section titles, and short lines are automatically kept untouched.",
  },
  {
    num: "02",
    title: "Multi-pass natural voice refinement",
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
      {/* Sticky glass navigation */}
      <header
        className="sticky top-0 z-40 pf-glass border-b"
        style={{ borderColor: "color-mix(in srgb, var(--pf-border) 75%, transparent)" }}
      >
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-lg tracking-tight">
            <span
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg shadow-xs"
              style={{ background: "var(--pf-accent)", color: "#fff" }}
              aria-hidden="true"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
                <line x1="16" y1="8" x2="2" y2="22" />
                <line x1="17.5" y1="15" x2="9" y2="15" />
              </svg>
            </span>
            <span>{BRAND.name}</span>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium pf-muted">
            <a href="#demo" className="hover:text-[var(--pf-text)] transition-colors">
              Live Demo
            </a>
            <a href="#how" className="hover:text-[var(--pf-text)] transition-colors">
              How it works
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

          <div className="flex items-center gap-2.5">
            <a href="/login" className="pf-btn pf-btn-ghost text-sm px-3.5 py-2">
              Log in
            </a>
            <a href="/login?mode=signup" className="pf-btn pf-btn-primary text-sm px-4 py-2">
              Start free →
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero section with subtle atmospheric grid */}
        <section className="pf-hero-bg border-b" style={{ borderColor: "var(--pf-border)" }}>
          <div className="max-w-6xl mx-auto px-5 pt-16 md:pt-24 pb-16 md:pb-20">
            <div className="max-w-3xl mx-auto text-center">
              <div
                className="pf-badge mb-6 shadow-xs"
                style={{ background: "var(--pf-surface)", color: "var(--pf-text)" }}
              >
                <span
                  className="w-2 h-2 rounded-full pf-pulse-dot"
                  style={{ background: "var(--pf-accent)" }}
                />
                <span>Iterative Base-Model Engine · Live Parallel Streaming</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.08]">
                Make stiff AI drafts read like{" "}
                <span className="pf-serif italic font-medium pf-accent">you</span> actually
                wrote them.
              </h1>

              <p className="pf-muted mt-6 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
                {BRAND.name} strips out robotic phrasing and monotone cadence—turning rough drafts
                into clear, natural prose while locking in every fact, quote, and figure.
              </p>

              <div className="mt-9 flex flex-wrap items-center justify-center gap-3.5">
                <a href="/login?mode=signup" className="pf-btn pf-btn-primary text-base px-6 py-3.5">
                  Start free — 500 words/mo →
                </a>
                <a href="#demo" className="pf-btn pf-btn-ghost text-base px-6 py-3.5">
                  Explore interactive demo ↓
                </a>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium pf-muted">
                <span>✓ No credit card required</span>
                <span>✓ Zero text retention (RAM only)</span>
                <span>✓ Full .docx upload &amp; export</span>
              </div>
            </div>

            {/* Proof / Key Metrics Ribbon */}
            <div className="mt-14 max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3.5">
              {[
                { val: "~8s", label: "Parallel cloud streaming" },
                { val: "95%+", label: "Stiff phrases rebuilt" },
                { val: "0 bytes", label: "Draft text stored in DB" },
                { val: ".docx", label: "Headings & flow kept" },
              ].map((m) => (
                <div key={m.label} className="pf-card px-4 py-4 text-center">
                  <div className="text-2xl md:text-3xl font-bold tracking-tight pf-accent pf-mono">
                    {m.val}
                  </div>
                  <div className="text-xs pf-muted mt-1 font-medium">{m.label}</div>
                </div>
              ))}
            </div>

            {/* Interactive Studio Demo right inside hero flow */}
            <div id="demo" className="mt-14 max-w-5xl mx-auto scroll-mt-24">
              <BeforeAfter />
            </div>
          </div>
        </section>

        {/* How it works — 3 editorial steps */}
        <section id="how" className="max-w-6xl mx-auto px-5 py-20 md:py-24 scroll-mt-16">
          <div className="max-w-2xl">
            <span
              className="pf-badge mb-4"
              style={{ background: "var(--pf-accent-soft)", color: "var(--pf-accent)", borderColor: "transparent" }}
            >
              How it works
            </span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Three calm steps from{" "}
              <span className="pf-serif italic font-medium pf-accent">mechanical draft</span> to
              publishable prose.
            </h2>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.num} className="pf-card pf-card-hover p-6 md:p-7 flex flex-col">
                <span
                  className="pf-mono text-xs font-bold px-2.5 py-1 rounded-md self-start"
                  style={{ background: "var(--pf-accent-soft)", color: "var(--pf-accent)" }}
                >
                  STEP {s.num}
                </span>
                <h3 className="text-xl font-bold mt-4">{s.title}</h3>
                <p className="pf-muted mt-2.5 text-sm leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Asymmetric Bento Grid Features */}
        <section
          id="features"
          className="border-y py-20 md:py-24 scroll-mt-16"
          style={{ background: "var(--pf-surface-2)", borderColor: "var(--pf-border)" }}
        >
          <div className="max-w-6xl mx-auto px-5">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span
                className="pf-badge mb-4"
                style={{ background: "var(--pf-surface)", color: "var(--pf-accent)" }}
              >
                Crafted for real writers
              </span>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                Everything you need to keep your{" "}
                <span className="pf-serif italic font-medium pf-accent">facts &amp; voice</span>{" "}
                intact.
              </h2>
            </div>

            <div className="grid gap-5 md:grid-cols-6">
              {/* Bento 1: Fidelity Shield (span 4) */}
              <div className="pf-card pf-card-hover p-6 md:p-7 md:col-span-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider pf-accent">
                      Fidelity Shield
                    </span>
                    <span
                      className="pf-badge text-[11px]"
                      style={{ background: "var(--pf-accent-soft)", color: "var(--pf-good)", borderColor: "transparent" }}
                    >
                      Live Fact Verification
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold mt-2">
                    Never lose a quote, statistic, or argument.
                  </h3>
                  <p className="pf-muted mt-2.5 text-sm leading-relaxed max-w-xl">
                    After every pass, ProseFlow checks your rewritten draft against your source
                    text—verifying quotes, dates, and numbers automatically. Spot a paragraph you
                    want phrased differently? Regenerate just that single paragraph in one click.
                  </p>
                </div>

                <div
                  className="mt-6 rounded-xl border p-4 flex flex-wrap items-center justify-between gap-3 text-xs"
                  style={{ background: "var(--pf-bg)", borderColor: "var(--pf-border)" }}
                >
                  <div className="flex flex-wrap gap-2">
                    <span className="pf-badge" style={{ background: "var(--pf-surface)", color: "var(--pf-good)" }}>
                      ✓ 96.4% phrases rebuilt
                    </span>
                    <span className="pf-badge" style={{ background: "var(--pf-surface)", color: "var(--pf-good)" }}>
                      ✓ Quotes 3/3 kept
                    </span>
                    <span className="pf-badge" style={{ background: "var(--pf-surface)", color: "var(--pf-good)" }}>
                      ✓ Numbers 7/7 kept
                    </span>
                  </div>
                  <span
                    className="font-semibold px-2.5 py-1 rounded-md border"
                    style={{ background: "var(--pf-surface)", borderColor: "var(--pf-border)" }}
                  >
                    ↻ Regenerate paragraph
                  </span>
                </div>
              </div>

              {/* Bento 2: Zero Text Retention (span 2, dark editorial card) */}
              <div className="pf-dark-card p-6 md:p-7 md:col-span-2 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
                    Privacy by Design
                  </span>
                  <h3 className="text-2xl font-bold mt-2 text-white">Zero text retention.</h3>
                  <p className="text-neutral-300 mt-2.5 text-sm leading-relaxed">
                    Your unpublished essays, client briefs, and research drafts are processed
                    strictly in memory and never written to disk or used for training.
                  </p>
                </div>
                <div className="mt-6 rounded-xl bg-white/5 border border-white/10 p-3.5 pf-mono text-xs text-teal-300 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Draft input</span>
                    <span>RAM only</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Stored in DB</span>
                    <span className="text-emerald-400 font-bold">0 bytes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Model training</span>
                    <span className="text-emerald-400 font-bold">Never</span>
                  </div>
                </div>
              </div>

              {/* Bento 3: Option A & B (span 3) */}
              <div className="pf-card pf-card-hover p-6 md:p-7 md:col-span-3">
                <span className="text-xs font-bold uppercase tracking-wider pf-accent">
                  Dual Variations
                </span>
                <h3 className="text-xl font-bold mt-2">Compare Option A &amp; Option B side-by-side</h3>
                <p className="pf-muted mt-2 text-sm leading-relaxed">
                  Human writing is never one-size-fits-all. Generate two distinct natural takes in
                  one run and pick the rhythm that sounds most like you.
                </p>
                <div className="mt-5 grid grid-cols-2 gap-2.5 text-xs">
                  <div className="rounded-lg border p-3" style={{ background: "var(--pf-accent-soft)", borderColor: "var(--pf-accent)" }}>
                    <div className="font-bold pf-accent mb-1">Option A · Active</div>
                    <div className="pf-muted leading-snug">Crisp opening, punchy mid-sentence turn…</div>
                  </div>
                  <div className="rounded-lg border p-3" style={{ background: "var(--pf-bg)", borderColor: "var(--pf-border)" }}>
                    <div className="font-bold mb-1">Option B · Conversational</div>
                    <div className="pf-muted leading-snug">Warmer editorial flow with rhetorical pacing…</div>
                  </div>
                </div>
              </div>

              {/* Bento 4: .docx Round-Trip (span 3) */}
              <div className="pf-card pf-card-hover p-6 md:p-7 md:col-span-3">
                <span className="text-xs font-bold uppercase tracking-wider pf-accent">
                  Document Workflow
                </span>
                <h3 className="text-xl font-bold mt-2">Upload &amp; export formatted .docx files</h3>
                <p className="pf-muted mt-2 text-sm leading-relaxed">
                  Stop copy-pasting one paragraph at a time. Drop a 3,000-word Word document—we
                  keep section headings untouched, refine body chunks in parallel, and export a
                  clean .docx.
                </p>
                <div
                  className="mt-5 rounded-lg border p-3.5 text-xs flex items-center justify-between gap-3"
                  style={{ background: "var(--pf-bg)", borderColor: "var(--pf-border)" }}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="px-2 py-1 rounded font-bold pf-mono text-[11px]"
                      style={{ background: "var(--pf-accent-soft)", color: "var(--pf-accent)" }}
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

              {/* Bento 5: Developer REST API (span 6 dark card) */}
              <div className="pf-dark-card p-6 md:p-8 md:col-span-6 grid md:grid-cols-5 gap-6 items-center">
                <div className="md:col-span-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
                    Developer REST API
                  </span>
                  <h3 className="text-2xl font-bold mt-2 text-white">
                    Embed natural voice refinement anywhere.
                  </h3>
                  <p className="text-neutral-300 mt-2.5 text-sm leading-relaxed">
                    Generate scoped <code className="text-teal-300">pf_sk_...</code> API keys in
                    seconds. Built for content platforms, editorial pipelines, and agency workflows
                    with predictable word-credit billing.
                  </p>
                  <a
                    href="/docs"
                    className="pf-btn mt-5 text-sm bg-teal-500 hover:bg-teal-400 text-neutral-950 px-4 py-2.5"
                  >
                    Read API Docs →
                  </a>
                </div>
                <div className="md:col-span-3 rounded-xl bg-black/55 border border-white/10 p-4 pf-mono text-xs text-neutral-200 overflow-x-auto leading-relaxed">
                  <div className="text-neutral-400 mb-2"># POST /api/v1/rewrite</div>
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
          </div>
        </section>

        {/* Who it's built for */}
        <section className="max-w-6xl mx-auto px-5 pt-20 pb-8">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              Built for people who care how their words land
            </h2>
            <p className="pf-muted mt-2 text-sm">
              Trusted by bloggers, researchers, marketers, founders, and ESL writers who want authentic prose without losing precision.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PERSONAS.map((p) => (
              <div key={p.role} className="pf-card pf-card-hover p-5">
                <h3 className="font-bold text-base">{p.role}</h3>
                <p className="pf-muted text-sm mt-2 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <PricingSection />

        {/* FAQ */}
        <section className="max-w-3xl mx-auto px-5 py-16 md:py-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Frequently asked questions
            </h2>
            <p className="pf-muted mt-2 text-sm">
              Straight answers on privacy, accuracy, billing, and API access.
            </p>
          </div>
          <div className="space-y-3">
            {FAQ.map((item) => (
              <details key={item.q} className="pf-card pf-faq p-5 group">
                <summary className="font-semibold cursor-pointer flex items-center justify-between gap-4 list-none">
                  <span>{item.q}</span>
                  <span
                    className="pf-faq-icon inline-flex items-center justify-center w-6 h-6 rounded-full text-sm shrink-0"
                    style={{ background: "var(--pf-surface-2)", color: "var(--pf-muted)" }}
                  >
                    +
                  </span>
                </summary>
                <p className="pf-muted mt-3.5 text-sm leading-relaxed pr-6">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Final high-contrast CTA */}
        <section className="max-w-6xl mx-auto px-5 pb-20">
          <div className="pf-dark-card p-8 md:p-14 text-center relative overflow-hidden">
            <div
              className="pointer-events-none absolute inset-0 opacity-50"
              style={{
                background:
                  "radial-gradient(ellipse 60% 60% at 50% 0%, rgba(45, 212, 191, 0.22), transparent 70%)",
              }}
            />
            <div className="relative max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
                Your ideas. Your facts.{" "}
                <span className="pf-serif italic font-medium text-teal-300">
                  Your natural voice.
                </span>
              </h2>
              <p className="text-neutral-300 mt-4 text-base md:text-lg">
                Start with 500 free words every month—no credit card required, zero drafts stored.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
                <a
                  href="/login?mode=signup"
                  className="pf-btn bg-teal-400 hover:bg-teal-300 text-neutral-950 text-base px-6 py-3.5 font-bold"
                >
                  Open ProseFlow Editor Free →
                </a>
                <a
                  href="/docs"
                  className="pf-btn border border-white/20 hover:bg-white/10 text-white text-base px-6 py-3.5"
                >
                  Explore Developer API
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t" style={{ borderColor: "var(--pf-border)", background: "var(--pf-surface)" }}>
        <div className="max-w-6xl mx-auto px-5 py-12 grid gap-8 md:grid-cols-4 text-sm">
          <div>
            <div className="font-bold text-lg flex items-center gap-2">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ background: "var(--pf-accent)" }}
              />
              {BRAND.name}
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
