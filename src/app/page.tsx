import BeforeAfter from "@/components/BeforeAfter";
import PricingSection from "@/components/PricingSection";
import Link from "next/link";
import { BRAND } from "@/lib/brand";

const FEATURES = [
  {
    title: "Iterative refinement engine",
    body: "Every draft cycles through multiple rewriting rounds — Fast, Standard, or Deep — until the prose reads like it was written by a person, not generated.",
  },
  {
    title: "Fidelity Shield",
    body: "Live badges track how much phrasing was rebuilt and confirm every quote and number survived the rewrite. Drift warnings appear the moment something changes.",
  },
  {
    title: "Option A / Option B",
    body: "Generate two independent versions of your draft, compare them side by side, and keep the one that sounds most like you.",
  },
  {
    title: "Word document support",
    body: "Upload a .docx, keep every heading in place, and export a clean, formatted Word document when you're done.",
  },
  {
    title: "Developer REST API",
    body: "ProseFlow for Teams and API plans ship with a simple REST endpoint — send text, get refined prose back, integrate anywhere.",
  },
  {
    title: "Zero text retention",
    body: "Your drafts are processed in memory and never stored in our database, never used for training, and never seen by anyone but you.",
  },
];

const FAQ = [
  {
    q: "Who is ProseFlow for?",
    a: "Bloggers, researchers, marketers, founders, and multilingual/ESL writers who want their drafts to sound clear and authentic. If you write with the help of AI tools and want the final result to carry your own voice, ProseFlow is built for you.",
  },
  {
    q: "How is ProseFlow different from a grammar checker?",
    a: "Grammar checkers fix mechanics. ProseFlow reworks rhythm, flow, and word choice at the sentence level — replacing stiff, formulaic phrasing with natural, readable prose — and shows you a fidelity report so you can confirm nothing factual changed.",
  },
  {
    q: "Do you store my writing?",
    a: "No. ProseFlow has a strict zero-text-retention policy: your input and the refined output are processed in memory only. We keep anonymous word counts, timestamps, and fidelity metrics for billing — never your text.",
  },
  {
    q: "Can ProseFlow keep my headings and formatting?",
    a: "Yes. Headings and short standalone lines pass through untouched, paragraphs stay paragraphs, and .docx uploads export back to clean, formatted Word documents.",
  },
  {
    q: "What if a rewrite changes a number or quote?",
    a: "The Fidelity Shield checks every rewrite. If a quote or number drifts, you get a yellow warning banner naming exactly what changed — and you can regenerate any single paragraph without re-running the whole document.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes — one click, no email required. We also offer a fair 7-day refund policy if the product isn't right for you.",
  },
];

export default function Home() {
  return (
    <main>
      {/* Header */}
      <header
        className="sticky top-0 z-40 border-b backdrop-blur"
        style={{ borderColor: "var(--pf-border)", background: "color-mix(in srgb, var(--pf-bg) 85%, transparent)" }}
      >
        <nav className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/" className="font-bold text-xl">
            {BRAND.name}
          </Link>
          <div className="flex items-center gap-6 text-sm font-medium">
            <a href="#demo" className="hidden sm:block hover:opacity-70">
              Demo
            </a>
            <a href="#features" className="hidden sm:block hover:opacity-70">
              Features
            </a>
            <a href="/docs" className="hover:opacity-70">
              Docs
            </a>
            <a href="#pricing" className="hover:opacity-70">
              Pricing
            </a>
            <a href="/login" className="hover:opacity-70">
              Log in
            </a>
            <a href="/login?mode=signup" className="pf-btn pf-btn-primary text-sm">
              Get started free
            </a>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-5 pt-16 pb-10 text-center">
        <span className="pf-badge" style={{ background: "var(--pf-accent-soft)", borderColor: "var(--pf-border)" }}>
          For bloggers · researchers · marketers · founders · ESL writers
        </span>
        <h1 className="mt-6 text-4xl md:text-6xl font-bold tracking-tight leading-[1.08] max-w-3xl mx-auto">
          Turn stiff, robotic AI drafts into writing that sounds like{" "}
          <span className="pf-serif italic pf-accent">you</span>.
        </h1>
        <p className="pf-muted mt-6 text-lg max-w-2xl mx-auto leading-relaxed">
          {BRAND.positioning}
        </p>
        <div className="mt-8 flex items-center justify-center gap-4 flex-wrap">
          <a href="/login?mode=signup" className="pf-btn pf-btn-primary">
            Start free — 500 words/month
          </a>
          <a href="#demo" className="pf-btn pf-btn-ghost">
            See a live example ↓
          </a>
        </div>
        <p className="pf-muted text-sm mt-4">
          No credit card required · Zero text retention · Cancel anytime
        </p>
      </section>

      {/* Interactive demo */}
      <section id="demo" className="max-w-4xl mx-auto px-5 py-10">
        <BeforeAfter />
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-5 py-16">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-center">
          Everything a serious writer needs
        </h2>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="pf-card p-6">
              <h3 className="font-bold text-lg">{f.title}</h3>
              <p className="pf-muted mt-2.5 text-sm leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <PricingSection />

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-5 py-16">
        <h2 className="text-3xl font-bold tracking-tight text-center">Frequently asked questions</h2>
        <div className="mt-8 space-y-3">
          {FAQ.map((item) => (
            <details key={item.q} className="pf-card p-5">
              <summary className="font-semibold cursor-pointer list-none">
                {item.q}
              </summary>
              <p className="pf-muted mt-3 text-sm leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t" style={{ borderColor: "var(--pf-border)" }}>
        <div className="max-w-6xl mx-auto px-5 py-10 grid gap-8 md:grid-cols-4 text-sm">
          <div>
            <div className="font-bold text-lg">{BRAND.name}</div>
            <p className="pf-muted mt-2 leading-relaxed">
              {BRAND.tagline}. Clear, authentic prose — with every fact, quote, and figure preserved.
            </p>
          </div>
          <div>
            <div className="font-semibold mb-3">Product</div>
            <ul className="pf-muted space-y-2">
              <li>
                <a href="#pricing" className="hover:opacity-70">
                  Pricing
                </a>
              </li>
              <li>
                <a href="/docs" className="hover:opacity-70">
                  Developer API
                </a>
              </li>
              <li>
                <a href="/login" className="hover:opacity-70">
                  Log in
                </a>
              </li>
            </ul>
          </div>
          <div>
            <div className="font-semibold mb-3">Legal</div>
            <ul className="pf-muted space-y-2">
              <li>
                <a href="/terms" className="hover:opacity-70">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="/privacy" className="hover:opacity-70">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/refunds" className="hover:opacity-70">
                  Refund Policy
                </a>
              </li>
            </ul>
          </div>
          <div>
            <div className="font-semibold mb-3">Support</div>
            <ul className="pf-muted space-y-2">
              <li>
                <a href={`mailto:${BRAND.supportEmail}`} className="hover:opacity-70">
                  {BRAND.supportEmail}
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t py-5 text-center text-xs pf-muted" style={{ borderColor: "var(--pf-border)" }}>
          © {new Date().getFullYear()} {BRAND.name}. All rights reserved.
        </div>
      </footer>
    </main>
  );
}
