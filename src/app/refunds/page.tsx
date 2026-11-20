import type { Metadata } from "next";
import Link from "next/link";
import LegalLayout, { LegalCallout, LegalH2 } from "@/components/LegalLayout";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = { title: "Refund Policy" };

export default function RefundsPage() {
  return (
    <LegalLayout
      title="Refund & Cancellation Policy"
      updated="November 2026"
      eyebrow="Risk-Free Guarantee"
      subtitle="Try ProseFlow with complete confidence. Cancel anytime in one click, with a straightforward 7-day refund guarantee."
      highlights={[
        { value: "7-day", label: "Full refund window" },
        { value: "1-click", label: "Cancel anytime in Billing" },
        { value: "No hoops", label: "Fast human support" },
      ]}
    >
      <LegalCallout title="Plain-English Guarantee">
        Not happy with your upgrade? Request a full refund within <strong>7-day</strong> of your
        initial charge or renewal—no forms, retention mazes, or awkward interviews.
      </LegalCallout>

      <section className="space-y-3">
        <LegalH2>1. Cancel Anytime in One Click</LegalH2>
        <p className="pf-muted">
          <strong>Cancel anytime</strong> directly inside your{" "}
          <Link href="/app/billing" className="pf-link font-semibold">
            Studio → Billing
          </Link>{" "}
          dashboard. Cancellation stops all future renewals immediately—you never need to email
          support just to turn off auto-billing.
        </p>
      </section>

      <section className="space-y-3">
        <LegalH2>2. 7-Day Refund Eligibility</LegalH2>
        <p className="pf-muted">
          Every paid subscription (Starter, Pro, and Business &amp; API—both monthly and annual) is
          protected by our <strong>7-day</strong> refund policy. If {BRAND.name} isn&apos;t the
          right fit for your writing workflow, email{" "}
          <a href={`mailto:${BRAND.supportEmail}`} className="pf-link font-semibold">
            {BRAND.supportEmail}
          </a>{" "}
          from your account email within 7 days of payment and we&apos;ll issue a full refund back
          to your original payment method.
        </p>
        <p className="pf-muted">
          To keep pricing fair for honest writers, accounts that consume more than 50% of their
          monthly word quota before requesting a refund may receive a prorated refund instead of a
          full refund.
        </p>
      </section>

      <section className="space-y-3">
        <LegalH2>3. Refund Processing Times</LegalH2>
        <ul className="list-disc pl-5 space-y-2 pf-muted">
          <li>
            <strong>Global USD (Dodo Payments):</strong> Refunds are initiated immediately and
            typically appear on your card or bank statement within 3–7 business days.
          </li>
          <li>
            <strong>India INR (Razorpay — UPI / Cards / NetBanking):</strong> Refunds are initiated
            immediately and typically settle within 3–5 business days.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <LegalH2>4. Need Help?</LegalH2>
        <p className="pf-muted">
          Send your account email and approximate payment date to{" "}
          <a href={`mailto:${BRAND.supportEmail}`} className="pf-link font-semibold">
            {BRAND.supportEmail}
          </a>
          . We answer every refund request within 1 business day.
        </p>
      </section>
    </LegalLayout>
  );
}
