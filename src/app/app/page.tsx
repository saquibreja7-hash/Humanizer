"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import AnimatedRing from "@/components/AnimatedRing";

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

const MODE_META: Record<Mode, { title: string; passes: string; hint: string }> = {
  fast: { title: "Fast", passes: "3 passes", hint: "Quick light cleanup" },
  standard: { title: "Standard", passes: "5 passes", hint: "Recommended rhythm" },
  deep: { title: "Deep", passes: "7 passes", hint: "Maximum editorial depth" },
};

const CREATIVITY_META: Record<Creativity, { title: string; temp: string; hint: string }> = {
  natural: { title: "Natural Voice", temp: "1.0", hint: "Recommended flow" },
  balanced: { title: "Balanced", temp: "0.90", hint: "Closer phrasing" },
};

const STARTER_SAMPLES = [
  {
    label: "Research Review",
    tag: "Academic",
    text: `In contemporary policy scholarship, the intersection of urban governance and civic participation represents a pivotal domain of inquiry. Furthermore, empirical findings from 2019 to 2024 demonstrate that municipal budgets allocated through participatory assemblies yielded a 27% increase in public satisfaction across 14 surveyed districts. Nevertheless, researchers emphasize that institutional continuity remains essential, noting that "short-term pilot initiatives rarely reshape entrenched administrative habits."`,
  },
  {
    label: "Founder Essay",
    tag: "Blog",
    text: `In today's rapidly evolving software ecosystem, leveraging streamlined workflows is of paramount importance for ambitious product teams. Moreover, organizations that prioritize transparent communication consistently outperform competitors by fostering alignment across engineering, design, and customer operations. Ultimately, cultivating a sustainable cadence enables teams to ship higher-quality features without experiencing burnout.`,
  },
  {
    label: "Executive Brief",
    tag: "Memo",
    text: `During Q3 2026, our regional logistics division successfully implemented automated route consolidation across 8 fulfillment centers. As a direct result of this strategic initiative, average last-mile delivery times decreased by 18.4% while fuel expenditure fell by $142,000 compared to the prior quarter. Moving forward into Q4, leadership recommends expanding the dispatch playbook to our remaining 5 coastal hubs.`,
  },
];

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function countParagraphs(text: string): number {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean).length;
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
  const [copiedAll, setCopiedAll] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);

  const dragDepth = useRef(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);

  const inputWords = useMemo(() => countWords(input), [input]);
  const inputParas = useMemo(() => countParagraphs(input), [input]);
  const plan = me?.plan_details;
  const balance = me?.credits.balance ?? 0;
  const monthlyCap = plan?.words_per_month ?? 500;
  const creditPct = Math.min(100, Math.round((balance / Math.max(1, monthlyCap)) * 100));

  const refreshMe = useCallback(async () => {
    const res = await fetch("/api/auth/me");
    if (res.ok) {
      setMe((await res.json()) as Me);
      window.dispatchEvent(new Event("proseflow:credits-updated"));
    }
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
  const runRewrite = useCallback(async () => {
    const text = input.trim();
    if (!text) {
      setError("Paste a draft or pick a starter sample first.");
      return;
    }
    if (plan && inputWords > plan.max_words_per_request) {
      setError(
        `Your ${plan.name} plan allows up to ${plan.max_words_per_request.toLocaleString()} words per request (you have ${inputWords.toLocaleString()}). Split the text or upgrade.`,
      );
      return;
    }
    if (inputWords > balance) {
      setError(
        `Not enough word credits (${balance.toLocaleString()} left, this draft needs ${inputWords.toLocaleString()}).`,
      );
      return;
    }

    setRunning(true);
    setError(null);
    setStatus("Connecting to base-model engine...");
    setVersions(null);
    setActiveVersion("A");
    setFidelities({});
    setRoundsDone(0);
    setTotalRounds(0);

    const collected: {
      A: Array<{ block: number; text: string }>;
      B?: Array<{ block: number; text: string }>;
    } = { A: [] };

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
              const active =
                (ev.words as number) > 0 ? Math.max(1, Math.ceil(inputWords / 220)) : 1;
              setTotalRounds((ev.rounds as number) * active * versionsCount);
              setStatus("Refining paragraphs in parallel...");
              break;
            }
            case "progress": {
              setRoundsDone((n) => n + 1);
              setStatus(
                `Refining block ${ev.active_block}/${ev.active_total} · Pass ${ev.round}/${ev.rounds}` +
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
              setVersions({
                A: [...collected.A],
                B: collected.B ? [...collected.B] : undefined,
              });
              break;
            }
            case "version_done": {
              setFidelities((f) => ({
                ...f,
                [ev.version as "A" | "B"]: ev.fidelity as Fidelity,
              }));
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
  }, [input, plan, inputWords, balance, mode, creativity, twoVersions, refreshMe]);

  // Ctrl+Enter / Cmd+Enter shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && !running) {
        e.preventDefault();
        void runRewrite();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [runRewrite, running]);

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
      window.dispatchEvent(new Event("proseflow:credits-updated"));
    } finally {
      setRegenBusy(null);
    }
  }

  // ----- export -----
  const activeParas = useMemo(() => {
    const raw = versions?.[activeVersion] ?? [];
    return [...raw].sort((a, b) => a.block - b.block).map((b) => b.text);
  }, [versions, activeVersion]);

  const activeText = useMemo(() => activeParas.join("\n\n"), [activeParas]);
  const activeFidelity = fidelities[activeVersion];
  const progressPct =
    totalRounds > 0 ? Math.min(98, Math.round((roundsDone / totalRounds) * 100)) : running ? 12 : 0;

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
      for (const extra of queue) out.push({ type: "paragraph", text: extra });
      return out;
    }
    return activeParas.map((p) =>
      isHeading(p) ? { type: "heading", level: 2, text: p } : { type: "paragraph", text: p },
    );
  }

  async function downloadDocx() {
    setExportBusy(true);
    try {
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
      a.download = docxName
        ? docxName.replace(/\.(docx|txt)$/i, "") + "-refined.docx"
        : "proseflow-export.docx";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportBusy(false);
    }
  }

  async function copyOutput() {
    if (!activeText) return;
    await navigator.clipboard.writeText(activeText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 1800);
  }

  const overCap = Boolean(plan && inputWords > plan.max_words_per_request);
  const overBalance = inputWords > balance;

  return (
    <div
      className="min-h-[calc(100vh-4rem)] pb-14"
      onDragEnter={(e) => {
        e.preventDefault();
        dragDepth.current += 1;
        setDragging(true);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={(e) => {
        e.preventDefault();
        dragDepth.current -= 1;
        if (dragDepth.current <= 0) {
          dragDepth.current = 0;
          setDragging(false);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        dragDepth.current = 0;
        setDragging(false);
        void onFiles(e.dataTransfer.files);
      }}
    >
      {/* Full-screen drag overlay */}
      {dragging && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-sm"
          style={{ background: "rgba(36, 16, 14, 0.72)" }}
        >
          <div
            className="rounded-2xl border-2 border-dashed px-10 py-12 text-center max-w-md"
            style={{
              borderColor: "var(--pf-espresso-rose)",
              background: "var(--pf-espresso)",
              color: "var(--pf-espresso-ink)",
            }}
          >
            <div className="text-xl font-bold">Drop your .docx or .txt file</div>
            <p className="text-sm mt-2" style={{ color: "var(--pf-espresso-muted)" }}>
              Headings and paragraph breaks stay intact automatically.
            </p>
          </div>
        </div>
      )}

      {/* Clean White Studio Header Strip */}
      <section className="border-b" style={{ background: "var(--pf-surface)", borderColor: "var(--pf-border)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-[-0.03em]">
              Writing Studio
            </h1>
            <p className="pf-muted text-xs sm:text-sm mt-1">
              Paste a draft or drop a Word file. Everything runs in memory with zero text stored.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div
              className="rounded-xl border px-4 py-3 min-w-[230px]"
              style={{
                background: "var(--pf-surface-pure)",
                borderColor: "var(--pf-border)",
              }}
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="pf-muted">{plan?.name ?? "Free"} Credits</span>
                <span className="pf-mono font-semibold">
                  {balance.toLocaleString()} / {monthlyCap.toLocaleString()}
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--pf-surface-2)" }}>
                <div
                  className="h-full rounded-full transition-opacity duration-500"
                  style={{
                    width: `${creditPct}%`,
                    background: creditPct > 20 ? "var(--pf-accent)" : "var(--pf-warn)",
                  }}
                />
              </div>
              <div className="flex items-center justify-between mt-1.5 text-[11px] pf-muted">
                <span>Max {(plan?.max_words_per_request ?? 250).toLocaleString()} words / run</span>
                <Link href="/app/billing" className="pf-link font-semibold">
                  Upgrade
                </Link>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".docx,.txt"
              className="hidden"
              onChange={(e) => {
                void onFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="pf-btn pf-btn-ghost text-xs sm:text-sm px-4 py-3"
            >
              <span>↑ Upload .docx / .txt</span>
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-6 space-y-5">
        {/* Studio Controls Dock */}
        <div className="pf-card-pure p-4 sm:p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Mode Selector */}
            <div>
              <div className="text-[11px] font-semibold pf-muted mb-1.5">
                Refinement Depth
              </div>
              <div
                className="inline-flex rounded-lg border p-1 gap-1"
                style={{ borderColor: "var(--pf-border)", background: "var(--pf-surface)" }}
              >
                {(["fast", "standard", "deep"] as Mode[]).map((m) => {
                  const allowed = !plan || plan.modes.includes(m);
                  const active = mode === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      disabled={!allowed || running}
                      title={allowed ? MODE_META[m].hint : "Available on Pro & Business plans"}
                      onClick={() => setMode(m)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                        active ? "" : "pf-muted hover:text-[var(--pf-text)]"
                      }`}
                      style={
                        active
                          ? { background: "var(--pf-accent)", color: "var(--pf-btn-ink)" }
                          : undefined
                      }
                    >
                      <span>{MODE_META[m].title}</span>
                      <span className="ml-1.5 opacity-75 pf-mono text-[10px]">
                        {MODE_META[m].passes}
                      </span>
                      {!allowed && <span className="ml-1 text-[10px]">🔒</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Creativity Selector */}
            <div>
              <div className="text-[11px] font-semibold pf-muted mb-1.5">
                Voice Cadence
              </div>
              <div
                className="inline-flex rounded-lg border p-1 gap-1"
                style={{ borderColor: "var(--pf-border)", background: "var(--pf-surface)" }}
              >
                {(["natural", "balanced"] as Creativity[]).map((c) => {
                  const active = creativity === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      disabled={running}
                      title={CREATIVITY_META[c].hint}
                      onClick={() => setCreativity(c)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                        active ? "" : "pf-muted hover:text-[var(--pf-text)]"
                      }`}
                      style={
                        active
                          ? { background: "var(--pf-accent)", color: "var(--pf-btn-ink)" }
                          : undefined
                      }
                    >
                      <span>{CREATIVITY_META[c].title}</span>
                      <span className="ml-1.5 opacity-75 pf-mono text-[10px]">
                        {CREATIVITY_META[c].temp}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dual Versions Switch */}
            <div className="pt-4 sm:pt-0">
              <div className="text-[11px] font-semibold pf-muted mb-1.5">
                Comparison
              </div>
              <label
                className={`inline-flex items-center gap-2.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                  plan?.dual_versions ? "cursor-pointer" : "opacity-60 cursor-not-allowed"
                }`}
                style={{
                  borderColor: twoVersions ? "var(--pf-accent)" : "var(--pf-border)",
                  background: twoVersions ? "var(--pf-accent-soft)" : "var(--pf-surface)",
                }}
              >
                <input
                  type="checkbox"
                  checked={twoVersions && Boolean(plan?.dual_versions)}
                  disabled={!plan?.dual_versions || running}
                  onChange={(e) => setTwoVersions(e.target.checked)}
                  className="accent-[var(--pf-accent)]"
                />
                <span>Generate Option A &amp; B</span>
                {!plan?.dual_versions && (
                  <Link href="/app/billing" className="text-[10px] pf-link ml-1">
                    Pro
                  </Link>
                )}
              </label>
            </div>
          </div>

          {/* Primary Refine Action */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right text-[11px] pf-muted">
              <div className="pf-mono font-semibold text-[var(--pf-text)]">
                {inputWords.toLocaleString()} {inputWords === 1 ? "word" : "words"}
              </div>
              <div>Ctrl + Enter</div>
            </div>
            <button
              type="button"
              onClick={() => void runRewrite()}
              disabled={running || inputWords === 0}
              className="pf-btn pf-btn-primary px-6 py-3 text-sm min-w-[175px]"
            >
              {running ? (
                <>
                  <span
                    className="inline-block w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin"
                    aria-hidden="true"
                  />
                  <span>Refining...</span>
                </>
              ) : (
                <span>Refine Prose →</span>
              )}
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            role="alert"
            className="rounded-xl border px-4 py-3 text-sm flex items-center justify-between gap-3"
            style={{
              background: "color-mix(in srgb, var(--pf-bad) 10%, var(--pf-surface-pure))",
              borderColor: "color-mix(in srgb, var(--pf-bad) 35%, var(--pf-border))",
              color: "var(--pf-bad)",
            }}
          >
            <div className="flex items-center gap-2.5">
              <span className="font-bold">!</span>
              <span>{error}</span>
            </div>
            {(overBalance || overCap) && (
              <Link href="/app/billing" className="pf-btn pf-btn-primary text-xs px-3 py-1.5 shrink-0">
                Upgrade plan
              </Link>
            )}
          </div>
        )}

        {/* Live Streaming Progress Bar */}
        {(running || status) && (
          <div
            className="rounded-xl border px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            style={{
              background: "var(--pf-surface-pure)",
              borderColor: running ? "var(--pf-accent)" : "var(--pf-border)",
            }}
          >
            <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium">
              <span
                className={`w-2.5 h-2.5 rounded-full ${running ? "pf-pulse-dot" : ""}`}
                style={{ background: running ? "var(--pf-accent)" : "var(--pf-good)" }}
              />
              <span>{status}</span>
            </div>
            {running && (
              <div className="flex items-center gap-3 sm:w-64">
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--pf-surface-2)" }}>
                  <div
                    className="h-full rounded-full transition-opacity duration-300"
                    style={{ width: `${progressPct}%`, background: "var(--pf-accent)" }}
                  />
                </div>
                <span className="pf-mono text-xs font-semibold pf-muted w-9 text-right">
                  {progressPct}%
                </span>
              </div>
            )}
          </div>
        )}

        {/* Dual-Pane Writing Canvas */}
        <div className="grid lg:grid-cols-2 gap-5 items-stretch">
          {/* Left Pane: Source Draft */}
          <div className="pf-card-pure flex flex-col overflow-hidden min-h-[470px]">
            <div
              className="px-4 sm:px-5 py-3.5 border-b flex flex-wrap items-center justify-between gap-2"
              style={{ borderColor: "var(--pf-border)", background: "var(--pf-surface)" }}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-bold">Source Draft</span>
                {docxName && (
                  <span
                    className="px-2 py-0.5 rounded text-[11px] font-semibold pf-mono"
                    style={{ background: "var(--pf-accent-soft)", color: "var(--pf-accent)" }}
                  >
                    {docxName}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs pf-muted">
                <span className="pf-mono">
                  {inputWords.toLocaleString()}w · {inputParas}¶
                </span>
                {input && (
                  <button
                    type="button"
                    disabled={running}
                    onClick={() => {
                      setInput("");
                      setDocxName(null);
                      setOriginalBlocks(null);
                      setError(null);
                    }}
                    className="hover:text-[var(--pf-bad)] font-semibold cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <textarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                if (originalBlocks) setOriginalBlocks(null);
              }}
              placeholder="Paste your draft, essay, blog post, or report here — or drop a .docx file anywhere on this page..."
              className="flex-1 w-full p-5 sm:p-6 bg-transparent resize-none outline-none text-[15px] leading-[1.78] placeholder:opacity-55"
              style={{ minHeight: 350 }}
            />

            {/* Bottom Starter Samples Bar */}
            <div
              className="px-4 sm:px-5 py-3 border-t flex flex-wrap items-center justify-between gap-2 text-xs"
              style={{ borderColor: "var(--pf-border)", background: "var(--pf-surface)" }}
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="pf-muted font-semibold mr-1">Try sample:</span>
                {STARTER_SAMPLES.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    disabled={running}
                    onClick={() => {
                      setInput(s.text);
                      setDocxName(null);
                      setOriginalBlocks(null);
                      setError(null);
                    }}
                    className="px-2.5 py-1 rounded-md border font-medium hover:border-[var(--pf-accent)] hover:text-[var(--pf-accent)] transition-colors cursor-pointer"
                    style={{ borderColor: "var(--pf-border)", background: "var(--pf-surface-pure)" }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <span
                className="pf-mono text-[11px]"
                style={{ color: overCap || overBalance ? "var(--pf-bad)" : "var(--pf-muted)" }}
              >
                {overCap
                  ? `Exceeds ${(plan?.max_words_per_request ?? 0).toLocaleString()}w cap`
                  : overBalance
                    ? `Needs ${(inputWords - balance).toLocaleString()} more credits`
                    : `~${Math.max(1, Math.round(inputWords / 200))} min read`}
              </span>
            </div>
          </div>

          {/* Right Pane: Refined Output */}
          <div className="pf-card-pure flex flex-col overflow-hidden min-h-[470px]">
            <div
              className="px-4 sm:px-5 py-3.5 border-b flex flex-wrap items-center justify-between gap-2"
              style={{ borderColor: "var(--pf-border)", background: "var(--pf-surface)" }}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold">Refined Prose</span>
                {versions?.B && (
                  <div
                    className="inline-flex rounded-md border p-0.5 ml-1"
                    style={{ borderColor: "var(--pf-border)", background: "var(--pf-surface-pure)" }}
                  >
                    {(["A", "B"] as const).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setActiveVersion(v)}
                        className="px-2.5 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors"
                        style={
                          activeVersion === v
                            ? { background: "var(--pf-accent)", color: "var(--pf-btn-ink)" }
                            : { color: "var(--pf-muted)" }
                        }
                      >
                        Option {v}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!activeText}
                  onClick={() => void copyOutput()}
                  className="pf-btn pf-btn-ghost text-xs px-3 py-1.5 disabled:opacity-45"
                >
                  {copiedAll ? "✓ Copied" : "Copy"}
                </button>
                <button
                  type="button"
                  disabled={!activeText || exportBusy || !plan?.docx_support}
                  title={
                    plan?.docx_support
                      ? "Download formatted Word document"
                      : "Word (.docx) export available on Starter and above"
                  }
                  onClick={() => void downloadDocx()}
                  className="pf-btn pf-btn-primary text-xs px-3 py-1.5 disabled:opacity-45"
                >
                  {exportBusy ? "Exporting..." : "↓ .docx"}
                </button>
              </div>
            </div>

            {/* Output Body */}
            <div className="flex-1 p-5 sm:p-6 overflow-y-auto">
              {activeParas.length > 0 ? (
                <div className="space-y-4">
                  {activeParas.map((para, idx) => (
                    <div
                      key={`${activeVersion}-${idx}`}
                      className="group relative rounded-xl border p-4 transition-colors hover:border-[var(--pf-accent)]"
                      style={{
                        borderColor: "color-mix(in srgb, var(--pf-border) 75%, transparent)",
                        background: "var(--pf-surface)",
                      }}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[11px] font-semibold pf-mono pf-muted">
                          ¶ {idx + 1} · {countWords(para)} words
                        </span>
                        {plan?.paragraph_regen ? (
                          <button
                            type="button"
                            disabled={running || regenBusy !== null}
                            onClick={() => void regenerateParagraph(idx)}
                            className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md border transition-colors hover:border-[var(--pf-accent)] hover:text-[var(--pf-accent)] cursor-pointer disabled:opacity-45"
                            style={{
                              borderColor: "var(--pf-border)",
                              background: "var(--pf-surface-pure)",
                            }}
                          >
                            {regenBusy === idx ? "Regenerating..." : "↻ Regenerate"}
                          </button>
                        ) : (
                          <Link
                            href="/app/billing"
                            className="text-[10px] pf-muted hover:text-[var(--pf-accent)] opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ↻ Per-paragraph regen (Pro)
                          </Link>
                        )}
                      </div>
                      <p className="pf-serif text-[16px] leading-[1.78] whitespace-pre-wrap">
                        {para}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full min-h-[340px] flex flex-col items-center justify-center text-center max-w-sm mx-auto py-8">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 border"
                    style={{
                      background: "var(--pf-accent-soft)",
                      color: "var(--pf-accent)",
                      borderColor: "var(--pf-border)",
                    }}
                  >
                    <span className="text-lg">✳</span>
                  </div>
                  <h2 className="text-base font-bold">Ready when your draft is</h2>
                  <p className="pf-muted text-xs sm:text-sm mt-1.5 leading-relaxed">
                    Paragraphs stream here live as each pass completes. Click any starter sample on
                    the left to see ProseFlow in action right now.
                  </p>
                  <div className="mt-5 grid grid-cols-3 gap-2 w-full text-[11px]">
                    {[
                      { k: "01", v: "Paste or drop .docx" },
                      { k: "02", v: "5-pass base model" },
                      { k: "03", v: "Verify & export" },
                    ].map((tip) => (
                      <div
                        key={tip.k}
                        className="rounded-lg border p-2.5"
                        style={{ borderColor: "var(--pf-border)", background: "var(--pf-surface)" }}
                      >
                        <div className="pf-mono font-bold pf-accent">{tip.k}</div>
                        <div className="pf-muted mt-0.5 leading-snug">{tip.v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div
              className="px-4 sm:px-5 py-3 border-t flex items-center justify-between text-xs pf-muted"
              style={{ borderColor: "var(--pf-border)", background: "var(--pf-surface)" }}
            >
              <span>
                {activeParas.length > 0
                  ? `${countWords(activeText).toLocaleString()} words · ${activeParas.length} paragraphs`
                  : "Waiting for input"}
              </span>
              <span className="pf-mono text-[11px]">RAM-only · 0 bytes stored</span>
            </div>
          </div>
        </div>

        {/* Fidelity Shield Live Telemetry Strip */}
        {activeFidelity && (
          <section className="pf-dark-card p-5 sm:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="flex items-center gap-4">
                <AnimatedRing percent={activeFidelity.phrases_rebuilt_pct} stroke="var(--pf-espresso-ink)" size={56} />
                <div>
                  <div className="text-xs font-semibold" style={{ color: "var(--pf-espresso-rose)" }}>
                    Fidelity Shield Report · Option {activeVersion}
                  </div>
                  <div className="text-lg sm:text-xl font-bold mt-0.5" style={{ color: "var(--pf-espresso-ink)" }}>
                    {activeFidelity.phrases_rebuilt_pct.toFixed(1)}% of stiff phrasing rebuilt cleanly
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: "var(--pf-espresso-muted)" }}>
                    Original {activeFidelity.original_words.toLocaleString()} words → Refined{" "}
                    {activeFidelity.rewritten_words.toLocaleString()} words
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div
                  className="rounded-lg border px-4 py-3"
                  style={{ borderColor: "var(--pf-espresso-border)", background: "rgba(255,255,255,0.04)" }}
                >
                  <div className="text-[11px]" style={{ color: "var(--pf-espresso-muted)" }}>
                    Quotes Kept
                  </div>
                  <div className="text-lg font-bold pf-mono mt-0.5" style={{ color: "var(--pf-espresso-ink)" }}>
                    {activeFidelity.quotes_kept}/{activeFidelity.quotes_total}
                  </div>
                </div>
                <div
                  className="rounded-lg border px-4 py-3"
                  style={{ borderColor: "var(--pf-espresso-border)", background: "rgba(255,255,255,0.04)" }}
                >
                  <div className="text-[11px]" style={{ color: "var(--pf-espresso-muted)" }}>
                    Numbers Kept
                  </div>
                  <div className="text-lg font-bold pf-mono mt-0.5" style={{ color: "var(--pf-espresso-ink)" }}>
                    {activeFidelity.numbers_kept}/{activeFidelity.numbers_total}
                  </div>
                </div>
                <div
                  className="rounded-lg border px-4 py-3 col-span-2 sm:col-span-1"
                  style={{ borderColor: "var(--pf-espresso-border)", background: "rgba(255,255,255,0.04)" }}
                >
                  <div className="text-[11px]" style={{ color: "var(--pf-espresso-muted)" }}>
                    Retention
                  </div>
                  <div className="text-lg font-bold pf-mono mt-0.5" style={{ color: "var(--pf-espresso-rose)" }}>
                    0 bytes
                  </div>
                </div>
              </div>
            </div>

            {activeFidelity.warnings.length > 0 && (
              <div
                className="mt-4 pt-4 border-t text-xs space-y-1"
                style={{ borderColor: "var(--pf-espresso-border)", color: "var(--pf-espresso-pill)" }}
              >
                <div className="font-bold text-xs">Fidelity Check Notes</div>
                {activeFidelity.warnings.map((w, i) => (
                  <div key={i}>• {w}</div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
