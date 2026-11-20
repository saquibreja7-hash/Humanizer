import Image from "next/image";
import Link from "next/link";
import { BRAND } from "@/lib/brand";

function BrandAsterisk({ size = 12 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <line x1="12" y1="3" x2="12" y2="21" />
      <line x1="4.2" y1="7.5" x2="19.8" y2="16.5" />
      <line x1="19.8" y1="7.5" x2="4.2" y2="16.5" />
    </svg>
  );
}

export interface SummaryHighlight {
  value: string;
  label: string;
}

export default function LegalLayout({
  title,
  updated,
  eyebrow = "Trust & Transparency Center",
  subtitle,
  highlights,
  children,
}: {
  title: string;
  updated: string;
  eyebrow?: string;
  subtitle?: string;
  highlights?: SummaryHighlight[];
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Architectural Top Bar */}
      <header
        className="sticky top-0 z-40 pf-glass border-b"
        style={{ borderColor: "color-mix(in srgb, var(--pf-border) 82%, transparent)" }}
      >
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
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

            <nav className="hidden md:flex items-center gap-5 text-sm font-medium pf-muted">
              <Link href="/privacy" className="hover:text-[var(--pf-text)] transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-[var(--pf-text)] transition-colors">
                Terms
              </Link>
              <Link href="/refunds" className="hover:text-[var(--pf-text)] transition-colors">
                Refunds
              </Link>
              <Link href="/docs" className="hover:text-[var(--pf-text)] transition-colors">
                API Docs
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/login" className="pf-btn pf-btn-primary text-xs px-4 py-2">
              Log in
            </Link>
            <Link href="/" className="pf-btn pf-btn-ghost text-xs px-4 py-2 hidden sm:inline-flex">
              Home
            </Link>
          </div>
        </div>
      </header>

      {/* Deep Espresso Editorial Trust Banner with Nano Banana Archival Paper Photo */}
      <section className="relative pf-espresso-band overflow-hidden border-b" style={{ borderColor: "var(--pf-espresso-border)" }}>
        <Image
          src="/images/trust-banner.jpg"
          alt="Archival deckle-edge cream paper stack bound with oxblood ribbon, brass paperweight, and fountain pen on dark walnut"
          fill
          priority
          sizes="100vw"
          className="object-cover object-right opacity-45"
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(95deg, rgba(36,16,14,0.97) 0%, rgba(36,16,14,0.88) 56%, rgba(36,16,14,0.45) 100%)",
          }}
        />

        <div className="relative z-10 max-w-5xl mx-auto px-5 py-12 sm:py-16">
          <div className="max-w-2xl">
            <span
              className="inline-flex items-center gap-2 px-3 py-1 rounded text-[11px] font-bold uppercase tracking-widest mb-4"
              style={{ background: "#dfdacc", color: "#1a1311" }}
            >
              <BrandAsterisk size={11} />
              <span>{eyebrow}</span>
            </span>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-[-0.035em] text-[#f4f1ea]">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-3 text-sm sm:text-base leading-relaxed" style={{ color: "#d5c7c2" }}>
                {subtitle}
              </p>
            )}
            <p className="text-xs pf-mono mt-4" style={{ color: "var(--pf-espresso-muted)" }}>
              Last updated: {updated}
            </p>
          </div>

          {highlights && highlights.length > 0 && (
            <div className="mt-8 grid sm:grid-cols-3 gap-3.5 max-w-3xl">
              {highlights.map((h) => (
                <div
                  key={h.label}
                  className="rounded-xl border p-4 backdrop-blur-md"
                  style={{
                    background: "rgba(36, 16, 14, 0.82)",
                    borderColor: "var(--pf-espresso-border)",
                  }}
                >
                  <div className="text-base sm:text-lg font-bold pf-mono text-[#f4f1ea]">
                    {h.value}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--pf-espresso-muted)" }}>
                    {h.label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Main Warm-Paper Editorial Reading Column */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-5 py-10 sm:py-12 grid lg:grid-cols-12 gap-8 items-start">
        <article className="lg:col-span-8 pf-card-pure p-6 sm:p-10 space-y-8 text-[0.96rem] leading-[1.8]">
          {children}
        </article>

        {/* Right Companion Trust Navigation */}
        <aside className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
          <div className="pf-card-pure p-5 space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-widest pf-muted">
              Trust Documents
            </div>
            <div className="space-y-2 text-sm">
              <Link
                href="/privacy"
                className="block px-3 py-2 rounded-lg border hover:border-[var(--pf-accent)] transition-colors font-medium"
                style={{ borderColor: "var(--pf-border)", background: "var(--pf-surface)" }}
              >
                Privacy &amp; Zero Retention →
              </Link>
              <Link
                href="/terms"
                className="block px-3 py-2 rounded-lg border hover:border-[var(--pf-accent)] transition-colors font-medium"
                style={{ borderColor: "var(--pf-border)", background: "var(--pf-surface)" }}
              >
                Terms of Service →
              </Link>
              <Link
                href="/refunds"
                className="block px-3 py-2 rounded-lg border hover:border-[var(--pf-accent)] transition-colors font-medium"
                style={{ borderColor: "var(--pf-border)", background: "var(--pf-surface)" }}
              >
                7-Day Refund Policy →
              </Link>
            </div>
          </div>

          <div className="pf-dark-card p-5 space-y-2.5 text-xs">
            <div className="font-bold uppercase tracking-wider text-[#e5a6aa] text-[11px]">
              Questions?
            </div>
            <p className="leading-relaxed" style={{ color: "#d5c7c2" }}>
              Need a quick answer about billing, privacy, or data deletion? Reach our team directly
              and a human will respond within 1 business day.
            </p>
            <a
              href={`mailto:${BRAND.supportEmail}`}
              className="inline-block font-semibold pf-mono text-[#f4f1ea] underline underline-offset-4 pt-1"
            >
              {BRAND.supportEmail}
            </a>
          </div>
        </aside>
      </main>

      <footer className="border-t py-8 px-5 text-xs pf-muted" style={{ borderColor: "var(--pf-border)" }}>
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <span>© {new Date().getFullYear()} {BRAND.name}.</span>
          <div className="flex flex-wrap gap-5">
            <Link href="/terms" className="pf-link">Terms</Link>
            <Link href="/privacy" className="pf-link">Privacy</Link>
            <Link href="/refunds" className="pf-link">Refunds</Link>
            <Link href="/" className="pf-link">← Back to home</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function LegalH2({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-xl font-bold tracking-[-0.02em] pt-2 pb-2 border-b"
      style={{ borderColor: "var(--pf-border)" }}
    >
      {children}
    </h2>
  );
}

export function LegalCallout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl border p-4 sm:p-5 text-sm leading-relaxed"
      style={{
        background: "var(--pf-accent-soft)",
        borderColor: "color-mix(in srgb, var(--pf-accent) 32%, var(--pf-border))",
      }}
    >
      <div className="font-bold text-xs uppercase tracking-wider pf-accent mb-1">{title}</div>
      <div>{children}</div>
    </div>
  );
}
