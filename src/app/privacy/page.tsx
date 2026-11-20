import type { Metadata } from "next";
import LegalLayout, { LegalH2 } from "@/components/LegalLayout";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" updated="November 2026">
      <p>
        {BRAND.name} is built on a strict <strong>zero-text-retention</strong> principle: your
        writing is processed in memory and never stored. This page explains exactly what we
        collect, what we never collect, and the choices you have.
      </p>

      <LegalH2>The short version</LegalH2>
      <ul className="list-disc pl-6 space-y-2">
        <li>
          <strong>We never store your text.</strong> Neither your input drafts nor the refined
          output are written to our database or logs.
        </li>
        <li>
          <strong>We never train on your writing.</strong> Your documents are not used to train
          any model, ours or anyone else&apos;s.
        </li>
        <li>
          <strong>We keep the bare minimum</strong> needed to run your account: email, password
          hash, plan, word counts, timestamps, and fidelity metrics.
        </li>
        <li>
          <strong>You can delete everything at any time</strong> — just email us.
        </li>
      </ul>

      <LegalH2>What we collect and why</LegalH2>
      <p>
        <strong>Account data.</strong> Email address and a salted hash of your password. Used for
        login and receipts. Passwords are never stored in plain text.
      </p>
      <p>
        <strong>Usage metrics (anonymous).</strong> For each rewrite we store only: word count,
        mode used, number of rounds, elapsed time, and the fidelity metrics (percentage of phrases
        rebuilt, counts of quotes and numbers preserved). There is no text column anywhere in our
        database — this is enforced at the schema level and verified in our automated tests.
      </p>
      <p>
        <strong>Billing records.</strong> Plan, purchase history, and payment provider event
        identifiers — handled by our payment processors (see below), who may collect what their
        policies require to process your payment.
      </p>
      <p>
        <strong>API keys.</strong> If you use the developer API, we store only a cryptographic
        hash of each key. The full key is shown exactly once at creation and cannot be recovered.
      </p>

      <LegalH2>What we never collect</LegalH2>
      <p>
        We do not store, log, or retain: your input text, your refined output text, your uploaded
        documents, or the contents of any file you run through the .docx pipeline. Documents are
        parsed in memory, streamed to the model, and discarded. We do not use cookies for
        advertising or third-party tracking.
      </p>

      <LegalH2>Processing by our model provider</LegalH2>
      <p>
        To refine your text, it must be sent to the language-model service we run our engine on.
        The text transits encrypted (TLS) to that service and is used solely to generate your
        result; it is not stored by us afterward, and we do not send any identifying information
        along with it.
      </p>

      <LegalH2>Data retention and deletion</LegalH2>
      <p>
        Account and billing records are kept while your account is active. Sessions expire after
        30 days. You may request full deletion of your account and all associated records at any
        time by emailing{" "}
        <a className="pf-link" href={`mailto:${BRAND.supportEmail}`}>
          {BRAND.supportEmail}
        </a>
        ; we action verified requests within 30 days.
      </p>

      <LegalH2>Security</LegalH2>
      <p>
        Traffic is encrypted in transit. Passwords are hashed with scrypt and unique salts. Session
        cookies are signed, HTTP-only, and SameSite-protected. API keys are stored only as SHA-256
        hashes.
      </p>

      <LegalH2>Children&apos;s privacy</LegalH2>
      <p>
        {BRAND.name} is not directed at children under 13 (or 16 in the EEA), and we do not
        knowingly collect their personal data.
      </p>

      <LegalH2>Your rights</LegalH2>
      <p>
        Depending on your jurisdiction (GDPR, CCPA, India&apos;s DPDP Act, and others), you may
        have rights to access, correct, export, or delete your personal data. Because we store so
        little, most requests resolve to account deletion. Contact{" "}
        <a className="pf-link" href={`mailto:${BRAND.supportEmail}`}>
          {BRAND.supportEmail}
        </a>{" "}
        and we will help.
      </p>

      <LegalH2>Changes to this policy</LegalH2>
      <p>
        We will post any changes on this page with an updated date. Material changes will also be
        announced in-app.
      </p>
    </LegalLayout>
  );
}
