"use client";

import { useState } from "react";

interface DemoPair {
  before: string;
  after: string;
  badges: { label: string; ok: boolean }[];
}

const DEMOS: DemoPair[] = [
  {
    before:
      "In today's rapidly evolving digital landscape, it is of paramount importance to leverage cutting-edge methodologies in order to maximize operational efficiency. Furthermore, organizations that fail to adapt to these paradigm shifts will inevitably find themselves at a significant competitive disadvantage in the marketplace.",
    after:
      "The way teams work keeps changing, and the ones who pay attention to how they operate get more done with less friction. Companies that ignore those shifts don't fall behind overnight — they just quietly lose ground to competitors who moved sooner.",
    badges: [
      { label: "91% of phrases rebuilt", ok: true },
      { label: "Facts kept intact", ok: true },
    ],
  },
  {
    before:
      "It is important to note that regular physical activity confers numerous benefits upon cardiovascular health. Moreover, engaging in consistent exercise regimens has been demonstrated to result in improved outcomes across a variety of health metrics.",
    after:
      "Regular movement does the heart good — that part isn't news. What people miss is how quickly the other numbers follow: blood pressure, resting heart rate, and sleep quality all tend to improve once exercise becomes a habit instead of an event.",
    badges: [
      { label: "94% of phrases rebuilt", ok: true },
      { label: "Meaning preserved", ok: true },
    ],
  },
  {
    before:
      "Remote work arrangements have fundamentally transformed the paradigm of workplace collaboration. Consequently, enterprises must implement comprehensive strategies in order to facilitate optimal communication protocols among distributed team members.",
    after:
      "Working from anywhere changed how teams talk to each other, and mostly for the better. The fix isn't more meetings — it's fewer, sharper ones, plus a shared place where decisions live so nobody has to be awake at the same time to stay in the loop.",
    badges: [
      { label: "89% of phrases rebuilt", ok: true },
      { label: "Structure preserved", ok: true },
    ],
  },
];

export default function BeforeAfter() {
  const [demo, setDemo] = useState(0);
  const [showAfter, setShowAfter] = useState(false);
  const pair = DEMOS[demo];

  return (
    <div className="pf-card p-6 md:p-8">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
        <div className="flex gap-1 rounded-full border p-1" style={{ borderColor: "var(--pf-border)" }}>
          <span
            className={`pf-btn text-sm px-4 py-1.5 rounded-full ${!showAfter ? "pf-btn-primary" : ""}`}
            onClick={() => setShowAfter(false)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && setShowAfter(false)}
          >
            Before
          </span>
          <span
            className={`pf-btn text-sm px-4 py-1.5 rounded-full ${showAfter ? "pf-btn-primary" : ""}`}
            onClick={() => setShowAfter(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && setShowAfter(true)}
          >
            After
          </span>
        </div>
        <div className="flex gap-1.5">
          {DEMOS.map((_, i) => (
            <button
              key={i}
              aria-label={`Example ${i + 1}`}
              onClick={() => {
                setDemo(i);
                setShowAfter(false);
              }}
              className="h-2.5 w-2.5 rounded-full transition-colors"
              style={{
                background:
                  i === demo ? "var(--pf-accent)" : "var(--pf-border)",
              }}
            />
          ))}
        </div>
      </div>

      <div className="pf-serif min-h-[9.5rem] text-lg leading-relaxed whitespace-pre-wrap transition-all duration-300">
        {showAfter ? pair.after : pair.before}
      </div>

      <div className="mt-6 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {(showAfter ? pair.badges : [{ label: "Stiff · generic · robotic", ok: false }]).map((b) => (
            <span
              key={b.label}
              className="pf-badge"
              style={{
                color: showAfter ? (b.ok ? "var(--pf-good)" : "var(--pf-bad)") : "var(--pf-muted)",
                borderColor: "var(--pf-border)",
                background: showAfter && b.ok ? "var(--pf-accent-soft)" : "transparent",
              }}
            >
              {showAfter && <span>{b.ok ? "✓" : "!"}</span>}
              {b.label}
            </span>
          ))}
        </div>
        <button className="pf-btn pf-btn-primary text-sm" onClick={() => setShowAfter((v) => !v)}>
          {showAfter ? "Show the original" : "See the difference →"}
        </button>
      </div>
    </div>
  );
}
