"use client";

import { useState } from "react";

interface Sample {
  id: string;
  label: string;
  tag: string;
  before: string;
  optionA: string;
  optionB: string;
  beforeLens: number[];
  afterLens: number[];
  stats: {
    rebuilt: string;
    quotes: string;
    numbers: string;
    time: string;
  };
}

const SAMPLES: Sample[] = [
  {
    id: "research",
    label: "Research & Policy",
    tag: "Academic Review",
    before:
      'Public decisions shape everyday life. They affect the roads people use, the services available in their neighbourhoods, and the way public money is spent. Yet the people affected by a decision do not always have an equal opportunity to take part in making it. Furthermore, a central concern of this project is the difference between "voice" and "influence." Both matter in 2026, but they are not the same.',
    optionA:
      'Government officials decide how local roads hold up, which neighbourhood services stay funded, and where public money actually goes. Still, the people living with those outcomes rarely get an equal seat when choices are made. That gap sits at the heart of this project: the difference between "voice" (having a chance to speak) and "influence" (knowing your view can genuinely shift a 2026 policy decision). Both matter, yet they are very different things.',
    optionB:
      'Every neighbourhood feels the weight of public choices—from road repairs and local clinics to how tax money gets divided. Do the residents affected by those decisions actually get to weigh in? Often they cannot, because of work shifts, family duties, or meetings nobody announced clearly. This study separates "voice" from "influence" in 2026: speaking up is one thing, seeing your point shape the final outcome is another.',
    beforeLens: [15, 16, 17, 15, 14, 16],
    afterLens: [24, 18, 33, 9, 15, 29],
    stats: {
      rebuilt: "94% phrasing rebuilt",
      quotes: "Quotes locked 2/2",
      numbers: "Figures locked 1/1",
      time: "7.2s · 5 passes",
    },
  },
  {
    id: "essay",
    label: "Editorial & Blog",
    tag: "Long-Form Column",
    before:
      'In March 2018, Jack Dorsey sat down in New Delhi with a group of women writers and activists. Afterwards he posted a photograph holding a sign that read "Smash Brahminical Patriarchy." The post set off a storm across Indian social media within hours. It is important to note that both sides viewed the episode through completely different lenses, highlighting deep divisions in modern discourse.',
    optionA:
      'Back in March 2018, Twitter CEO Jack Dorsey met a group of women writers and activists in New Delhi and later shared a photo holding a handwritten poster: "Smash Brahminical Patriarchy." Within hours, Indian social media erupted. People looked at the exact same picture and saw opposite stories—one side saw a blunt naming of everyday inequality, while critics saw a sweep against an entire community.',
    optionB:
      'When Jack Dorsey met women journalists and activists in New Delhi in March 2018, one group photograph changed the conversation overnight. He was holding a sign reading "Smash Brahminical Patriarchy." Reaction online was immediate and sharp. For supporters, the words named a real hierarchy; for critics, the message felt personal—turning one photo into a mirror of assumptions neither side wanted to let go.',
    beforeLens: [17, 16, 15, 18, 16],
    afterLens: [31, 7, 36, 12, 26],
    stats: {
      rebuilt: "96% phrasing rebuilt",
      quotes: "Quotes locked 1/1",
      numbers: "Figures locked 1/1",
      time: "6.8s · 5 passes",
    },
  },
  {
    id: "business",
    label: "Founder & Product",
    tag: "Executive Memo",
    before:
      "In today's fast-paced digital landscape, onboarding friction plays a pivotal role in SaaS customer retention. Our Q3 2026 analysis underscores that 42% of new signups drop off before completing workspace setup. Moreover, streamlining the initial checklist will foster stronger activation and ultimately drive sustainable revenue growth across all tiers.",
    optionA:
      "New users decide whether to stick around in their first five minutes. Looking at our Q3 2026 numbers, 42% of signups walk away before they ever finish setting up a workspace. Cutting the setup checklist in half won't just clean up the UI—it is the quickest lever we have to lift activation and keep monthly revenue compounding.",
    optionB:
      "Almost half our new signups—42% in Q3 2026—never make it past workspace setup. That single bottleneck explains more of our churn than pricing or missing features ever did. If we trim onboarding down to two obvious steps this sprint, more teams reach their first real result on day one, and retention follows naturally.",
    beforeLens: [15, 17, 16, 16],
    afterLens: [11, 22, 31, 14],
    stats: {
      rebuilt: "95% phrasing rebuilt",
      quotes: "Clichés removed 4/4",
      numbers: "Figures locked 2/2",
      time: "5.9s · 5 passes",
    },
  },
];

