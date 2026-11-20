import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { DocsCodeTabs, DocsResponseTabs } from "@/components/DocsCodeTabs";

export const metadata: Metadata = {
  title: "Developer API",
  description: `Integrate ${BRAND.name}'s natural prose refinement engine into editorial CMSs, publishing pipelines, and writing apps via a clean REST API with zero text retention.`,
};

function BrandAsterisk({ size = 12 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <line x1="12" y1="3" x2="12" y2="21" />
      <line x1="4.2" y1="7.5" x2="19.8" y2="16.5" />
      <line x1="19.8" y1="7.5" x2="4.2" y2="16.5" />
    </svg>
  );
}

const CURL = `curl -X POST https://${BRAND.domain}/api/v1/rewrite \\
  -H "Authorization: Bearer pf_sk_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "In today'\''s rapidly evolving digital landscape, it is of paramount importance to leverage clear methodologies.",
    "mode": "standard",
    "creativity": "natural"
  }'`;

const PY = `import requests

resp = requests.post(
    "https://${BRAND.domain}/api/v1/rewrite",
    headers={"Authorization": "Bearer pf_sk_YOUR_KEY"},
    json={
        "text": "Your rough draft text goes here.",
        "mode": "standard",      # fast (3 passes) | standard (5) | deep (7)
        "creativity": "natural", # natural (1.0) | balanced (0.9)
    },
    timeout=120,
)
resp.raise_for_status()
data = resp.json()
print(data["text"])          # refined human-sounding prose
print(data["fidelity"])      # quotes kept, numbers kept, % phrases rebuilt`;

const JS = `const res = await fetch("https://${BRAND.domain}/api/v1/rewrite", {
  method: "POST",
  headers: {
    Authorization: "Bearer pf_sk_YOUR_KEY",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    text: "Your rough draft text goes here.",
    mode: "standard",
    creativity: "natural",
  }),
});

if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
const data = await res.json();
console.log(data.text, data.fidelity);`;

