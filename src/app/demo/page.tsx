import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import BeforeAfter from "@/components/BeforeAfter";

export const metadata: Metadata = {
  title: "Live Demo",
  description: `Inspect real before-and-after prose transformations, Option A/B comparisons, and sentence rhythm analysis in ${BRAND.name}.`,
};

export default function DemoPage() {
  return (
    <div className="min-h-dvh flex flex-col">
      <PublicHeader />

      <main className="flex-1">
        <section className="max-w-5xl mx-auto px-5 pt-14 md:pt-20 pb-10 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-[-0.035em]">
            Compare original vs. refined prose.
          </h1>
          <p className="pf-muted mt-3 text-base max-w-lg mx-auto">
            Switch genres, compare Option A and B, or inspect sentence rhythm.
          </p>
        </section>

        <section className="max-w-5xl mx-auto px-5 pb-16">
          <BeforeAfter />
        </section>

        <section
          className="border-t py-16"
          style={{ background: "var(--pf-surface)", borderColor: "var(--pf-border)" }}
        >
          <div className="max-w-4xl mx-auto px-5 grid sm:grid-cols-2 gap-6">
            <div className="pf-card-pure p-6">
              <div className="text-xs font-semibold pf-accent mb-2.5">What changes</div>
              <ul className="space-y-2 text-sm pf-muted">
                <li>• Repetitive sentence starters and clichés</li>
                <li>• Uniform, monotonous sentence lengths</li>
                <li>• Stiff transitions and robotic phrasing</li>
              </ul>
            </div>
            <div className="pf-card-pure p-6">
              <div className="text-xs font-semibold mb-2.5" style={{ color: "var(--pf-good)" }}>
                What stays locked
              </div>
              <ul className="space-y-2 text-sm pf-muted">
                <li>• Exact numbers, percentages, and currency</li>
                <li>• Years, dates, and direct quotations</li>
                <li>• Document headings and paragraph structure</li>
              </ul>
            </div>
          </div>

          <div className="mt-10 text-center">
            <Link href="/login?mode=signup" className="pf-btn pf-btn-primary text-sm px-6 py-3">
              Test your own draft free
            </Link>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
