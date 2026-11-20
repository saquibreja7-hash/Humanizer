"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BRAND } from "@/lib/brand";

interface KeyRow {
  id: number;
  prefix: string;
  created_at: string;
  revoked_at: string | null;
}

type Lang = "curl" | "python" | "node";

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<KeyRow[]>([]);
  const [usage, setUsage] = useState({ total_words: 0, calls: 0 });
  const [newKey, setNewKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [planBlocked, setPlanBlocked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);
  const [lang, setLang] = useState<Lang>("curl");
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  async function load() {
    const res = await fetch("/api/keys");
    if (res.ok) {
      const data = (await res.json()) as {
        keys: KeyRow[];
        usage: { total_words: number; calls: number };
      };
      setKeys(data.keys);
      setUsage(data.usage);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function createKey() {
    setError(null);
    setCreating(true);
    try {
      const res = await fetch("/api/keys", { method: "POST" });
      const data = (await res.json()) as { key?: string; error_message?: string };
      if (!res.ok) {
        setError(data.error_message ?? "Could not create key.");
        if (res.status === 403) setPlanBlocked(true);
        return;
      }
      setNewKey(data.key!);
      setCopied(false);
      void load();
    } finally {
      setCreating(false);
    }
  }

  async function revoke(id: number) {
    await fetch(`/api/keys?id=${id}`, { method: "DELETE" });
    void load();
  }

  const displayKey = newKey ?? "pf_sk_YOUR_API_KEY";
  const snippets: Record<Lang, string> = {
    curl: `curl -X POST https://${BRAND.domain}/api/v1/rewrite \\
  -H "Authorization: Bearer ${displayKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "In today'\''s rapidly evolving digital landscape, leveraging clear habits unlocks stronger writing.",
    "mode": "standard",
    "creativity": "natural"
  }'`,
    python: `import requests

resp = requests.post(
    "https://${BRAND.domain}/api/v1/rewrite",
    headers={"Authorization": "Bearer ${displayKey}"},
    json={
        "text": "Your rough draft text goes here.",
        "mode": "standard",
        "creativity": "natural",
    },
    timeout=120,
)
data = resp.json()
print(data["text"])
print(data["fidelity"])`,
    node: `const res = await fetch("https://${BRAND.domain}/api/v1/rewrite", {
  method: "POST",
  headers: {
    Authorization: "Bearer ${displayKey}",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    text: "Your rough draft text goes here.",
    mode: "standard",
    creativity: "natural",
  }),
});
const data = await res.json();
console.log(data.text, data.fidelity);`,
  };

  const activeCount = keys.filter((k) => !k.revoked_at).length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-7">
      {/* Clean White Header Summary */}
      <section className="pf-card p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="max-w-xl">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-[-0.03em]">API Keys</h1>
          <p className="pf-muted text-sm mt-1.5 leading-relaxed">
            Use Bearer <code className="pf-mono text-xs pf-accent">pf_sk_...</code> keys for{" "}
            <code className="pf-mono text-xs">POST /api/v1/rewrite</code>.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={creating}
              onClick={() => void createKey()}
              className="pf-btn pf-btn-primary text-xs sm:text-sm px-5 py-2.5"
            >
              {creating ? "Generating..." : "+ Generate API key"}
            </button>
            <Link href="/docs" className="pf-btn pf-btn-ghost text-xs sm:text-sm px-4 py-2.5">
              Read API docs
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 min-w-[260px]">
          {[
            { label: "Active Keys", value: String(activeCount) },
            { label: "API Calls", value: usage.calls.toLocaleString() },
            { label: "Words Refined", value: usage.total_words.toLocaleString() },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border p-4"
              style={{ background: "var(--pf-surface-pure)", borderColor: "var(--pf-border)" }}
            >
              <div className="text-[11px] font-semibold pf-muted">{stat.label}</div>
              <div className="text-xl font-bold pf-mono mt-1">{stat.value}</div>
            </div>
          ))}
        </div>
      </section>

      {planBlocked && (
        <div
          className="rounded-xl border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          style={{
            background: "var(--pf-accent-soft)",
            borderColor: "var(--pf-accent)",
          }}
        >
          <div>
            <div className="font-bold text-sm">REST API keys require the Business &amp; API plan</div>
            <p className="pf-muted text-xs sm:text-sm mt-0.5">
              Includes 250,000 monthly words and scoped <code className="pf-mono">pf_sk_...</code> keys.
            </p>
          </div>
          <Link href="/app/billing" className="pf-btn pf-btn-primary text-xs px-5 py-2.5 shrink-0">
            Upgrade to Business &amp; API
          </Link>
        </div>
      )}

      {error && !planBlocked && (
        <div
          role="alert"
          className="rounded-xl border px-4 py-3 text-sm"
          style={{ borderColor: "var(--pf-bad)", color: "var(--pf-bad)", background: "var(--pf-surface-pure)" }}
        >
          {error}
        </div>
      )}

      {newKey && (
        <div
          className="pf-card-pure p-5 sm:p-6"
          style={{ borderColor: "var(--pf-accent)", borderWidth: 2 }}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold pf-accent">
              Save your secret key now. It will not be shown again.
            </span>
            <button
              type="button"
              onClick={() => setNewKey(null)}
              className="text-xs pf-muted hover:text-[var(--pf-text)] cursor-pointer"
            >
              Dismiss
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
            <code
              className="pf-mono text-xs sm:text-sm px-3.5 py-2.5 rounded-lg flex-1 overflow-x-auto border"
              style={{ background: "var(--pf-surface)", borderColor: "var(--pf-border)" }}
            >
              {newKey}
            </code>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(newKey);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="pf-btn pf-btn-primary text-xs px-5 py-2.5 shrink-0"
            >
              {copied ? "✓ Copied" : "Copy key"}
            </button>
          </div>
        </div>
      )}

      {/* Keys Table */}
      <section className="pf-card-pure overflow-hidden">
        <div
          className="px-5 sm:px-6 py-4 border-b flex items-center justify-between gap-3"
          style={{ borderColor: "var(--pf-border)", background: "var(--pf-surface)" }}
        >
          <div>
            <h2 className="text-base font-bold">Your keys</h2>
            <p className="pf-muted text-xs mt-0.5">
              Revoked keys stop working immediately across all endpoints.
            </p>
          </div>
          <span className="pf-badge pf-mono text-[11px]" style={{ background: "var(--pf-surface-pure)" }}>
            {keys.length} total
          </span>
        </div>

        {keys.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-sm font-semibold">No API keys created yet</div>
            <p className="pf-muted text-xs mt-1">
              Click Generate API key above to mint your first <code className="pf-mono">pf_sk_...</code> credential.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b text-xs pf-muted" style={{ borderColor: "var(--pf-border)" }}>
                  <th className="py-3 px-5 font-semibold">Key Prefix</th>
                  <th className="py-3 px-5 font-semibold">Status</th>
                  <th className="py-3 px-5 font-semibold">Created</th>
                  <th className="py-3 px-5 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--pf-border)" }}>
                {keys.map((k) => {
                  const active = !k.revoked_at;
                  return (
                    <tr key={k.id}>
                      <td className="py-3.5 px-5 pf-mono font-semibold">{k.prefix}••••••••</td>
                      <td className="py-3.5 px-5">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                          style={{
                            background: active
                              ? "color-mix(in srgb, var(--pf-good) 14%, transparent)"
                              : "var(--pf-surface-2)",
                            color: active ? "var(--pf-good)" : "var(--pf-muted)",
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: active ? "var(--pf-good)" : "var(--pf-muted)" }}
                          />
                          {active ? "Active" : "Revoked"}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 pf-muted pf-mono text-xs">
                        {new Date(k.created_at).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        {active ? (
                          <button
                            type="button"
                            onClick={() => void revoke(k.id)}
                            className="text-xs font-semibold hover:underline cursor-pointer"
                            style={{ color: "var(--pf-bad)" }}
                          >
                            Revoke
                          </button>
                        ) : (
                          <span className="text-xs pf-muted">Inactive</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Quickstart Snippet */}
      <section className="pf-dark-card overflow-hidden">
        <div
          className="px-5 sm:px-6 py-4 border-b flex flex-wrap items-center justify-between gap-3"
          style={{ borderColor: "var(--pf-espresso-border)" }}
        >
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold" style={{ color: "var(--pf-espresso-ink)" }}>
              Quickstart request
            </span>
            <div className="inline-flex rounded-md p-0.5 bg-white/10">
              {(
                [
                  { id: "curl", label: "cURL" },
                  { id: "python", label: "Python" },
                  { id: "node", label: "Node.js" },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setLang(t.id)}
                  className="px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-colors"
                  style={
                    lang === t.id
                      ? { background: "var(--pf-accent)", color: "var(--pf-btn-ink)" }
                      : { color: "var(--pf-espresso-muted)" }
                  }
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              void navigator.clipboard.writeText(snippets[lang]);
              setCopiedSnippet(true);
              setTimeout(() => setCopiedSnippet(false), 1800);
            }}
            className="text-xs font-semibold px-3 py-1.5 rounded-md border hover:bg-white/10 cursor-pointer"
            style={{ borderColor: "var(--pf-espresso-border)", color: "var(--pf-espresso-ink)" }}
          >
            {copiedSnippet ? "✓ Copied" : "Copy snippet"}
          </button>
        </div>

        <pre
          className="p-5 sm:p-6 text-xs sm:text-[13px] leading-relaxed overflow-x-auto pf-mono"
          style={{ color: "var(--pf-espresso-ink)" }}
        >
          <code>{snippets[lang]}</code>
        </pre>
      </section>
    </div>
  );
}
