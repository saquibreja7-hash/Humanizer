"use client";

import { useEffect, useState } from "react";

interface KeyRow {
  id: number;
  prefix: string;
  created_at: string;
  revoked_at: string | null;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<KeyRow[]>([]);
  const [usage, setUsage] = useState({ total_words: 0, calls: 0 });
  const [newKey, setNewKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [planBlocked, setPlanBlocked] = useState(false);
  const [copied, setCopied] = useState(false);

  async function load() {
    const res = await fetch("/api/keys");
    if (res.ok) {
      const data = (await res.json()) as { keys: KeyRow[]; usage: { total_words: number; calls: number } };
      setKeys(data.keys);
      setUsage(data.usage);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function createKey() {
    setError(null);
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
  }

  async function revoke(id: number) {
    await fetch(`/api/keys?id=${id}`, { method: "DELETE" });
    void load();
  }

  return (
    <div className="max-w-4xl mx-auto px-5 py-8">
      <h1 className="text-2xl font-bold mb-1">API Keys</h1>
      <p className="pf-muted text-sm mb-6">
        Create <code>pf_sk_...</code> keys to use the{" "}
        <a href="/docs" className="pf-link">
          REST API
        </a>
        . Keys are shown once and stored only as a hash.
      </p>

      {newKey && (
        <div
          className="pf-card p-4 mb-6"
          style={{ borderColor: "var(--pf-accent)", borderWidth: 2 }}
        >
          <p className="text-sm font-semibold mb-2">
            Copy your new key now — it will not be shown again:
          </p>
          <div className="flex gap-2 items-center">
            <code
              className="text-sm px-3 py-2 rounded-lg flex-1 overflow-x-auto"
              style={{ background: "var(--pf-surface-2)" }}
            >
              {newKey}
            </code>
            <button
              className="pf-btn pf-btn-primary text-xs px-3 py-2"
              onClick={async () => {
                await navigator.clipboard.writeText(newKey);
                setCopied(true);
              }}
            >
              {copied ? "Copied ✓" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm mb-4" style={{ color: "var(--pf-bad)" }}>
          {error}
        </p>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="text-sm pf-muted">
          API usage: <strong>{usage.total_words.toLocaleString()}</strong> words across{" "}
          <strong>{usage.calls}</strong> calls
        </div>
        {!planBlocked && (
          <button onClick={() => void createKey()} className="pf-btn pf-btn-primary text-sm">
            + Create key
          </button>
        )}
      </div>

      {planBlocked ? (
        <div className="pf-card p-6 text-sm">
          REST API keys are available on the <strong>Business &amp; API</strong> plan. Upgrade from
          the{" "}
          <a href="/app/billing" className="pf-link">
            Billing
          </a>{" "}
          page to enable programmatic access.
        </div>
      ) : (
        <div className="pf-card divide-y" style={{ borderColor: "var(--pf-border)" }}>
          {keys.length === 0 ? (
            <p className="p-6 pf-muted text-sm">
              No keys yet. Create one to start using the REST API.
            </p>
          ) : (
            keys.map((k) => (
              <div key={k.id} className="p-4 flex items-center justify-between gap-3">
                <div>
                  <code className="text-sm font-semibold">{k.prefix}...</code>
                  <div className="pf-muted text-xs mt-1">
                    Created {k.created_at.slice(0, 10)}
                    {k.revoked_at ? " · revoked" : ""}
                  </div>
                </div>
                {!k.revoked_at && (
                  <button
                    onClick={() => void revoke(k.id)}
                    className="pf-btn pf-btn-ghost text-xs px-3 py-1.5"
                    style={{ color: "var(--pf-bad)" }}
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
