"use client";

import { useEffect, useState } from "react";

interface HeroSample {
  id: string;
  label: string;
  beforeParts: Array<{ text: string; cliche?: boolean }>;
  after: string;
  stats: string;
}

const HERO_SAMPLES: HeroSample[] = [
  {
    id: "essay",
    label: "Essay",
    beforeParts: [
      { text: "In today's rapidly evolving landscape, ", cliche: true },
      { text: "remote work has transformed modern teams. " },
      { text: "It is of paramount importance ", cliche: true },
      { text: "to maintain transparent communication across all 12 departments." },
    ],
    after:
      "Remote work changed how most teams run their day. People skip the commute, yet keeping all 12 departments aligned takes clear habits rather than long meetings.",
    stats: "Numbers 1/1 kept · 5 passes · 0 bytes stored",
  },
  {
    id: "research",
    label: "Research",
    beforeParts: [
      { text: "Furthermore, empirical findings from 2024 demonstrate ", cliche: true },
      { text: "that participatory budgets raised satisfaction by 27%. " },
      { text: "Nevertheless, researchers emphasize ", cliche: true },
      { text: 'that "short-term pilots rarely change habits."' },
    ],
    after:
      'Data from 2024 shows participatory budgets lifted public satisfaction by 27%. Even so, researchers warn that "short-term pilots rarely change habits."',
    stats: "Quotes 1/1 kept · Numbers 2/2 kept · 0 bytes stored",
  },
  {
    id: "memo",
    label: "Memo",
    beforeParts: [
      { text: "As a direct result of this strategic initiative, ", cliche: true },
      { text: "delivery times fell 18.4% in Q3 2026, " },
      { text: "paving the way for sustainable growth ", cliche: true },
      { text: "across 8 hubs." },
    ],
    after:
      "Route consolidation cut Q3 2026 delivery times by 18.4% across 8 hubs, giving our operations team room to expand next quarter.",
    stats: "Numbers 3/3 kept · 5 passes · 0 bytes stored",
  },
];

export default function HeroLiveDemo() {
  const [sampleIdx, setSampleIdx] = useState(0);
  const [phase, setPhase] = useState<"refining" | "streaming" | "done">("streaming");
  const [pass, setPass] = useState(5);
  const [visibleWords, setVisibleWords] = useState(999);

  const sample = HERO_SAMPLES[sampleIdx];
  const words = sample.after.split(" ");

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      setPhase("done");
      setPass(5);
      setVisibleWords(words.length);
      return;
    }

    setPhase("refining");
    setPass(1);
    setVisibleWords(0);

    let wordTimer: ReturnType<typeof setInterval> | undefined;
    let nextTimer: ReturnType<typeof setTimeout> | undefined;

    let currentPass = 1;
    const passTimer = setInterval(() => {
      currentPass += 1;
      setPass(currentPass);
      if (currentPass >= 5) {
        clearInterval(passTimer);
        setPhase("streaming");
        let w = 0;
        wordTimer = setInterval(() => {
          w += 2;
          setVisibleWords(w);
          if (w >= words.length) {
            clearInterval(wordTimer);
            setPhase("done");
            nextTimer = setTimeout(() => {
              setSampleIdx((i) => (i + 1) % HERO_SAMPLES.length);
            }, 4200);
          }
        }, 55);
      }
    }, 240);

    return () => {
      if (passTimer) clearInterval(passTimer);
      if (wordTimer) clearInterval(wordTimer);
      if (nextTimer) clearTimeout(nextTimer);
    };
  }, [sampleIdx, words.length]);

  const streamedText =
    phase === "refining" ? "" : words.slice(0, visibleWords).join(" ");

  return (
    <div className="pf-card-pure overflow-hidden text-left">
      {/* Top Bar: Genre Switcher + Live Pass Indicator */}
      <div
        className="px-4 py-3 border-b flex items-center justify-between gap-2 flex-wrap"
        style={{ background: "var(--pf-surface)", borderColor: "var(--pf-border)" }}
      >
        <div className="inline-flex gap-1">
          {HERO_SAMPLES.map((s, idx) => {
            const active = idx === sampleIdx;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSampleIdx(idx)}
                className="px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer"
                style={
                  active
                    ? { background: "var(--pf-accent)", color: "var(--pf-btn-ink)" }
                    : { color: "var(--pf-muted)" }
                }
              >
                {s.label}
              </button>
            );
          })}
        </div>

        <span className="text-[11px] pf-mono pf-muted">
          {phase === "refining"
            ? `Pass ${pass} of 5`
            : phase === "streaming"
              ? "Streaming prose"
              : "Verified"}
        </span>
      </div>

      {/* Progress Hairline */}
      <div className="h-[2px] w-full" style={{ background: "var(--pf-surface-2)" }}>
        <div
          className="h-full transition-opacity duration-300"
          style={{
            width:
              phase === "refining"
                ? `${(pass / 5) * 45}%`
                : phase === "streaming"
                  ? `${45 + Math.min(55, (visibleWords / Math.max(1, words.length)) * 55)}%`
                  : "100%",
            background: "var(--pf-accent)",
          }}
        />
      </div>

      {/* Source Draft with Highlighted Clichés */}
      <div className="p-4 sm:p-5 border-b" style={{ borderColor: "var(--pf-border)" }}>
        <div className="text-[11px] font-semibold pf-muted mb-2">Source draft</div>
        <p className="text-xs sm:text-sm leading-relaxed pf-muted">
          {sample.beforeParts.map((part, i) =>
            part.cliche ? (
              <mark
                key={i}
                className="px-1 rounded"
                style={{ background: "var(--pf-accent-soft)", color: "var(--pf-accent)" }}
              >
                {part.text}
              </mark>
            ) : (
              <span key={i}>{part.text}</span>
            ),
          )}
        </p>
      </div>

      {/* Live Streamed Natural Prose Output */}
      <div
        className="p-4 sm:p-5 min-h-[124px] flex flex-col justify-between"
        style={{ background: "color-mix(in srgb, var(--pf-accent-soft) 18%, var(--pf-surface-pure))" }}
      >
        <div>
          <div className="text-[11px] font-semibold pf-accent mb-2">Refined output</div>
          <p className="pf-serif text-[15px] sm:text-[16px] leading-[1.7] min-h-[76px]">
            {phase === "refining" ? (
              <span className="pf-muted text-sm font-sans">Rebuilding sentence cadence…</span>
            ) : (
              <>
                {streamedText}
                {phase === "streaming" && (
                  <span
                    className="inline-block w-[2px] h-4 ml-0.5 align-middle pf-caret"
                    style={{ background: "var(--pf-accent)" }}
                    aria-hidden="true"
                  />
                )}
              </>
            )}
          </p>
        </div>

        <div
          className="mt-3 pt-2.5 border-t flex items-center justify-between text-[11px] pf-mono"
          style={{ borderColor: "var(--pf-border)", color: "var(--pf-good)" }}
        >
          <span>✓ {sample.stats}</span>
        </div>
      </div>
    </div>
  );
}
