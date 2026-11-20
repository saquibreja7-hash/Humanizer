import type { Metadata } from "next";
import LegalLayout, { LegalH2 } from "@/components/LegalLayout";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" updated="November 2026">
      <p>
        These Terms of Service (&quot;Terms&quot;) govern your use of {BRAND.name}, a writing and
        editing tool operated at {BRAND.domain} (&quot;we&quot;, &quot;us&quot;, &quot;
        {BRAND.name}&quot;). By creating an account or using the service, you agree to these Terms.
      </p>

      <LegalH2>1. What {BRAND.name} is</LegalH2>
      <p>
        {BRAND.name} is a writing and editing tool. It refines drafts you supply — improving flow,
        rhythm, and word choice — so the final text reads naturally in your own voice. You are the
        author of your work and retain all rights to it. We claim no ownership of anything you write
        or upload.
      </p>

      <LegalH2>2. Acceptable use</LegalH2>
      <p>
        You agree to use {BRAND.name} only for lawful purposes and only on text you have the right to
        edit. You must not:
      </p>
      <ul className="list-disc pl-6 space-y-2">
        <li>
          Use the service to engage in academic dishonesty, including submitting edited work as your
          own where institutional rules prohibit it.
        </li>
        <li>
          Violate the policies of any school, university, publisher, or platform to which you
          submit text processed by {BRAND.name}.
        </li>
        <li>
          Process content that is unlawful, defamatory, harassing, or infringes the rights of
          others.
        </li>
        <li>
          Resell, scrape, or provide automated bulk access to the service outside of the API limits
          of your plan.
        </li>
        <li>
          Attempt to disrupt, overload, or probe the service or its infrastructure.
        </li>
      </ul>
      <p>
        You are solely responsible for the content you submit and for how you use the output.
        {BRAND.name} provides editing assistance; it does not publish, endorse, or verify the
        factual accuracy of your writing.
      </p>

      <LegalH2>3. Your account</LegalH2>
      <p>
        You need an account to use the editor. Keep your credentials confidential and notify us at{" "}
        {BRAND.supportEmail} if you suspect unauthorized access. You may close your account at any
        time from the billing page.
      </p>

      <LegalH2>4. Plans, credits, and billing</LegalH2>
      <p>
        Each plan includes a monthly allowance of words (&quot;credits&quot;). Credits reset with
        your billing cycle and have no cash value. Monthly and annual subscriptions renew
        automatically until cancelled. You can cancel in one click at any time from the billing
        page; cancellation stops future charges and downgrades you to the Free plan. Refunds are
        handled under our{" "}
        <a className="pf-link" href="/refunds">
          Refund Policy
        </a>
        .
      </p>

      <LegalH2>5. API keys</LegalH2>
      <p>
        Developer plans may create API keys (&quot;pf_sk_...&quot;). Keys are shown once at creation
        — store them securely. You are responsible for all usage of your keys, and you may revoke
        them at any time.
      </p>

      <LegalH2>6. No warranties</LegalH2>
      <p>
        The service is provided &quot;as is&quot; and &quot;as available&quot;. Writing quality is
        subjective; we make no guarantee of any specific outcome, score, grade, or evaluation
        result for text processed by {BRAND.name}. We do not warrant uninterrupted or error-free
        service, although we work hard to keep it that way.
      </p>

      <LegalH2>7. Limitation of liability</LegalH2>
      <p>
        To the maximum extent permitted by law, {BRAND.name} is not liable for indirect,
        incidental, special, or consequential damages, or for lost profits or data. Our total
        liability for any claim is limited to the amount you paid us in the twelve months before
        the claim arose.
      </p>

      <LegalH2>8. Changes to the service and these Terms</LegalH2>
      <p>
        We may modify or discontinue features with reasonable notice, and update these Terms from
        time to time. Continued use after an update means you accept the revised Terms. Material
        changes will be announced in-app or by email.
      </p>

      <LegalH2>9. Termination</LegalH2>
      <p>
        You may stop using the service at any time. We may suspend or terminate accounts that
        violate these Terms, with notice where practical.
      </p>

      <LegalH2>10. Contact</LegalH2>
      <p>
        Questions about these Terms:{" "}
        <a className="pf-link" href={`mailto:${BRAND.supportEmail}`}>
          {BRAND.supportEmail}
        </a>
        .
      </p>
    </LegalLayout>
  );
}
