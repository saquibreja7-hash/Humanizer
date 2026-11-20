"use client";

import { useState } from "react";

const BEFORE = [
  { text: "In today's rapidly evolving landscape,", cliche: true },
  { text: " remote work has transformed modern teams. ", cliche: false },
  { text: "It is of paramount importance", cliche: true },
  { text: " to foster cross-functional alignment, ", cliche: false },
  { text: "ultimately delivering unprecedented value", cliche: true },
  { text: " across every department.", cliche: false },
];

const AFTER =
  "Remote work changed how most teams run their day. People skip the commute and keep their own hours. The harder part is knowing when to log off, so clear habits matter more than long playbooks.";

/** Drag the handle to wipe from the stiff AI draft to the refined version. */
export default function WipeCompare() {
  const [pos, setPos] = useState(50);

  return (
    <div className="relative rounded-2xl border overflow-hidden select-none" style={{ borderColor: "var(--pf-border)" }}>
      {/* Refined layer (full width, underneath) */}
      <div className="p-6 sm:p-8 min-h-[260px] sm:min-h-[220px]" style={{ background: "var(--pf-ink-soft)" }}>
        <div className="text-xs font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--pf-ink)" }}>
          <span className="w-2 h-2 rounded-full" style={{ background: "var(--pf-sage)" }} />
          Refined with ProseFlow
        </div>
        <p className="pf-serif text-[17px] sm:text-[19px] leading-[1.7]" style={{ color: "var(--pf-ink-deep)" }}>
          {AFTER}
        </p>
      </div>

      {/* Draft layer (clipped from the right) */}
      <div
        className="absolute inset-0 p-6 sm:p-8"
        style={{ background: "var(--pf-surface-pure)", clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        aria-hidden={pos < 5}
      >
        <div className="text-xs font-semibold mb-3 flex items-center gap-2 pf-muted">
          <span className="w-2 h-2 rounded-full" style={{ background: "var(--pf-accent)" }} />
          Raw AI draft
        </div>
        <p className="pf-serif text-[17px] sm:text-[19px] leading-[1.7] pf-muted">
          {BEFORE.map((p, i) =>
            p.cliche ? (
              <mark
                key={i}
                className="px-1 rounded"
                style={{ background: "var(--pf-accent-soft)", color: "var(--pf-accent)" }}
              >
                {p.text}
              </mark>
            ) : (
              <span key={i}>{p.text}</span>
            ),
          )}
        </p>
      </div>

      {/* Handle */}
      <div
        className="pointer-events-none absolute top-0 bottom-0 w-[2px]"
        style={{ left: `${pos}%`, background: "var(--pf-gold)" }}
      >
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 left-1/2 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-lg"
          style={{ background: "var(--pf-gold)", color: "#fff" }}
        >
          ⇆
        </div>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label="Drag to compare the raw draft and the refined version"
        className="pf-wipe-range absolute inset-0 w-full h-full opacity-0"
      />
    </div>
  );
}
