import type { Metadata } from "next";
import Link from "next/link";
import LegalLayout, { LegalCallout, LegalH2 } from "@/components/LegalLayout";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms of Service"
      updated="November 2026"
      eyebrow="Fair & Clear Terms"
      subtitle={`Clear rules for using ${BRAND.name}'s Natural Writing & Voice Refiner, web studio, and REST API.`}
      highlights={[
        { value: "100% Yours", label: "You own all refined output" },
        { value: "Ethical Use", label: "Built for honest writing" },
        { value: "1-Click", label: "Cancel anytime in Billing" },
      ]}
    >
      <LegalCallout title="Key Ownership & Ethics Summary">
        You keep 100% ownership of your input drafts and refined prose. {BRAND.name} is designed
        for bloggers, researchers, marketers, founders, and multilingual writers polishing their own
        work, never for plagiarism or academic dishonesty.
      </LegalCallout>

      <section className="space-y-3">
        <LegalH2>1. The Service</LegalH2>
        <p className="pf-muted">
          {BRAND.name} provides an online editorial studio and REST API that refines rough drafts
          and Word (<code className="pf-mono">.docx</code>) documents into clearer, more natural
          English while preserving your meaning, numbers, and direct quotes.
        </p>
      </section>

      <section className="space-y-3">
        <LegalH2>2. Acceptable Use &amp; Academic Integrity</LegalH2>
        <p className="pf-muted">
          You agree to use {BRAND.name} responsibly and lawfully. Specifically, you must not use the
          service for:
        </p>
        <ul className="list-disc pl-5 space-y-2 pf-muted">
          <li>
            <strong>Academic dishonesty</strong>, plagiarism, or submitting work that violates your
            school, university, or publisher&apos;s disclosure guidelines.
          </li>
          <li>
            Generating illegal, defamatory, harassing, deceptive, or spam content, or impersonating
            real individuals without authorization.
          </li>
          <li>
            Automated scraping, credential sharing, reverse-engineering inference endpoints, or
            deliberately overloading our API beyond documented plan limits.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <LegalH2>3. Intellectual Property</LegalH2>
        <p className="pf-muted">
          You retain full rights, title, and ownership over every draft you submit and every refined
          document {BRAND.name} returns. Because we operate with strict zero text retention, we do
          not claim any license to store, publish, or train on your writing.
        </p>
      </section>

      <section className="space-y-3">
        <LegalH2>4. Subscriptions, Credits &amp; Cancellations</LegalH2>
        <p className="pf-muted">
          Paid plans renew monthly or annually until cancelled. You can cancel in one click anytime
          from your{" "}
          <Link href="/app/billing" className="pf-link font-semibold">
            Billing page
          </Link>
          . Every new subscription is covered by our straightforward{" "}
          <Link href="/refunds" className="pf-link font-semibold">
            7-Day Refund Policy
          </Link>
          .
        </p>
      </section>

      <section className="space-y-3">
        <LegalH2>5. Editorial Responsibility &amp; Disclaimers</LegalH2>
        <p className="pf-muted">
          While Fidelity Shield automatically checks quotes and numeric figures, you remain
          responsible for reviewing and approving your final text before publishing or submitting it.
          {BRAND.name} is provided &ldquo;as is&rdquo; without warranties of uninterrupted
          availability, and aggregate liability is limited to the fees you paid in the preceding 12
          months.
        </p>
      </section>

      <section className="space-y-3">
        <LegalH2>6. Contact</LegalH2>
        <p className="pf-muted">
          Questions about these terms? Email{" "}
          <a href={`mailto:${BRAND.supportEmail}`} className="pf-link font-semibold">
            {BRAND.supportEmail}
          </a>
          .
        </p>
      </section>
    </LegalLayout>
  );
}
