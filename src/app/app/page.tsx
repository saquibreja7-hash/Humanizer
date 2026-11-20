"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface PlanDetails {
  name: string;
  words_per_month: number;
  max_words_per_request: number;
  api_access: boolean;
  docx_support: boolean;
  dual_versions: boolean;
  paragraph_regen: boolean;
  modes: string[];
}

interface Me {
  user: { id: number; email: string; plan: string };
  plan_details: PlanDetails;
  credits: { balance: number };
}

interface Fidelity {
  phrases_rebuilt_pct: number;
  quotes_total: number;
  quotes_kept: number;
  numbers_total: number;
  numbers_kept: number;
  original_words: number;
  rewritten_words: number;
  warnings: string[];
}

interface DocxBlock {
  type: "heading" | "paragraph";
  level?: number;
  text: string;
}

type Mode = "fast" | "standard" | "deep";
type Creativity = "balanced" | "natural";

const MODE_LABEL: Record<Mode, string> = {
  fast: "Fast (3 rounds)",
  standard: "Standard (5 rounds) — Recommended",
  deep: "Deep (7 rounds)",
};
const CREATIVITY_LABEL: Record<Creativity, string> = {
  natural: "Natural (1.0) — Recommended",
  balanced: "Balanced (0.90)",
};

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function isHeading(text: string): boolean {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= 6) return true;
  return words.length <= 12 && !/[.!?]$/.test(text);
}

