"use client";

import { useState } from "react";

type Lang = "curl" | "python" | "js";
type RespTab = "ok" | "credits" | "auth";

export function DocsCodeTabs({
  curl,
  python,
  js,
}: {
  curl: string;
  python: string;
  js: string;
}) {
  const [lang, setLang] = useState<Lang>("curl");
  const [copied, setCopied] = useState(false);

  const map: Record<Lang, string> = { curl, python, js };

  return (
    <div className="pf-dark-card overflow-hidden">
      <div
        className="px-4 sm:px-5 py-3 border-b flex flex-wrap items-center justify-between gap-2"
        style={{ borderColor: "var(--pf-espresso-border)" }}
      >
        <div className="inline-flex rounded-md p-0.5 bg-white/10">
          {(
            [
              { id: "curl", label: "cURL" },
              { id: "python", label: "Python" },
              { id: "js", label: "Node.js / TS" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setLang(t.id)}
              className="px-3 py-1 rounded text-xs font-semibold cursor-pointer transition-colors"
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

        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(map[lang]);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          }}
          className="text-xs font-semibold px-3 py-1.5 rounded-md border hover:bg-white/10 cursor-pointer"
          style={{ borderColor: "var(--pf-espresso-border)", color: "var(--pf-espresso-ink)" }}
        >
          {copied ? "✓ Copied" : "Copy example"}
        </button>
      </div>

      <pre
        className="p-5 text-xs sm:text-[13px] leading-relaxed overflow-x-auto pf-mono"
        style={{ color: "var(--pf-espresso-ink)" }}
      >
        <code>{map[lang]}</code>
      </pre>
    </div>
  );
}

export function DocsResponseTabs() {
  const [tab, setTab] = useState<RespTab>("ok");
  const [copied, setCopied] = useState(false);

  const samples: Record<RespTab, string> = {
    ok: `{
  "text": "Clear daily habits do more for a growing team than any heavyweight playbook.",
  "words_charged": 14,
  "credits_remaining": 249986,
  "elapsed_ms": 6420,
  "mode": "standard",
  "creativity": "natural",
  "fidelity": {
    "phrases_rebuilt_pct": 94.2,
    "quotes_total": 0,
    "quotes_kept": 0,
    "numbers_total": 0,
    "numbers_kept": 0,
    "original_words": 15,
    "rewritten_words": 14,
    "warnings": []
  }
}`,
    credits: `{
  "error_code": "insufficient_credits",
  "error_message": "Not enough word credits for this request. Upgrade or top up in Billing."
}`,
    auth: `{
  "error_code": "invalid_api_key",
  "error_message": "Missing or revoked Authorization Bearer token."
}`,
  };

  return (
    <div className="pf-dark-card overflow-hidden">
      <div
        className="px-4 sm:px-5 py-3 border-b flex flex-wrap items-center justify-between gap-2"
        style={{ borderColor: "var(--pf-espresso-border)" }}
      >
        <div className="inline-flex rounded-md p-0.5 bg-white/10">
          {(
            [
              { id: "ok", label: "200 OK" },
              { id: "credits", label: "402 Credits" },
              { id: "auth", label: "401 Auth" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className="px-3 py-1 rounded text-xs font-semibold cursor-pointer transition-colors"
              style={
                tab === t.id
                  ? { background: "var(--pf-accent)", color: "var(--pf-btn-ink)" }
                  : { color: "var(--pf-espresso-muted)" }
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(samples[tab]);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          }}
          className="text-xs font-semibold px-3 py-1.5 rounded-md border hover:bg-white/10 cursor-pointer"
          style={{ borderColor: "var(--pf-espresso-border)", color: "var(--pf-espresso-ink)" }}
        >
          {copied ? "✓ Copied" : "Copy JSON"}
        </button>
      </div>

      <pre
        className="p-5 text-xs sm:text-[13px] leading-relaxed overflow-x-auto pf-mono"
        style={{ color: "var(--pf-espresso-ink)" }}
      >
        <code>{samples[tab]}</code>
      </pre>
    </div>
  );
}
