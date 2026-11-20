"use client";

import { useEffect, useRef, useState } from "react";

export default function AnimatedRing({
  percent,
  stroke = "var(--pf-espresso-ink)",
  track = "var(--pf-espresso-border)",
  size = 48,
}: {
  percent: number;
  stroke?: string;
  track?: string;
  size?: number;
}) {
  const ref = useRef<SVGSVGElement | null>(null);
  const [value, setValue] = useState(0);
  const radius = 16;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setValue(percent);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          requestAnimationFrame(() => setValue(percent));
          io.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [percent]);

  const offset = circumference * (1 - Math.max(0, Math.min(100, value)) / 100);

  return (
    <svg ref={ref} width={size} height={size} viewBox="0 0 42 42" className="shrink-0" aria-hidden="true">
      <circle cx="21" cy="21" r={radius} fill="none" stroke={track} strokeWidth="4.2" />
      <circle
        cx="21"
        cy="21"
        r={radius}
        fill="none"
        stroke={stroke}
        strokeWidth="4.2"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 21 21)"
        style={{ transition: "stroke-dashoffset 1.15s cubic-bezier(0.22, 1, 0.36, 1)" }}
      />
    </svg>
  );
}
