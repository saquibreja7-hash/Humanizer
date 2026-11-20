import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

export interface SummaryHighlight {
  value: string;
  label: string;
}

export default function LegalLayout({
  title,
  updated,
  subtitle,
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
    <div className="min-h-dvh flex flex-col">
      <PublicHeader />

      <main className="flex-1 max-w-5xl w-full mx-auto px-5 py-12 md:py-16 grid lg:grid-cols-12 gap-10 items-start">
        <aside className="hidden lg:block lg:col-span-3 sticky top-24 space-y-3 border-l pl-4 text-sm" style={{ borderColor: "var(--pf-border)" }}>
          <div className="font-semibold text-xs pf-muted mb-2">Trust Center</div>
          <Link href="/privacy" className="block py-1 pf-muted hover:text-[var(--pf-accent)]">
            Privacy Policy
          </Link>
          <Link href="/terms" className="block py-1 pf-muted hover:text-[var(--pf-accent)]">
            Terms of Service
          </Link>
          <Link href="/refunds" className="block py-1 pf-muted hover:text-[var(--pf-accent)]">
            Refund Policy
          </Link>
        </aside>

        <article className="lg:col-span-9 space-y-8 text-[0.96rem] leading-[1.8]">
          <div className="border-b pb-7" style={{ borderColor: "var(--pf-border)" }}>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-[-0.03em]">{title}</h1>
            {subtitle && <p className="pf-muted text-sm sm:text-base mt-2.5">{subtitle}</p>}
            <p className="text-xs pf-mono pf-muted mt-3">Last updated: {updated}</p>
          </div>

          {children}
        </article>
      </main>

      <PublicFooter />
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
        background: "var(--pf-surface)",
        borderColor: "var(--pf-border)",
      }}
    >
      <div className="font-bold text-xs pf-accent mb-1">{title}</div>
      <div>{children}</div>
    </div>
  );
}
