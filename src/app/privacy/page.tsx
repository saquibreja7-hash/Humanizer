import type { Metadata } from "next";
import LegalLayout, { LegalCallout, LegalH2 } from "@/components/LegalLayout";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      updated="November 2026"
      eyebrow="Zero Text Retention"
      subtitle={`Plain-English privacy terms for ${BRAND.name}. Your writing stays yours, never logged or stored.`}
      highlights={[
        { value: "0 bytes", label: "Draft text stored in DB" },
        { value: "RAM only", label: "Discarded after response" },
        { value: "No training", label: "Never trains future models" },
      ]}
    >
      <LegalCallout title="Our Core Promise">
        We <strong>never store your text</strong>. Every draft, paragraph, and uploaded Word
        document is processed exclusively in volatile server memory during your request and
        discarded the instant your response finishes.
      </LegalCallout>

      <section className="space-y-3">
        <LegalH2>1. Zero Text Retention</LegalH2>
        <p className="pf-muted">
          When you refine text in the {BRAND.name} Studio or call{" "}
          <code className="pf-mono">POST /api/v1/rewrite</code>, your input and refined output live
          solely in temporary RAM for the lifetime of that request. We do not write draft content to
          databases, analytics tools, error trackers, or disk backups.
        </p>
        <p className="pf-muted">
          Uploaded <code className="pf-mono">.docx</code> files are parsed in memory to extract
          headings and paragraphs and discarded immediately. No uploaded document is ever archived on
          our servers.
        </p>
      </section>

      <section className="space-y-3">
        <LegalH2>2. What We Store vs. What We Never Store</LegalH2>
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--pf-border)" }}>
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr
                className="border-b text-xs pf-muted"
                style={{ borderColor: "var(--pf-border)", background: "var(--pf-surface)" }}
              >
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold">Stored?</th>
                <th className="py-3 px-4 font-semibold">Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--pf-border)" }}>
              <tr>
                <td className="py-3 px-4 font-semibold">Your drafts &amp; refined output</td>
                <td className="py-3 px-4 pf-mono font-bold" style={{ color: "var(--pf-good)" }}>Never</td>
                <td className="py-3 px-4 pf-muted">Processed in memory only; never saved or trained on.</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold">Account email &amp; password hash</td>
                <td className="py-3 px-4 pf-mono">Yes</td>
                <td className="py-3 px-4 pf-muted">Sign-in authentication (salted scrypt hash only).</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold">Anonymous word count ledger</td>
                <td className="py-3 px-4 pf-mono">Yes</td>
                <td className="py-3 px-4 pf-muted">Accurate monthly credit balance &amp; billing receipts.</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold">API key prefix &amp; SHA-256 hash</td>
                <td className="py-3 px-4 pf-mono">Yes</td>
                <td className="py-3 px-4 pf-muted">Authenticating and revoking developer API keys.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <LegalH2>3. Payments &amp; Third-Party Processors</LegalH2>
        <p className="pf-muted">
          We never see or store your card numbers or UPI credentials. Global USD payments are
          processed by <strong>Dodo Payments</strong> (Merchant of Record, handling global VAT/GST),
          and India INR payments are processed by <strong>Razorpay</strong>. We only store your
          active plan tier and subscription status reference.
        </p>
      </section>

      <section className="space-y-3">
        <LegalH2>4. Cookies &amp; Session Security</LegalH2>
        <p className="pf-muted">
          {BRAND.name} uses a single <code className="pf-mono">HttpOnly</code>,{" "}
          <code className="pf-mono">SameSite=Lax</code> session cookie strictly to keep you signed
          in. We do not load third-party ad trackers or cross-site behavioral pixels inside the
          Writing Studio.
        </p>
      </section>

      <section className="space-y-3">
        <LegalH2>5. Account Deletion &amp; Contact</LegalH2>
        <p className="pf-muted">
          You may request complete deletion of your account email, session records, and credit
          ledger at any time by emailing{" "}
          <a href={`mailto:${BRAND.supportEmail}`} className="pf-link font-semibold">
            {BRAND.supportEmail}
          </a>
          . We complete deletion requests within 7 days.
        </p>
      </section>
    </LegalLayout>
  );
}
