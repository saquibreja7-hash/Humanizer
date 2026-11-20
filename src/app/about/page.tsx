import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

export const metadata: Metadata = {
  title: "About",
  description: `Learn how ${BRAND.name} restores natural human cadence to rough drafts while keeping every fact, quote, and figure intact under strict zero text retention.`,
};

const PRINCIPLES = [
  {
    num: "01",
    title: "Base-model cadence over synonym swaps",
    body: "Ordinary rewriters swap words awkwardly or break grammar. Our iterative base-model engine rebuilds sentence flow cleanly.",
  },
  {
    num: "02",
    title: "Fidelity Shield fact checks",
    body: "Every pass verifies direct quotes, dates, percentages, and numbers against your original draft.",
  },
  {
    num: "03",
    title: "Zero text retention",
    body: "Drafts and uploaded .docx files stay strictly in memory and are discarded immediately.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-dvh flex flex-col">
      <PublicHeader />

      <main className="flex-1">
        <section className="max-w-5xl mx-auto px-5 pt-14 md:pt-20 pb-12">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 space-y-5">
              <h1 className="text-4xl sm:text-5xl font-bold tracking-[-0.035em] leading-[1.08]">
                Restoring human cadence to modern writing.
              </h1>
              <p className="pf-muted text-base leading-relaxed">
                Turn stiff drafts into natural prose with every fact preserved.
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                <Link href="/login?mode=signup" className="pf-btn pf-btn-primary text-sm px-5 py-2.5">
                  Start free
                </Link>
                <Link href="/demo" className="pf-btn pf-btn-ghost text-sm px-5 py-2.5">
                  Live demo
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="rounded-xl overflow-hidden border" style={{ borderColor: "var(--pf-border)" }}>
                <Image
                  src="/images/about-banner.jpg"
                  alt="Open cream manuscript notebook, oxblood fountain pen, ceramic cup, and linen-bound books on a study desk"
                  width={1280}
                  height={714}
                  priority
                  className="w-full h-auto block"
                />
              </div>
            </div>
          </div>
        </section>

        <section
          className="border-y py-16"
          style={{ background: "var(--pf-surface)", borderColor: "var(--pf-border)" }}
        >
          <div className="max-w-5xl mx-auto px-5">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-[-0.025em] mb-10">
              Three core principles
            </h2>
            <div
              className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x border-t border-b"
              style={{ borderColor: "var(--pf-border)" }}
            >
              {PRINCIPLES.map((p) => (
                <div key={p.num} className="py-7 md:px-7 first:md:pl-0 last:md:pr-0">
                  <div className="pf-mono text-xs font-bold pf-accent">{p.num}</div>
                  <h3 className="text-lg font-bold mt-2.5">{p.title}</h3>
                  <p className="pf-muted text-sm mt-2 leading-relaxed">{p.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
