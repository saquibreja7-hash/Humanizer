import Link from "next/link";
import { BRAND } from "@/lib/brand";

export default function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <main className="max-w-3xl mx-auto px-5 py-12">
      <div className="text-sm mb-8">
        <Link href="/" className="font-bold text-lg">
          {BRAND.name}
        </Link>
        <span className="pf-muted"> / {title}</span>
      </div>
      <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
      <p className="pf-muted text-sm mt-2">Last updated: {updated}</p>
      <article className="mt-10 space-y-8 text-[0.95rem] leading-relaxed">{children}</article>
      <div className="mt-14 flex gap-6 text-sm border-t pt-6" style={{ borderColor: "var(--pf-border)" }}>
        <Link href="/terms" className="pf-link">
          Terms
        </Link>
        <Link href="/privacy" className="pf-link">
          Privacy
        </Link>
        <Link href="/refunds" className="pf-link">
          Refunds
        </Link>
        <Link href="/" className="pf-link">
          ← Back to home
        </Link>
      </div>
    </main>
  );
}

export function LegalH2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-bold mt-2">{children}</h2>;
}