export default function BeforeAfter() {
  const [sampleId, setSampleId] = useState<string>("research");
  const [variant, setVariant] = useState<"A" | "B">("A");
  const [view, setView] = useState<"split" | "rhythm">("split");

  const sample = SAMPLES.find((s) => s.id === sampleId) ?? SAMPLES[0];
  const afterText = variant === "A" ? sample.optionA : sample.optionB;

  return (
    <div className="pf-card-pure overflow-hidden shadow-xl shadow-stone-900/10">
      {/* Studio window top bar */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 px-4 md:px-6 py-3.5 border-b"
        style={{ background: "var(--pf-surface)", borderColor: "var(--pf-border)" }}
      >
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#7c3539" }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#a8918c" }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#cfc8ba" }} />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLES.map((s) => {
              const active = s.id === sampleId;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSampleId(s.id)}
                  className="px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer"
                  style={
                    active
                      ? { background: "var(--pf-accent)", color: "#ffffff" }
                      : { background: "var(--pf-surface-pure)", color: "var(--pf-muted)", border: "1px solid var(--pf-border)" }
                  }
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        <div
          className="inline-flex rounded-md p-0.5 border text-xs font-semibold"
          style={{ background: "var(--pf-surface-pure)", borderColor: "var(--pf-border)" }}
        >
          <button
            type="button"
            onClick={() => setView("split")}
            className="px-2.5 py-1 rounded cursor-pointer transition-colors"
            style={
              view === "split"
                ? { background: "var(--pf-accent-soft)", color: "var(--pf-accent)" }
                : { color: "var(--pf-muted)" }
            }
          >
            Side-by-side
          </button>
          <button
            type="button"
            onClick={() => setView("rhythm")}
            className="px-2.5 py-1 rounded cursor-pointer transition-colors"
            style={
              view === "rhythm"
                ? { background: "var(--pf-accent-soft)", color: "var(--pf-accent)" }
                : { color: "var(--pf-muted)" }
            }
          >
            Sentence rhythm
          </button>
        </div>
      </div>

      {/* Main studio body */}
      {view === "split" ? (
        <div
          className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x"
          style={{ borderColor: "var(--pf-border)" }}
        >
          <div className="p-6 md:p-7 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider pf-muted">
                Before · Raw AI Draft
              </span>
              <span
                className="text-[11px] font-semibold px-2.5 py-0.5 rounded"
                style={{ background: "var(--pf-surface-2)", color: "var(--pf-muted)" }}
              >
                Flat cadence · Clichés
              </span>
            </div>
            <p className="pf-serif text-[16px] leading-[1.78] pf-muted flex-1">{sample.before}</p>
            <div
              className="mt-5 pt-4 border-t flex items-center justify-between text-xs pf-muted"
              style={{ borderColor: "var(--pf-border)" }}
            >
              <span>{sample.tag}</span>
              <span>Uniform ~16w sentences</span>
            </div>
          </div>

          <div
            className="p-6 md:p-7 flex flex-col"
            style={{ background: "color-mix(in srgb, var(--pf-accent-soft) 32%, var(--pf-surface-pure))" }}
          >
            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider pf-accent">
                After · Refined with ProseFlow
              </span>
              <div
                className="inline-flex rounded-md p-0.5 border text-[11px] font-semibold"
                style={{ background: "var(--pf-surface-pure)", borderColor: "var(--pf-border)" }}
              >
                {(["A", "B"] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setVariant(opt)}
                    className="px-2.5 py-0.5 rounded cursor-pointer transition-all"
                    style={
                      variant === opt
                        ? { background: "var(--pf-accent)", color: "#ffffff" }
                        : { color: "var(--pf-muted)" }
                    }
                  >
                    Option {opt}
                  </button>
                ))}
              </div>
            </div>
            <p className="pf-serif text-[16px] leading-[1.78] flex-1">{afterText}</p>
            <div
              className="mt-5 pt-4 border-t flex items-center justify-between text-xs"
              style={{ borderColor: "var(--pf-border)" }}
            >
              <span className="font-semibold pf-accent">Natural varied cadence</span>
              <span className="pf-muted pf-mono">{sample.stats.time}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 md:p-8 grid md:grid-cols-2 gap-8">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider pf-muted mb-1">
              Before · Uniform AI Sentence Lengths
            </div>
            <p className="text-xs pf-muted mb-5">
              Every sentence clusters tightly around 15–18 words, creating a monotone rhythm.
            </p>
            <div className="space-y-3">
              {sample.beforeLens.map((len, i) => (
                <div key={i} className="flex items-center gap-3 text-xs">
                  <span className="w-8 pf-mono pf-muted">S{i + 1}</span>
                  <div className="flex-1 h-3 rounded overflow-hidden" style={{ background: "var(--pf-surface-2)" }}>
                    <div
                      className="h-full rounded transition-all duration-500"
                      style={{ width: `${Math.min(100, (len / 38) * 100)}%`, background: "#9b8f84" }}
                    />
                  </div>
                  <span className="w-10 text-right pf-mono pf-muted">{len}w</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-bold uppercase tracking-wider pf-accent mb-1">
              After · Natural Editorial Cadence
            </div>
            <p className="text-xs pf-muted mb-5">
              ProseFlow mixes short punchy lines with longer flowing thoughts—just like real editors write.
            </p>
            <div className="space-y-3">
              {sample.afterLens.map((len, i) => (
                <div key={i} className="flex items-center gap-3 text-xs">
                  <span className="w-8 pf-mono pf-muted">S{i + 1}</span>
                  <div className="flex-1 h-3 rounded overflow-hidden" style={{ background: "var(--pf-surface-2)" }}>
                    <div
                      className="h-full rounded transition-all duration-500"
                      style={{ width: `${Math.min(100, (len / 38) * 100)}%`, background: "var(--pf-accent)" }}
                    />
                  </div>
                  <span className="w-10 text-right pf-mono font-semibold pf-accent">{len}w</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Fidelity Shield footer bar */}
      <div
        className="px-4 md:px-6 py-3.5 border-t flex flex-wrap items-center justify-between gap-3 text-xs"
        style={{ background: "var(--pf-surface)", borderColor: "var(--pf-border)" }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold uppercase tracking-wider text-[11px] pf-muted mr-1">
            Fidelity Shield
          </span>
          <span
            className="pf-badge"
            style={{ background: "var(--pf-accent-soft)", color: "var(--pf-accent)", borderColor: "transparent" }}
          >
            ✓ {sample.stats.rebuilt}
          </span>
          <span className="pf-badge" style={{ background: "var(--pf-surface-pure)", color: "var(--pf-good)" }}>
            ✓ {sample.stats.quotes}
          </span>
          <span className="pf-badge" style={{ background: "var(--pf-surface-pure)", color: "var(--pf-good)" }}>
            ✓ {sample.stats.numbers}
          </span>
        </div>
        <a href="/login?mode=signup" className="font-semibold pf-accent hover:underline">
          Try with your own draft →
        </a>
      </div>
    </div>
  );
}
