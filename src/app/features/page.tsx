import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

export const metadata: Metadata = {
  title: "Features",
  description: `Explore ${BRAND.name}'s multi-pass base-model engine, Fidelity Shield fact checking, .docx support, Option A/B versions, and zero-retention REST API.`,
};

const MATRIX = [
  { feature: "Iterative base-model engine", free: "Fast & Standard", starter: "Fast & Standard", pro: "Fast, Standard & Deep", business: "Fast, Standard & Deep" },
  { feature: "Monthly word credits", free: "500", starter: "20,000", pro: "75,000", business: "250,000" },
  { feature: "Max words per request", free: "250", starter: "2,000", pro: "4,000", business: "8,000" },
  { feature: "Word (.docx) upload & export", free: "—", starter: "Included", pro: "Included", business: "Included" },
  { feature: "Fidelity Shield verification", free: "Included", starter: "Included", pro: "Included", business: "Included" },
  { feature: "Option A / B dual versions", free: "—", starter: "—", pro: "Included", business: "Included" },
  { feature: "Per-paragraph regenerate", free: "—", starter: "—", pro: "Included", business: "Included" },
  { feature: "REST API (pf_sk_ keys)", free: "—", starter: "—", pro: "—", business: "Included" },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-dvh flex flex-col">
      <PublicHeader />

      <main className="flex-1">
        <section className="max-w-5xl mx-auto px-5 pt-14 md:pt-20 pb-12">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-[-0.035em] max-w-2xl">
            Precision tools for natural, accurate prose.
          </h1>
          <p className="pf-muted mt-4 text-base max-w-xl">
            Keep facts intact, preserve .docx formatting, and keep drafts private.
          </p>
        </section>

        {/* Clean 2-Column Alternating Highlights */}
        <section className="max-w-5xl mx-auto px-5 pb-16 space-y-12">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="pf-card p-6 space-y-2">
              <h2 className="text-lg font-bold">Fast, Standard &amp; Deep modes</h2>
              <p className="pf-muted text-sm leading-relaxed">
                Run 3, 5, or 7 parallel refinement passes with Natural (1.0) or Balanced (0.90)
                cadence.
              </p>
            </div>
            <div className="pf-card p-6 space-y-2">
              <h2 className="text-lg font-bold">Fidelity Shield verification</h2>
              <p className="pf-muted text-sm leading-relaxed">
                Every quote, year, and figure is verified automatically against your source draft.
              </p>
            </div>
            <div className="pf-card p-6 space-y-2">
              <h2 className="text-lg font-bold">Word (.docx) upload &amp; export</h2>
              <p className="pf-muted text-sm leading-relaxed">
                Headings stay untouched while body paragraphs stream in parallel and export cleanly
                back to Word.
              </p>
            </div>
            <div className="pf-card p-6 space-y-2">
              <h2 className="text-lg font-bold">Zero text retention &amp; REST API</h2>
              <p className="pf-muted text-sm leading-relaxed">
                Drafts stay in memory only. Integrate directly via{" "}
                <code className="pf-mono text-xs">POST /api/v1/rewrite</code>.
              </p>
            </div>
          </div>
        </section>

        {/* Comparison Matrix */}
        <section
          className="border-t py-16"
          style={{ background: "var(--pf-surface)", borderColor: "var(--pf-border)" }}
        >
          <div className="max-w-5xl mx-auto px-5">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-[-0.025em] mb-6">
              Compare capabilities by plan
            </h2>

            <div className="pf-card-pure overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr
                      className="border-b pf-muted"
                      style={{ borderColor: "var(--pf-border)", background: "var(--pf-surface)" }}
                    >
                      <th className="py-3.5 px-5 font-semibold">Capability</th>
                      <th className="py-3.5 px-4 font-semibold">Free</th>
                      <th className="py-3.5 px-4 font-semibold">Starter</th>
                      <th className="py-3.5 px-4 font-semibold pf-accent">Pro</th>
                      <th className="py-3.5 px-5 font-semibold">Business &amp; API</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: "var(--pf-border)" }}>
                    {MATRIX.map((row) => (
                      <tr key={row.feature}>
                        <td className="py-3.5 px-5 font-semibold">{row.feature}</td>
                        <td className="py-3.5 px-4 pf-muted">{row.free}</td>
                        <td className="py-3.5 px-4 pf-muted">{row.starter}</td>
                        <td className="py-3.5 px-4 font-semibold">{row.pro}</td>
                        <td className="py-3.5 px-5 pf-muted">{row.business}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/pricing" className="pf-btn pf-btn-primary text-sm px-6 py-3">
                View pricing
              </Link>
              <Link href="/docs" className="pf-btn pf-btn-ghost text-sm px-6 py-3">
                Read API docs
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
