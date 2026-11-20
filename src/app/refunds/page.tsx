import type { Metadata } from "next";
import LegalLayout, { LegalH2 } from "@/components/LegalLayout";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = { title: "Refund Policy" };

export default function RefundsPage() {
  return (
    <LegalLayout title="Refund Policy" updated="November 2026">
      <p>
        We want you to feel great about paying for {BRAND.name}. If the product isn&apos;t right
        for you, our policy is simple and self-serve — no emails, no forms, no hoops.
      </p>

      <LegalH2>7-day money-back guarantee</LegalH2>
      <p>
        If you&apos;re within your first {BRAND.refundWindowDays} days of a paid subscription and
        {BRAND.name} isn&apos;t a fit, reply to your receipt email or write to{" "}
        <a className="pf-link" href={`mailto:${BRAND.supportEmail}`}>
          {BRAND.supportEmail}
        </a>{" "}
        and we&apos;ll refund your most recent subscription payment in full. No questions asked,
        and you keep anything you created.
      </p>

      <LegalH2>Cancel anytime, in one click</LegalH2>
      <p>
        You don&apos;t need a refund to stop paying. Open{" "}
        <a className="pf-link" href="/app/billing">
          Billing
        </a>{" "}
        and press <em>Cancel subscription</em> — your plan downgrades to Free immediately and no
        further charges are made. There are no cancellation fees and no retention scripts.
      </p>

      <LegalH2>Renewal refunds</LegalH2>
      <p>
        Forgot to cancel before a renewal? Contact us within 7 days of the renewal charge and we
        will refund it, provided the credits from that cycle were not substantially used.
      </p>

      <LegalH2>What&apos;s not covered</LegalH2>
      <p>
        We can&apos;t refund more than the most recent payment, and we can&apos;t refund a cycle
        where nearly all included words were used — the word metering in your billing page is the
        shared source of truth. Abusive patterns (repeated purchase-refund cycles) may lead to
        account closure.
      </p>

      <LegalH2>How fast are refunds?</LegalH2>
      <p>
        Refunds are issued through the original payment method (Dodo Payments for global cards,
        Razorpay for Indian payments). They typically appear within 5–10 business days, depending
        on your bank.
      </p>

      <LegalH2>Chargebacks</LegalH2>
      <p>
        Before filing a chargeback, please just tell us — a refund is faster and costs everyone
        less. Accounts with open chargebacks may be paused while the dispute resolves.
      </p>
    </LegalLayout>
  );
}
