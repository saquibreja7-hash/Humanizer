import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import PublicHeader, { BrandAsterisk } from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import Reveal from "@/components/Reveal";
import AnimatedRing from "@/components/AnimatedRing";

export const metadata: Metadata = {
  title: "About",
  description: `Learn how ${BRAND.name} restores natural human cadence to rough drafts while preserving every fact, quote, and figure under strict zero text retention.`,
};

const PRINCIPLES = [
  {
    num: "01",
    title: "Base-Model Craft Over Synonym Swaps",
    body: "Most rewriting tools swap individual words with awkward thesaurus substitutes or deliberately inject broken grammar. We run an iterative base-model engine that rebuilds sentence rhythm from the ground up while keeping crisp, natural English.",
  },
  {
    num: "02",
    title: "Fidelity Shield Fact Protection",
    body: "Great prose means nothing if a number or citation drifts. Every refinement is checked automatically against your source draft—verifying direct quotes, years, percentages, and currency figures in real time.",
  },
  {
    num: "03",
    title: "Strict Zero Text Retention",
    body: "Your writing belongs exclusively to you. Drafts and uploaded Word documents live only in volatile server memory during your request and are discarded immediately—never saved to a database or used for model training.",
  },
];

const AUDIENCES = [
  {
    role: "Researchers & Academics",
    detail: "Keep citations, dates, and exact quotes locked while smoothing out dry, repetitive first drafts.",
    metric: "100% quotes verified",
  },
  {
    role: "Bloggers & Columnists",
    detail: "Restore conversational pacing, varied sentence rhythm, and a recognizable human voice to long-form essays.",
    metric: "96%+ phrasing rebuilt",
  },
  {
    role: "Marketing & Content Teams",
    detail: "Eliminate overused filler clichés across briefs and landing pages—or automate workflows via our REST API.",
    metric: "REST API + .docx",
  },
  {
    role: "Multilingual & ESL Writers",
    detail: "Polish clear ideas into idiomatic, natural English without losing your personal tone or technical precision.",
    metric: "Natural 1.0 cadence",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />

      {/* Deep Espresso Editorial Hero Banner */}
      <section className="relative pf-espresso-band overflow-hidden border-b" style={{ borderColor: "var(--pf-espresso-border)" }}>
        <Image
          src="/images/about-banner.jpg"
          alt="Open cream manuscript notebook, oxblood fountain pen, ceramic cup, and linen-bound books on a walnut study desk"
          fill
          priority
          sizes="100vw"
          className="object-cover object-right opacity-50"
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(95deg, rgba(36,16,14,0.97) 0%, rgba(36,16,14,0.88) 52%, rgba(36,16,14,0.42) 100%)",
          }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-5 py-16 sm:py-22">
          <div className="max-w-2xl">
            <span
              className="inline-flex items-center gap-2 px-3 py-1 rounded text-[11px] font-bold uppercase tracking-widest mb-5"
              style={{ background: "#dfdacc", color: "#1a1311" }}
            >
              <BrandAsterisk size={11} />
              <span>About {BRAND.name}</span>
            </span>

            <h1 className="text-3xl sm:text-5xl font-bold tracking-[-0.035em] leading-[1.08] text-[#f4f1ea]">
              Restoring{" "}
              <span className="pf-serif italic font-normal text-[#dfdacc]">human cadence</span>{" "}
              to modern writing.
            </h1>

            <p className="mt-4 text-sm sm:text-base leading-relaxed" style={{ color: "#d5c7c2" }}>
              {BRAND.name} was built for writers who care about clarity, rhythm, and accuracy.
              Instead of flat, robotic templates, we help bloggers, researchers, marketers,
              founders, and ESL writers turn rough drafts into prose that reads effortlessly.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-4 pt-6 border-t max-w-lg" style={{ borderColor: "rgba(255,255,255,0.14)" }}>
              {[
                { val: "~8s", label: "Parallel streaming" },
                { val: "95%+", label: "Phrasing rebuilt" },
                { val: "0 bytes", label: "Draft text stored" },
              ].map((m) => (
                <div key={m.label}>
                  <div className="text-lg sm:text-xl font-bold pf-mono text-[#f4f1ea]">{m.val}</div>
                  <div className="text-[11px]" style={{ color: "var(--pf-espresso-muted)" }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1">
        {/* Why We Built ProseFlow */}
        <section className="max-w-6xl mx-auto px-5 py-16 md:py-20 grid lg:grid-cols-12 gap-10 items-center">
          <Reveal className="lg:col-span-6 space-y-5">
            <span
              className="pf-badge uppercase tracking-wider text-[11px]"
              style={{ background: "var(--pf-surface-pure)", color: "var(--pf-accent)" }}
            >
              ✳ Editorial Philosophy
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-[-0.03em] leading-[1.12]">
              Good writing breathes.{" "}
              <span className="pf-muted font-medium">Mechanical drafts don&apos;t.</span>
            </h2>
            <p className="pf-muted text-[15px] leading-relaxed">
              Modern drafts often arrive with predictable sentence lengths, stiff transitions, and
              repetitive filler phrases. Ordinary paraphrasing tools try to fix that by swapping
              words one by one—which makes the prose sound even stranger, or worse, breaks basic
              grammar.
            </p>
            <p className="pf-muted text-[15px] leading-relaxed">
              {BRAND.name} takes a fundamentally calmer approach: an iterative base-model engine
              that refines each paragraph across multiple gentle passes, restoring natural sentence
              variation while keeping every fact, date, and direct quote intact.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <Link href="/demo" className="pf-btn pf-btn-primary text-sm px-5 py-2.5">
                Try interactive demo →
              </Link>
              <Link href="/features" className="pf-btn pf-btn-ghost text-sm px-5 py-2.5">
                Explore all features
              </Link>
            </div>
          </Reveal>

          <Reveal delayMs={100} className="lg:col-span-6">
            <div className="pf-card-pure overflow-hidden shadow-lg shadow-black/[0.06]">
              <div className="relative h-64 sm:h-80">
                <Image
                  src="/images/editorial-desk.jpg"
                  alt="Open cream cotton notebook with oxblood fountain pen on dark walnut desk"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
              <div className="p-6 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider pf-accent">
                    Measured Editorial Precision
                  </div>
                  <div className="text-base font-semibold mt-1">
                    Clean grammar + varied sentence rhythm
                  </div>
                </div>
                <AnimatedRing percent={96.4} stroke="#7c3539" track="#e4e1d2" size={50} />
              </div>
            </div>
          </Reveal>
        </section>

        {/* 3 Engineering Pillars */}
        <section className="pf-espresso-band py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-5">
            <Reveal className="max-w-2xl mb-12">
              <span
                className="inline-flex items-center gap-2 px-3 py-1 rounded text-[11px] font-bold uppercase tracking-widest mb-4"
                style={{ background: "#dfdacc", color: "#1a1311" }}
              >
                <BrandAsterisk size={11} />
                <span>How We Build</span>
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-[-0.03em] text-[#f4f1ea]">
                Three non-negotiable standards
              </h2>
            </Reveal>

            <div className="grid md:grid-cols-3 gap-6">
              {PRINCIPLES.map((item, idx) => (
                <Reveal key={item.num} delayMs={idx * 80}>
                  <div className="pf-dark-card p-6 sm:p-7 h-full flex flex-col">
                    <div className="pf-mono text-xs font-bold text-[#e5a6aa] mb-3">{item.num}</div>
                    <h3 className="text-lg font-bold text-[#f4f1ea]">{item.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed" style={{ color: "#d5c7c2" }}>
                      {item.body}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Built For Real Writers */}
        <section className="max-w-6xl mx-auto px-5 py-16 md:py-20">
          <Reveal className="text-center max-w-2xl mx-auto mb-12">
            <span
              className="pf-badge uppercase tracking-wider text-[11px] mb-3"
              style={{ background: "var(--pf-surface-pure)", color: "var(--pf-accent)" }}
            >
              ✳ Built For Honest Writers
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-[-0.03em]">
              Who writes with {BRAND.name}
            </h2>
          </Reveal>

          <div className="grid sm:grid-cols-2 gap-5">
            {AUDIENCES.map((a, idx) => (
              <Reveal key={a.role} delayMs={idx * 70}>
                <div className="pf-card-pure pf-card-hover p-6 sm:p-7 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <h3 className="text-lg font-bold">{a.role}</h3>
                      <span
                        className="px-2.5 py-0.5 rounded text-[11px] font-semibold pf-mono"
                        style={{ background: "var(--pf-accent-soft)", color: "var(--pf-accent)" }}
                      >
                        {a.metric}
                      </span>
                    </div>
                    <p className="pf-muted text-sm leading-relaxed">{a.detail}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link href="/login?mode=signup" className="pf-btn pf-btn-primary text-sm px-6 py-3.5">
              Start with 500 free words →
            </Link>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
