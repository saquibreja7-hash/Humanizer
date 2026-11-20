import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import { DocsCodeTabs, DocsResponseTabs } from "@/components/DocsCodeTabs";

export const metadata: Metadata = {
  title: "Developer API",
  description: `Integrate ${BRAND.name}'s natural prose refinement engine into editorial CMSs, publishing pipelines, and writing apps via a clean REST API.`,
};

const CURL = `curl -X POST https://${BRAND.domain}/api/v1/rewrite \\
  -H "Authorization: Bearer pf_sk_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "In today'\''s rapidly evolving digital landscape, leveraging clear habits unlocks stronger writing.",
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
print(data["text"])
print(data["fidelity"])`;

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
  { id: "parameters", label: "Parameters" },
  { id: "response", label: "Response & Fidelity" },
  { id: "errors", label: "Error Codes" },
  { id: "privacy", label: "Zero Retention" },
];

export default function DocsPage() {
  return (
    <div className="min-h-dvh flex flex-col">
      <PublicHeader />

      <main className="flex-1 max-w-5xl w-full mx-auto px-5 py-12 md:py-16 grid lg:grid-cols-12 gap-10 items-start">
        {/* Clean Left Sticky Sidebar */}
        <aside className="hidden lg:block lg:col-span-3 sticky top-24 space-y-6">
          <Link href="/app/api-keys" className="pf-btn pf-btn-primary text-xs w-full py-2.5">
            Your API keys
          </Link>
          <nav className="space-y-1.5 text-sm border-l pl-4" style={{ borderColor: "var(--pf-border)" }}>
            {TOC.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="block py-1 pf-muted hover:text-[var(--pf-accent)] transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </aside>

        {/* Clean White Right Reference Column */}
        <div className="lg:col-span-9 space-y-12">
          <div className="border-b pb-8" style={{ borderColor: "var(--pf-border)" }}>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-[-0.035em]">
              The {BRAND.name} API
            </h1>
            <p className="pf-muted mt-3 text-base max-w-2xl leading-relaxed">
              Everything the Studio does, over HTTP. Send a draft and get natural prose back with
              live Fidelity Shield metrics and zero text retention.
            </p>
            <div className="mt-5 flex flex-wrap gap-3 lg:hidden">
              <Link href="/app/api-keys" className="pf-btn pf-btn-primary text-xs px-4 py-2">
                Your API keys
              </Link>
            </div>
          </div>

          <section id="overview" className="scroll-mt-24 space-y-4">
            <h2 className="text-xl font-bold">Overview</h2>
            <p className="pf-muted text-sm sm:text-[15px] leading-relaxed">
              Base URL: <code className="pf-mono font-semibold">https://{BRAND.domain}/api/v1</code>.
              Headings and short lines stay untouched automatically while body paragraphs run in
              parallel.
            </p>
          </section>

          <section id="auth" className="scroll-mt-24 space-y-4">
            <h2 className="text-xl font-bold">Authentication</h2>
            <p className="pf-muted text-sm sm:text-[15px] leading-relaxed">
              Create a key in{" "}
              <Link href="/app/api-keys" className="pf-link font-semibold">
                API Keys
              </Link>{" "}
              and send it as a Bearer token. Keys are shown once and can be revoked anytime.
            </p>
            <div
              className="rounded-lg border p-4 pf-mono text-xs sm:text-sm overflow-x-auto"
              style={{ background: "var(--pf-surface)", borderColor: "var(--pf-border)" }}
            >
              Authorization: Bearer pf_sk_live_...
            </div>
          </section>

          <section id="endpoint" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-2.5">
              <span
                className="px-2 py-0.5 rounded text-xs font-bold pf-mono"
                style={{ background: "var(--pf-accent)", color: "var(--pf-btn-ink)" }}
              >
                POST
              </span>
              <h2 className="text-xl font-bold pf-mono">/api/v1/rewrite</h2>
            </div>
            <DocsCodeTabs curl={CURL} python={PY} js={JS} />
          </section>

          <section id="parameters" className="scroll-mt-24 space-y-4">
            <h2 className="text-xl font-bold">Parameters</h2>
            <div className="pf-card-pure overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr
                      className="border-b pf-muted"
                      style={{ borderColor: "var(--pf-border)", background: "var(--pf-surface)" }}
                    >
                      <th className="py-3 px-5 font-semibold">Field</th>
                      <th className="py-3 px-4 font-semibold">Type</th>
                      <th className="py-3 px-4 font-semibold">Default</th>
                      <th className="py-3 px-5 font-semibold">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: "var(--pf-border)" }}>
                    <tr>
                      <td className="py-3.5 px-5 pf-mono font-bold">text</td>
                      <td className="py-3.5 px-4 pf-mono pf-muted">string</td>
                      <td className="py-3.5 px-4 pf-mono pf-muted">required</td>
                      <td className="py-3.5 px-5 pf-muted">Draft text (up to 8,000 words on Business &amp; API).</td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-5 pf-mono font-bold">mode</td>
                      <td className="py-3.5 px-4 pf-mono pf-muted">string</td>
                      <td className="py-3.5 px-4 pf-mono">&quot;standard&quot;</td>
                      <td className="py-3.5 px-5 pf-muted">fast (3 passes), standard (5), or deep (7).</td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-5 pf-mono font-bold">creativity</td>
                      <td className="py-3.5 px-4 pf-mono pf-muted">string</td>
                      <td className="py-3.5 px-4 pf-mono">&quot;natural&quot;</td>
                      <td className="py-3.5 px-5 pf-muted">natural (1.0) or balanced (0.90).</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section id="response" className="scroll-mt-24 space-y-4">
            <h2 className="text-xl font-bold">Response &amp; Fidelity Shield</h2>
            <DocsResponseTabs />
          </section>

          <section id="errors" className="scroll-mt-24 space-y-4">
            <h2 className="text-xl font-bold">Error Codes</h2>
            <div className="pf-card-pure overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr
                      className="border-b pf-muted"
                      style={{ borderColor: "var(--pf-border)", background: "var(--pf-surface)" }}
                    >
                      <th className="py-3 px-5 font-semibold">Status</th>
                      <th className="py-3 px-5 font-semibold">Meaning</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: "var(--pf-border)" }}>
                    {[
                      { code: "400", desc: "Invalid parameters or exceeds request word limit." },
                      { code: "401", desc: "Missing or revoked Bearer API key." },
                      { code: "402", desc: "Not enough word credits remaining." },
                      { code: "403", desc: "Requires Business & API plan." },
                      { code: "429", desc: "Rate limit exceeded; retry with backoff." },
                      { code: "502 / 503", desc: "Upstream timeout. Failed calls never deduct credits." },
                    ].map((row) => (
                      <tr key={row.code}>
                        <td className="py-3 px-5 pf-mono font-bold">{row.code}</td>
                        <td className="py-3 px-5 pf-muted">{row.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section id="privacy" className="scroll-mt-24 pf-card p-6 space-y-2">
            <h2 className="text-lg font-bold">Zero Text Retention</h2>
            <p className="pf-muted text-sm leading-relaxed">
              Request bodies and outputs stay strictly in memory during execution. Only anonymous
              word counts and timestamps are recorded for billing.
            </p>
          </section>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
