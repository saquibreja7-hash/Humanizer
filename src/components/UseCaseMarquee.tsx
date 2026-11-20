const CASES = [
  { who: "Bloggers", line: "Posts that sound like you on a good day.", tone: "accent" },
  { who: "Researchers", line: "Citations, dates and quotes stay locked.", tone: "ink" },
  { who: "Marketers", line: "Briefs that read clean, not canned.", tone: "gold" },
  { who: "Founders", line: "Investor updates in your own voice.", tone: "sage" },
  { who: "ESL writers", line: "Idiomatic English without losing meaning.", tone: "accent" },
  { who: "Newsletter writers", line: "Varied rhythm, every single issue.", tone: "ink" },
] as const;

const TONES: Record<string, { bg: string; fg: string }> = {
  accent: { bg: "var(--pf-accent-soft)", fg: "var(--pf-accent)" },
  ink: { bg: "var(--pf-ink-soft)", fg: "var(--pf-ink)" },
  gold: { bg: "var(--pf-gold-soft)", fg: "var(--pf-gold-deep)" },
  sage: { bg: "var(--pf-sage-soft)", fg: "var(--pf-sage)" },
};

export default function UseCaseMarquee() {
  const items = [...CASES, ...CASES];
  return (
    <div className="pf-marquee overflow-hidden py-2">
      <div className="pf-marquee-track gap-4">
        {items.map((c, i) => {
          const t = TONES[c.tone];
          return (
            <div
              key={i}
              className="shrink-0 w-[260px] rounded-xl border p-4"
              style={{ background: t.bg, borderColor: "transparent" }}
              aria-hidden={i >= CASES.length}
            >
              <div className="text-xs font-bold uppercase tracking-wider" style={{ color: t.fg }}>
                {c.who}
              </div>
              <p className="pf-serif text-[15px] mt-1.5 leading-snug" style={{ color: "var(--pf-text)" }}>
                {c.line}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