export default function EditorPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [input, setInput] = useState("");
  const [docxName, setDocxName] = useState<string | null>(null);
  const [originalBlocks, setOriginalBlocks] = useState<DocxBlock[] | null>(null);
  const [mode, setMode] = useState<Mode>("standard");
  const [creativity, setCreativity] = useState<Creativity>("natural");
  const [twoVersions, setTwoVersions] = useState(false);

  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [roundsDone, setRoundsDone] = useState(0);
  const [totalRounds, setTotalRounds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [versions, setVersions] = useState<{
    A: Array<{ block: number; text: string }>;
    B?: Array<{ block: number; text: string }>;
  } | null>(null);
  const [fidelities, setFidelities] = useState<{ A?: Fidelity; B?: Fidelity }>({});
  const [activeVersion, setActiveVersion] = useState<"A" | "B">("A");
  const [regenBusy, setRegenBusy] = useState<number | null>(null);
  const dragDepth = useRef(0);
  const [dragging, setDragging] = useState(false);

  const inputWords = useMemo(() => countWords(input), [input]);
  const plan = me?.plan_details;
  const balance = me?.credits.balance ?? 0;

  const refreshMe = useCallback(async () => {
    const res = await fetch("/api/auth/me");
    if (res.ok) setMe((await res.json()) as Me);
  }, []);

  useEffect(() => {
    void refreshMe();
  }, [refreshMe]);

  useEffect(() => {
    if (plan && !plan.modes.includes(mode)) {
      setMode("standard");
    }
  }, [plan, mode]);

  // ----- file input -----
  const onFiles = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return;
      const file = files[0];
      setError(null);
      if (file.name.toLowerCase().endsWith(".txt")) {
        const text = await file.text();
        setInput(text);
        setDocxName(file.name);
        setOriginalBlocks(null);
        return;
      }
      if (file.name.toLowerCase().endsWith(".docx")) {
        if (!plan?.docx_support) {
          setError("Word (.docx) upload is available on Starter and above — upgrade in Billing.");
          return;
        }
        setStatus(`Reading ${file.name}...`);
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/docx/extract", { method: "POST", body: form });
        const data = (await res.json()) as { blocks?: DocxBlock[]; error_message?: string };
        if (!res.ok) {
          setError(data.error_message ?? "Could not read this file.");
          setStatus(null);
          return;
        }
        setOriginalBlocks(data.blocks ?? null);
        setInput((data.blocks ?? []).map((b) => b.text).join("\n\n"));
        setDocxName(file.name);
        setStatus(null);
      } else {
        setError("Only .txt and .docx files are supported.");
      }
    },
    [plan],
  );

  // ----- SSE rewrite -----
  async function runRewrite() {
    const text = input.trim();
    if (!text) {
      setError("Paste or upload some text first.");
      return;
    }
    if (plan && inputWords > plan.max_words_per_request) {
      setError(
        `Your ${plan.name} plan allows up to ${plan.max_words_per_request.toLocaleString()} words per request (you have ${inputWords.toLocaleString()}). Split the text or upgrade.`,
      );
      return;
    }
    if (inputWords > balance) {
      setError(`Not enough word credits (${balance.toLocaleString()} left, this needs ${inputWords.toLocaleString()}).`);
      return;
    }

    setRunning(true);
    setError(null);
    setStatus("Starting...");
    setVersions(null);
    setFidelities({});
    setRoundsDone(0);
    setTotalRounds(0);

    const collected: { A: Array<{ block: number; text: string }>; B?: Array<{ block: number; text: string }> } = { A: [] };

    try {
      const res = await fetch("/api/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          mode,
          creativity,
          versions: twoVersions && plan?.dual_versions ? 2 : 1,
        }),
      });
      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => ({}))) as { error_message?: string };
        throw new Error(data.error_message ?? `Rewrite failed (HTTP ${res.status}).`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf("\n\n")) !== -1) {
          const chunk = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          if (!chunk.startsWith("data: ")) continue;
          const ev = JSON.parse(chunk.slice(6)) as Record<string, unknown>;
          switch (ev.type) {
            case "start": {
              const versionsCount = (ev.versions as number) ?? 1;
              const active = (ev.words as number) > 0 ? Math.max(1, Math.ceil(inputWords / 220)) : 1;
              setTotalRounds((ev.rounds as number) * active * versionsCount);
              setStatus(`Rewriting...`);
              break;
            }
            case "progress": {
              setRoundsDone((n) => n + 1);
              setStatus(
                `Rewriting block ${ev.active_block}/${ev.active_total} — Round ${ev.round}/${ev.rounds}` +
                  (ev.version === "B" ? " (Option B)" : ""),
              );
              break;
            }
            case "block": {
              const v = ev.version as "A" | "B";
              if (!collected[v]) collected[v] = [];
              (collected[v] as Array<{ block: number; text: string }>).push({
                block: ev.block as number,
                text: ev.text as string,
              });
              setVersions({ A: [...collected.A], B: collected.B ? [...collected.B] : undefined });
              break;
            }
            case "version_done": {
              setFidelities((f) => ({ ...f, [ev.version as "A" | "B"]: ev.fidelity as Fidelity }));
              break;
            }
            case "done": {
              setStatus(`Finished in ${(((ev.elapsed_ms as number) ?? 0) / 1000).toFixed(1)}s`);
              break;
            }
            case "error": {
              setError(ev.message as string);
              break;
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rewrite failed.");
      setStatus(null);
    } finally {
      setRunning(false);
      void refreshMe();
    }
  }

  // ----- paragraph regenerate -----
  async function regenerateParagraph(index: number) {
    if (!versions || running) return;
    const sorted = [...(versions[activeVersion] ?? [])].sort((a, b) => a.block - b.block);
    const target = sorted[index];
    if (!target) return;
    setRegenBusy(index);
    try {
      const res = await fetch("/api/rewrite/paragraph", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: target.text, mode, creativity }),
      });
      const data = (await res.json()) as {
        text?: string;
        fidelity?: Fidelity;
        balance?: number;
        error_message?: string;
      };
      if (!res.ok) {
        setError(data.error_message ?? "Could not regenerate this paragraph.");
        return;
      }
      setError(null);
      setVersions((v) => {
        if (!v) return v;
        const raw = [...(v[activeVersion] ?? [])];
        const at = raw.findIndex((r) => r.block === target.block);
        if (at !== -1) raw[at] = { block: target.block, text: data.text! };
        return { ...v, [activeVersion]: raw } as typeof v;
      });
      setMe((m) =>
        m && typeof data.balance === "number"
          ? { ...m, credits: { balance: data.balance! } }
          : m,
      );
    } finally {
      setRegenBusy(null);
    }
  }

  // ----- export -----
  const activeParas = useMemo(() => {
    const raw = versions?.[activeVersion] ?? [];
    return [...raw].sort((a, b) => a.block - b.block).map((b) => b.text);
  }, [versions, activeVersion]);

  function buildExportBlocks(): DocxBlock[] {
    const queue = [...activeParas];
    if (originalBlocks) {
      const out: DocxBlock[] = [];
      for (const b of originalBlocks) {
        if (b.type === "heading") {
          out.push({ type: "heading", level: b.level ?? 1, text: b.text });
        } else {
          const next = queue.shift();
          out.push({ type: "paragraph", text: next ?? b.text });
        }
      }
      // anything left over (model added paragraphs) gets appended
      for (const extra of queue) out.push({ type: "paragraph", text: extra });
      return out;
    }
    return activeParas.map((p) =>
      isHeading(p) ? { type: "heading", level: 2, text: p } : { type: "paragraph", text: p },
    );
  }

  async function downloadDocx() {
    const res = await fetch("/api/docx/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocks: buildExportBlocks() }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error_message?: string };
      setError(data.error_message ?? "Export failed.");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "proseflow-export.docx";
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadTxt() {
    const blob = new Blob([activeParas.join("\n\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "proseflow-output.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copyAll() {
    await navigator.clipboard.writeText(activeParas.join("\n\n"));
    setStatus("Copied to clipboard.");
  }

  const fidelity = fidelities[activeVersion];
  const progressPct = totalRounds > 0 ? Math.min(100, Math.round((roundsDone / totalRounds) * 100)) : 0;
  const monthCap = plan?.words_per_month ?? 500;
  const capPct = Math.min(100, Math.round((balance / monthCap) * 100));

  return (
    <div className="max-w-7xl mx-auto px-5 py-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* ---------------- LEFT PANE ---------------- */}
        <section>
          <div
            className="pf-card p-4"
            onDragEnter={(e) => {
              e.preventDefault();
              dragDepth.current++;
              setDragging(true);
            }}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={() => {
              dragDepth.current--;
              if (dragDepth.current <= 0) setDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              dragDepth.current = 0;
              setDragging(false);
              void onFiles(e.dataTransfer.files);
            }}
            style={dragging ? { borderColor: "var(--pf-accent)", borderWidth: 2 } : undefined}
          >
            <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
              <h2 className="font-bold">Your draft</h2>
              <label className="pf-btn pf-btn-ghost text-xs px-3 py-1.5 cursor-pointer">
                Upload .docx / .txt
                <input
                  type="file"
                  accept=".txt,.docx"
                  className="hidden"
                  onChange={(e) => void onFiles(e.target.files)}
                />
              </label>
            </div>
            {docxName && (
              <p className="pf-muted text-xs mb-2">
                Loaded: {docxName} {originalBlocks ? `(${originalBlocks.length} blocks)` : ""}
              </p>
            )}
            <textarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setOriginalBlocks(null);
                setDocxName(null);
              }}
              placeholder={
                "Paste your draft here — or drop a .docx / .txt file.\n\nHeadings and short standalone lines stay untouched; every paragraph gets rewritten naturally."
              }
              rows={14}
              className="pf-input pf-serif text-base leading-relaxed resize-y"
              style={{ minHeight: 320 }}
            />
            <div className="mt-3 flex items-center justify-between text-sm flex-wrap gap-2">
              <span className="pf-muted">
                {inputWords.toLocaleString()} words ·{" "}
                {plan ? `${plan.max_words_per_request.toLocaleString()} max per request` : ""}
              </span>
              {input && (
                <button
                  className="pf-btn pf-btn-ghost text-xs px-3 py-1"
                  onClick={() => {
                    setInput("");
                    setDocxName(null);
                    setOriginalBlocks(null);
                  }}
                >
                  Clear
                </button>
              )}
            </div>

            {/* credits bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs pf-muted mb-1">
                <span>Word credits</span>
                <span>
                  {balance.toLocaleString()} / {monthCap.toLocaleString()} this cycle
                </span>
              </div>
              <div className="h-2 rounded-full" style={{ background: "var(--pf-surface-2)" }}>
                <div
                  className="h-2 rounded-full transition-all"
                  style={{ width: `${capPct}%`, background: "var(--pf-accent)" }}
                />
              </div>
            </div>

            {/* controls */}
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div>
                <label className="text-xs font-semibold pf-muted">Mode</label>
                <select
                  className="pf-input mt-1 text-sm"
                  value={mode}
                  onChange={(e) => setMode(e.target.value as Mode)}
                >
                  {(plan?.modes ?? ["fast", "standard"]).map((m) => (
                    <option key={m} value={m}>
                      {MODE_LABEL[m as Mode]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold pf-muted">Creativity</label>
                <select
                  className="pf-input mt-1 text-sm"
                  value={creativity}
                  onChange={(e) => setCreativity(e.target.value as Creativity)}
                >
                  <option value="natural">{CREATIVITY_LABEL.natural}</option>
                  <option value="balanced">{CREATIVITY_LABEL.balanced}</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold pf-muted">Versions</label>
                <select
                  className="pf-input mt-1 text-sm"
                  value={twoVersions ? "2" : "1"}
                  onChange={(e) => setTwoVersions(e.target.value === "2")}
                  disabled={!plan?.dual_versions}
                >
                  <option value="1">1 version</option>
                  <option value="2" disabled={!plan?.dual_versions}>
                    2 versions (Option A &amp; B)
                  </option>
                </select>
              </div>
            </div>

            <button
              onClick={() => void runRewrite()}
              disabled={running || !input.trim()}
              className="pf-btn pf-btn-primary w-full mt-5"
            >
              {running ? "Refining your prose..." : "Refine my writing →"}
            </button>
            {!plan?.paragraph_regen && plan && (
              <p className="pf-muted text-xs mt-2 text-center">
                Click-to-regenerate paragraphs and Option A/B are available on Pro.
              </p>
            )}
          </div>
        </section>

        {/* ---------------- RIGHT PANE ---------------- */}
        <section>
          <div className="pf-card p-4 flex flex-col" style={{ minHeight: 480 }}>
            <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
              <h2 className="font-bold">Refined output</h2>
              {versions?.B && (
                <div className="flex gap-1 rounded-full border p-1" style={{ borderColor: "var(--pf-border)" }}>
                  {(["A", "B"] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setActiveVersion(v)}
                      className={`pf-btn text-xs px-4 py-1.5 rounded-full ${activeVersion === v ? "pf-btn-primary" : ""}`}
                    >
                      Option {v}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {running && (
              <div className="mb-4">
                <div className="h-2 rounded-full" style={{ background: "var(--pf-surface-2)" }}>
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{ width: `${progressPct}%`, background: "var(--pf-accent)" }}
                  />
                </div>
                <p className="pf-muted text-sm mt-2">{status}</p>
              </div>
            )}
            {!running && status && <p className="pf-muted text-sm mb-3">{status}</p>}
            {error && (
              <p className="text-sm mb-3" style={{ color: "var(--pf-bad)" }}>
                {error}
              </p>
            )}

            {/* Fidelity Shield */}
            {fidelity && (
              <div className="mb-4">
                <div className="flex gap-2 flex-wrap">
                  <span
                    className="pf-badge"
                    style={{
                      color: fidelity.phrases_rebuilt_pct >= 80 ? "var(--pf-good)" : "var(--pf-warn)",
                      background: fidelity.phrases_rebuilt_pct >= 80 ? "var(--pf-accent-soft)" : "transparent",
                    }}
                  >
                    {fidelity.phrases_rebuilt_pct}% phrases rebuilt
                  </span>
                  <span className="pf-badge" style={{ color: "var(--pf-good)" }}>
                    Quotes kept {fidelity.quotes_kept}/{fidelity.quotes_total}
                  </span>
                  <span className="pf-badge" style={{ color: "var(--pf-good)" }}>
                    Numbers kept {fidelity.numbers_kept}/{fidelity.numbers_total}
                  </span>
                </div>
                {fidelity.warnings.length > 0 && (
                  <div
                    className="mt-3 text-xs rounded-lg p-3"
                    style={{ background: "var(--pf-accent-soft)", color: "var(--pf-warn)" }}
                  >
                    <strong>Fidelity Shield warning:</strong> {fidelity.warnings.join(" · ")}
                  </div>
                )}
              </div>
            )}

            {/* output paragraphs */}
            <div className="flex-1">
              {!versions && !running && (
                <p className="pf-muted text-sm pf-serif italic">
                  Your refined writing will stream in here, block by block, with live progress.
                </p>
              )}
              <div className="space-y-4">
                {activeParas.map((p, i) => {
                  const heading = isHeading(p);
                  return (
                    <div key={`${activeVersion}-${i}`} className="group relative">
                      <p
                        className={
                          heading
                            ? "font-bold text-lg pf-serif"
                            : "pf-serif text-[1.05rem] leading-[1.75]"
                        }
                      >
                        {p}
                      </p>
                      {!heading && plan?.paragraph_regen && !running && (
                        <button
                          onClick={() => void regenerateParagraph(i)}
                          disabled={regenBusy !== null}
                          className="absolute -top-3 right-0 pf-btn pf-btn-ghost text-xs px-2.5 py-1 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                          title="Regenerate just this paragraph"
                        >
                          {regenBusy === i ? "Regenerating..." : "↻ Regenerate"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {activeParas.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-6 pt-4 border-t" style={{ borderColor: "var(--pf-border)" }}>
                <button onClick={() => void copyAll()} className="pf-btn pf-btn-ghost text-xs">
                  Copy
                </button>
                <button onClick={downloadTxt} className="pf-btn pf-btn-ghost text-xs">
                  Download .txt
                </button>
                {plan?.docx_support && (
                  <button onClick={() => void downloadDocx()} className="pf-btn pf-btn-ghost text-xs">
                    Download .docx
                  </button>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