const TOC = [
  { id: "overview", label: "Overview" },
  { id: "auth", label: "Authentication" },
  { id: "endpoint", label: "POST /api/v1/rewrite" },
  { id: "parameters", label: "Request Parameters" },
  { id: "response", label: "Response & Fidelity Shield" },
  { id: "errors", label: "Error Codes & Limits" },
  { id: "privacy", label: "Zero-Retention Security" },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Architectural Sticky Header */}
      <header
        className="sticky top-0 z-40 pf-glass border-b"
        style={{ borderColor: "color-mix(in srgb, var(--pf-border) 82%, transparent)" }}
      >
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="inline-flex items-center rounded-md overflow-hidden border shadow-2xs"
              style={{ borderColor: "var(--pf-border)", background: "var(--pf-surface-2)" }}
            >
              <span className="inline-flex items-center gap-2 px-3 py-1.5 font-bold text-sm tracking-tight">
                <span
                  className="inline-flex items-center justify-center w-5 h-5 rounded"
                  style={{ background: "var(--pf-espresso)", color: "#f4f1ea" }}
                >
                  <BrandAsterisk size={12} />
                </span>
                <span>{BRAND.name.toLowerCase()}.</span>
              </span>
              <span
                className="px-2.5 py-2 text-[11px] font-mono hidden sm:inline-flex items-center"
                style={{ background: "var(--pf-espresso)", color: "#f4f1ea" }}
                aria-hidden="true"
              >
                =
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-sm font-medium pf-muted">
              <Link href="/" className="hover:text-[var(--pf-text)] transition-colors">
                Home
              </Link>
              <Link href="/#pricing" className="hover:text-[var(--pf-text)] transition-colors">
                Pricing
              </Link>
              <Link href="/docs" className="text-[var(--pf-text)] font-semibold">
                API Docs
              </Link>
              <Link href="/privacy" className="hover:text-[var(--pf-text)] transition-colors">
                Privacy
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/app/api-keys" className="pf-btn pf-btn-primary text-xs sm:text-sm px-4 py-2">
              Manage API Keys
            </Link>
            <Link href="/app" className="pf-btn pf-btn-ghost text-xs sm:text-sm px-4 py-2 hidden sm:inline-flex">
              Open Studio
            </Link>
          </div>
        </div>
      </header>

      {/* Deep Espresso Editorial Hero Banner with Nano Banana Desk Visual */}
      <section className="relative pf-espresso-band overflow-hidden border-b" style={{ borderColor: "var(--pf-espresso-border)" }}>
        <Image
          src="/images/docs-banner.jpg"
          alt="Minimalist matte mechanical keyboard, open cream grid notebook, and burgundy fountain pen on a dark walnut desk"
          fill
          priority
          sizes="100vw"
          className="object-cover object-right opacity-50"
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(95deg, rgba(36,16,14,0.97) 0%, rgba(36,16,14,0.88) 52%, rgba(36,16,14,0.42) 100%)",
          }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-5 py-14 sm:py-20">
          <div className="max-w-2xl">
            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#e5a6aa] mb-4">
              REST API v1 Reference
            </div>

            <h1 className="text-3xl sm:text-5xl font-bold tracking-[-0.035em] leading-[1.08] text-[#f4f1ea]">
              Natural prose refinement over a single POST.
            </h1>

            <p className="mt-4 text-sm sm:text-base leading-relaxed" style={{ color: "#d5c7c2" }}>
              Embed {BRAND.name}&apos;s iterative base-model engine directly inside your CMS,
              publishing pipeline, or internal editorial tools—complete with real-time Fidelity
              Shield metrics and zero text retention.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/app/api-keys" className="pf-btn pf-btn-primary text-xs sm:text-sm px-5 py-2.5">
                Get your pf_sk_ key →
              </Link>
              <a
                href="#endpoint"
                className="pf-btn text-xs sm:text-sm px-4 py-2.5 border text-[#f4f1ea] hover:bg-white/10"
                style={{ borderColor: "var(--pf-espresso-border)", background: "rgba(255,255,255,0.05)" }}
              >
                Jump to examples ↓
              </a>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-4 pt-6 border-t max-w-lg" style={{ borderColor: "rgba(255,255,255,0.14)" }}>
              {[
                { val: "JSON REST", label: "Standard HTTPS" },
                { val: "8,000w", label: "Max per request" },
                { val: "0 bytes", label: "Draft text logged" },
              ].map((m) => (
                <div key={m.label}>
                  <div className="text-sm sm:text-base font-bold pf-mono text-[#f4f1ea]">{m.val}</div>
                  <div className="text-[11px]" style={{ color: "var(--pf-espresso-muted)" }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main 2-Column Reference Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-5 py-12 grid lg:grid-cols-12 gap-8 items-start">
        {/* Sticky Left Sidebar */}
        <aside className="hidden lg:block lg:col-span-3 sticky top-24">
          <div className="pf-card-pure p-5 space-y-4">
            <div className="text-[11px] font-bold uppercase tracking-widest pf-muted">
              On This Page
            </div>
            <nav className="space-y-1.5 text-sm">
              {TOC.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="block py-1 pf-muted hover:text-[var(--pf-accent)] transition-colors font-medium"
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="pt-4 border-t text-xs pf-muted space-y-2" style={{ borderColor: "var(--pf-border)" }}>
              <div>Included on the <strong>Business &amp; API</strong> plan (250,000 words/mo).</div>
              <Link href="/app/billing" className="pf-link font-semibold inline-block">
                View API pricing →
              </Link>
            </div>
          </div>
        </aside>

        {/* Right Detailed Reference Column */}
        <div className="lg:col-span-9 space-y-10">
          {/* 1. Overview */}
          <section id="overview" className="scroll-mt-24 pf-card-pure p-6 sm:p-8 space-y-4">
            <h2 className="text-2xl font-bold tracking-[-0.02em]">Overview</h2>
            <p className="pf-muted text-sm sm:text-[15px] leading-relaxed">
              The {BRAND.name} REST API exposes the exact same multi-pass editorial engine that
              powers our Studio editor. Paragraphs are automatically split, headings and short
              section titles are preserved untouched, and body blocks are refined in parallel on
              serverless GPUs.
            </p>
            <div
              className="rounded-xl border p-4 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm"
              style={{ borderColor: "var(--pf-border)", background: "var(--pf-surface)" }}
            >
              <div>
                <span className="pf-muted mr-2 font-semibold">Base URL:</span>
                <code className="pf-mono font-bold">https://{BRAND.domain}/api/v1</code>
              </div>
              <span
                className="px-2.5 py-1 rounded text-[11px] font-bold pf-mono"
                style={{ background: "var(--pf-accent-soft)", color: "var(--pf-accent)" }}
              >
                Content-Type: application/json
              </span>
            </div>
          </section>

          {/* 2. Authentication */}
          <section id="auth" className="scroll-mt-24 pf-card-pure p-6 sm:p-8 space-y-4">
            <h2 className="text-2xl font-bold tracking-[-0.02em]">Authentication</h2>
            <p className="pf-muted text-sm sm:text-[15px] leading-relaxed">
              Authenticate every request with an API key prefixed with{" "}
              <code className="pf-mono px-1.5 py-0.5 rounded bg-black/5">pf_sk_</code> sent in the{" "}
              <code className="pf-mono px-1.5 py-0.5 rounded bg-black/5">Authorization</code> header.
              Create and revoke keys anytime in{" "}
              <Link href="/app/api-keys" className="pf-link font-semibold">
                Studio → API Keys
              </Link>
              .
            </p>
            <div
              className="rounded-xl p-4 pf-mono text-xs sm:text-sm overflow-x-auto"
              style={{ background: "var(--pf-espresso)", color: "#f4f1ea" }}
            >
              Authorization: Bearer pf_sk_live_xxxxxxxxxxxxxxxxxxxxxxxx
            </div>
            <p className="text-xs pf-muted leading-relaxed">
              Keep keys strictly server-side (environment variables or secret managers). Never embed
              a <code className="pf-mono">pf_sk_</code> credential in browser JavaScript or public
              repositories.
            </p>
          </section>

          {/* 3. Endpoint + Interactive Code Tabs */}
          <section id="endpoint" className="scroll-mt-24 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className="px-2.5 py-1 rounded text-xs font-bold pf-mono text-white"
                style={{ background: "var(--pf-accent)" }}
              >
                POST
              </span>
              <h2 className="text-2xl font-bold tracking-[-0.02em] pf-mono">/api/v1/rewrite</h2>
            </div>
            <p className="pf-muted text-sm sm:text-[15px] leading-relaxed">
              Refines plain text or multi-paragraph drafts and returns the polished prose alongside
              Fidelity Shield verification telemetry and remaining word credits.
            </p>
            <DocsCodeTabs curl={CURL} python={PY} js={JS} />
          </section>

          {/* 4. Parameters Table */}
          <section id="parameters" className="scroll-mt-24 pf-card-pure overflow-hidden">
            <div
              className="px-6 py-4 border-b"
              style={{ borderColor: "var(--pf-border)", background: "var(--pf-surface)" }}
            >
              <h2 className="text-xl font-bold tracking-[-0.02em]">Request Parameters</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr
                    className="border-b text-[11px] uppercase tracking-wider pf-muted"
                    style={{ borderColor: "var(--pf-border)" }}
                  >
                    <th className="py-3 px-6 font-semibold">Field</th>
                    <th className="py-3 px-4 font-semibold">Type</th>
                    <th className="py-3 px-4 font-semibold">Default</th>
                    <th className="py-3 px-6 font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--pf-border)" }}>
                  <tr>
                    <td className="py-4 px-6 pf-mono font-bold">
                      text{" "}
                      <span className="text-[10px] uppercase pf-accent ml-1">required</span>
                    </td>
                    <td className="py-4 px-4 pf-mono pf-muted">string</td>
                    <td className="py-4 px-4 pf-mono pf-muted">—</td>
                    <td className="py-4 px-6 pf-muted leading-relaxed">
                      Input text to refine. Separate paragraphs with blank lines (
                      <code className="pf-mono">\n\n</code>). Up to 8,000 words per call on Business
                      &amp; API.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 pf-mono font-bold">mode</td>
                    <td className="py-4 px-4 pf-mono pf-muted">string</td>
                    <td className="py-4 px-4 pf-mono">&quot;standard&quot;</td>
                    <td className="py-4 px-6 pf-muted leading-relaxed">
                      <code className="pf-mono">fast</code> (3 passes),{" "}
                      <code className="pf-mono">standard</code> (5 passes, recommended), or{" "}
                      <code className="pf-mono">deep</code> (7 passes for dense drafts).
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 pf-mono font-bold">creativity</td>
                    <td className="py-4 px-4 pf-mono pf-muted">string</td>
                    <td className="py-4 px-4 pf-mono">&quot;natural&quot;</td>
                    <td className="py-4 px-6 pf-muted leading-relaxed">
                      <code className="pf-mono">natural</code> (temperature 1.0, recommended for
                      varied cadence) or <code className="pf-mono">balanced</code> (temperature 0.90,
                      closer to source structure).
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 5. Response Schema & Fidelity Shield */}
          <section id="response" className="scroll-mt-24 space-y-4">
            <h2 className="text-2xl font-bold tracking-[-0.02em]">Response &amp; Fidelity Shield</h2>
            <p className="pf-muted text-sm sm:text-[15px] leading-relaxed">
              Every successful response includes a <code className="pf-mono">fidelity</code> object
              comparing your input against the refined output—reporting exact direct quotes kept,
              numbers/dates preserved, phrasing rebuilt percentage, and any drift warnings.
            </p>
            <DocsResponseTabs />
          </section>

          {/* 6. Error Codes */}
          <section id="errors" className="scroll-mt-24 pf-card-pure overflow-hidden">
            <div
              className="px-6 py-4 border-b"
              style={{ borderColor: "var(--pf-border)", background: "var(--pf-surface)" }}
            >
              <h2 className="text-xl font-bold tracking-[-0.02em]">HTTP Status &amp; Error Codes</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr
                    className="border-b text-[11px] uppercase tracking-wider pf-muted"
                    style={{ borderColor: "var(--pf-border)" }}
                  >
                    <th className="py-3 px-6 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Meaning</th>
                    <th className="py-3 px-6 font-semibold">Recommended Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--pf-border)" }}>
                  {[
                    {
                      code: "400 Bad Request",
                      meaning: "Empty text, invalid mode/creativity, or exceeds per-request word cap.",
                      fix: "Check JSON body fields and split drafts longer than 8,000 words.",
                    },
                    {
                      code: "401 Unauthorized",
                      meaning: "Missing, malformed, or revoked Bearer API key.",
                      fix: "Verify your Authorization header or mint a fresh key in Studio → API Keys.",
                    },
                    {
                      code: "402 Payment Required",
                      meaning: "Account word balance is lower than the input word count.",
                      fix: "Top up or upgrade your subscription in Studio → Billing.",
                    },
                    {
                      code: "403 Forbidden",
                      meaning: "Account is not on the Business & API tier.",
                      fix: "Switch to Business & API in Billing to enable REST API access.",
                    },
                    {
                      code: "429 Too Many Requests",
                      meaning: "Temporary per-key burst limit exceeded.",
                      fix: "Back off exponentially (1s, 2s, 4s) and retry.",
                    },
                    {
                      code: "502 / 503 Upstream",
                      meaning: "Transient GPU inference timeout.",
                      fix: "Safe to retry — failed calls never deduct word credits.",
                    },
                  ].map((row) => (
                    <tr key={row.code}>
                      <td className="py-3.5 px-6 pf-mono font-bold whitespace-nowrap">{row.code}</td>
                      <td className="py-3.5 px-4 pf-muted">{row.meaning}</td>
                      <td className="py-3.5 px-6 pf-muted">{row.fix}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 7. Zero Retention */}
          <section id="privacy" className="scroll-mt-24 pf-dark-card p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-[#e5a6aa]">
                ✳ Zero Text Retention Architecture
              </div>
              <h2 className="text-xl font-bold text-[#f4f1ea] mt-1">
                Built for confidential editorial workflows
              </h2>
              <p className="text-xs sm:text-sm mt-2 leading-relaxed" style={{ color: "#d5c7c2" }}>
                API request bodies and refined outputs exist strictly in volatile memory during your
                HTTP request. Our database records only the word count charged, timestamp, and API
                key ID—never your text.
              </p>
            </div>
            <Link href="/privacy" className="pf-btn pf-btn-primary text-xs px-5 py-2.5 shrink-0">
              Read Privacy Policy →
            </Link>
          </section>
        </div>
      </main>

      {/* Matching Footer */}
      <footer className="border-t py-8 px-5 text-xs pf-muted" style={{ borderColor: "var(--pf-border)" }}>
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <span>© {new Date().getFullYear()} {BRAND.name}. Natural writing &amp; voice refinement.</span>
          <div className="flex flex-wrap gap-5">
            <Link href="/" className="hover:text-[var(--pf-text)]">Home</Link>
            <Link href="/privacy" className="hover:text-[var(--pf-text)]">Privacy</Link>
            <Link href="/terms" className="hover:text-[var(--pf-text)]">Terms</Link>
            <Link href="/refunds" className="hover:text-[var(--pf-text)]">7-Day Refunds</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
