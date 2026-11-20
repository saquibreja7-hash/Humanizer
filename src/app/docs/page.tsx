import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = { title: "Developer API" };

const CURL = `curl -X POST https://${BRAND.domain}/api/v1/rewrite \\
  -H "Authorization: Bearer pf_sk_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "In today's rapidly evolving digital landscape, it is of paramount importance to leverage cutting-edge methodologies.",
    "mode": "standard",
    "creativity": "natural"
  }'`;

const PY = `import requests

resp = requests.post(
    "https://${BRAND.domain}/api/v1/rewrite",
    headers={"Authorization": "Bearer pf_sk_YOUR_KEY"},
    json={
        "text": "Your draft text goes here.",
        "mode": "standard",      # fast (3 rounds) | standard (5) | deep (7)
        "creativity": "natural", # natural (1.0) | balanced (0.9)
    },
    timeout=120,
)
data = resp.json()
print(data["text"])          # the refined text
print(data["fidelity"])     # quotes kept, numbers kept, % phrases rebuilt`;

const JS = `const res = await fetch("https://${BRAND.domain}/api/v1/rewrite", {
  method: "POST",
  headers: {
    Authorization: "Bearer pf_sk_YOUR_KEY",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    text: "Your draft text goes here.",
    mode: "standard",
    creativity: "natural",
  }),
});

const data = await res.json();
console.log(data.text);
console.log(data.fidelity.phrases_rebuilt_pct + "% of phrases rebuilt");`;

const RESPONSE = `{
  "text": "The finished, natural-sounding prose...",
  "mode": "standard",
  "rounds": 5,
  "words": 42,
  "credits_used": 42,
  "credits_remaining": 249958,
  "elapsed_ms": 14210,
  "fidelity": {
    "original_words": 42,
    "rewritten_words": 45,
    "length_ratio": 1.07,
    "phrases_rebuilt_pct": 93.1,
    "quotes_total": 1,
    "quotes_kept": 1,
    "numbers_total": 2,
    "numbers_kept": 2,
    "warnings": []
  }
}`;

function Code({ children }: { children: string }) {
  return (
    <pre
      className="text-xs leading-relaxed overflow-x-auto p-4 rounded-xl"
      style={{ background: "var(--pf-surface-2)" }}
    >
      <code>{children}</code>
    </pre>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-bold mt-10 mb-3">{children}</h2>;
}

export default function DocsPage() {
  return (
    <main className="max-w-3xl mx-auto px-5 py-12">
      <Link href="/" className="font-bold text-lg">
        {BRAND.name}
      </Link>
      <h1 className="text-4xl font-bold tracking-tight mt-4">Developer API</h1>
      <p className="pf-muted mt-3 leading-relaxed">
        Refine any amount of text programmatically. The API is included with the Business &amp; API
        plan — create a key in{" "}
        <a className="pf-link" href="/app/api-keys">
          API Keys
        </a>
        . Same engine, same fidelity checks, same zero-text-retention guarantee as the web editor.
      </p>

      <H2>Authentication</H2>
      <p className="pf-muted text-sm mb-3">
        Send your key as a bearer token. Keys start with <code>pf_sk_</code>, are shown once at
        creation, and are stored server-side only as a SHA-256 hash. Rotate or revoke anytime.
      </p>
      <Code>{`Authorization: Bearer pf_sk_...`}</Code>

      <H2>POST /api/v1/rewrite</H2>
      <div className="overflow-x-auto mb-3">
        <table className="text-sm w-full">
          <thead>
            <tr className="pf-muted text-left">
              <th className="py-2 pr-4">Field</th>
              <th className="py-2 pr-4">Type</th>
              <th className="py-2">Description</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t" style={{ borderColor: "var(--pf-border)" }}>
              <td className="py-2 pr-4">
                <code>text</code>
              </td>
              <td className="py-2 pr-4">string</td>
              <td className="py-2">The draft to refine. Required.</td>
            </tr>
            <tr className="border-t" style={{ borderColor: "var(--pf-border)" }}>
              <td className="py-2 pr-4">
                <code>mode</code>
              </td>
              <td className="py-2 pr-4">&quot;fast&quot; | &quot;standard&quot; | &quot;deep&quot;</td>
              <td className="py-2">
                Iterative rounds: 3 / 5 / 7. Default <code>standard</code>.
              </td>
            </tr>
            <tr className="border-t" style={{ borderColor: "var(--pf-border)" }}>
              <td className="py-2 pr-4">
                <code>creativity</code>
              </td>
              <td className="py-2 pr-4">&quot;natural&quot; | &quot;balanced&quot;</td>
              <td className="py-2">
                Temperature 1.0 (default) keeps it natural; 0.90 is tighter on facts.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 className="font-bold mt-6 mb-2 text-sm">cURL</h3>
      <Code>{CURL}</Code>
      <h3 className="font-bold mt-4 mb-2 text-sm">Python</h3>
      <Code>{PY}</Code>
      <h3 className="font-bold mt-4 mb-2 text-sm">JavaScript</h3>
      <Code>{JS}</Code>

      <H2>Response</H2>
      <Code>{RESPONSE}</Code>
      <p className="pf-muted text-sm mt-3">
        Word credits are deducted once per request based on input length. Failures (5xx) never
        deduct credits.
      </p>

      <H2>Limits &amp; errors</H2>
      <ul className="pf-muted text-sm space-y-2 list-disc pl-5">
        <li>
          Rate limit: 60 requests / minute per API key (429 with <code>Retry-After</code> on
          breach).
        </li>
        <li>
          Max request size: 8,000 words per request on the Business &amp; API plan.
        </li>
        <li>
          Errors return JSON: <code>{`{"error": "code", "error_message": "..."}`}</code> with
          status 400 (bad input), 401 (bad key), 402 (out of credits), 403 (plan limit), 413 (too
          large), 429 (rate limited), 502 (engine error).
        </li>
      </ul>

      <H2>Privacy</H2>
      <p className="pf-muted text-sm">
        We never store your text. Request payloads are processed in memory; only word counts,
        timing, and fidelity metrics are recorded for billing. See{" "}
        <a className="pf-link" href="/privacy">
          the Privacy Policy
        </a>{" "}
        for details.
      </p>
    </main>
  );
}
