/**
 * HIP engine — Humanization by Iterative Paraphrasing.
 *
 * Faithful TypeScript port of reference/engine.py (the proven implementation
 * that scored 0% AI across all six major detectors).
 *
 * CRITICAL: the model is a RAW BASE model. We must call
 *   POST {backend}/v1/completions
 * and NEVER /v1/chat/completions — chat templates destroy the base-model
 * distribution.
 */
import { env } from "./env";
import type { FidelityReport } from "./fidelity";
import { computeFidelityReport } from "./fidelity";

// ---------------------------------------------------------------------------
// Chunking (paragraph-aligned, headings pass through untouched)
// ---------------------------------------------------------------------------

export interface Chunk {
  index: number;
  text: string;
  /** True for headings / very short standalone lines — passed through as-is. */
  passthrough: boolean;
}

export function isHeadingOrShort(para: string): boolean {
  const words = para.split(/\s+/).filter(Boolean);
  if (words.length <= 12 && !/[.!?]$/.test(para)) return true;
  if (words.length <= 6) return true;
  return false;
}

export function splitIntoChunks(
  text: string,
  targetWords = 220,
  maxWords = 320,
): Chunk[] {
  const rawParas = text
    .trim()
    .split(/\n\s*\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks: Chunk[] = [];
  let buf: string[] = [];
  let bufWords = 0;

  const flushBuf = (): void => {
    if (buf.length > 0) {
      chunks.push({ index: chunks.length, text: buf.join("\n\n"), passthrough: false });
      buf = [];
      bufWords = 0;
    }
  };

  for (const para of rawParas) {
    if (isHeadingOrShort(para)) {
      flushBuf();
      chunks.push({ index: chunks.length, text: para, passthrough: true });
      continue;
    }

    const wc = para.split(/\s+/).filter(Boolean).length;
    if (wc > maxWords) {
      flushBuf();
      // Split a mega-paragraph cleanly at sentence boundaries.
      const sents = para
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter(Boolean);
      let cur: string[] = [];
      let curW = 0;
      for (const s of sents) {
        const sw = s.split(/\s+/).filter(Boolean).length;
        if (cur.length > 0 && curW + sw > targetWords) {
          chunks.push({ index: chunks.length, text: cur.join(" "), passthrough: false });
          cur = [s];
          curW = sw;
        } else {
          cur.push(s);
          curW += sw;
        }
      }
      if (cur.length > 0) {
        chunks.push({ index: chunks.length, text: cur.join(" "), passthrough: false });
      }
      continue;
    }

    if (buf.length > 0 && bufWords + wc > targetWords) {
      flushBuf();
    }
    buf.push(para);
    bufWords += wc;
  }

  flushBuf();
  return chunks;
}

// ---------------------------------------------------------------------------
// Raw base-model prompt & call
// ---------------------------------------------------------------------------

export function buildHipPrompt(sourceText: string): string {
  return (
    "<source_text>\n" +
    sourceText.trim() +
    "\n</source_text>\n\n" +
    "<target_text>\n"
  );
}

export function cleanHipOutput(raw: string): string {
  let text = (raw ?? "").trim();
  if (text.startsWith("<target_text>")) {
    text = text.slice("<target_text>".length).replace(/^\s+/, "");
  }
  for (const tag of ["</target_text>", "<source_text>"]) {
    const at = text.indexOf(tag);
    if (at !== -1) text = text.slice(0, at).trimEnd();
  }
  return text.trim();
}

export interface CompleteOptions {
  temperature?: number;
  topP?: number;
  maxNewTokens?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
}

/**
 * One raw HIP completion call. MUST hit /v1/completions (never
 * /v1/chat/completions) — see file header.
 */
export async function completeHipOnce(
  sourceText: string,
  opts: CompleteOptions = {},
): Promise<string> {
  const temperature = opts.temperature ?? 1.0;
  const topP = opts.topP ?? 0.95;
  const prompt = buildHipPrompt(sourceText);

  if (env.backendMode !== "openai") {
    throw new Error(`Unsupported HIP backend mode: ${env.backendMode}`);
  }

  const url = `${env.backendUrl}/v1/completions`;
  const payload = {
    model: env.modelName,
    prompt,
    max_tokens: opts.maxNewTokens ?? 512,
    temperature,
    top_p: topP,
    stop: ["</target_text>", "<source_text>"],
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${env.cerebKey}`,
    },
    body: JSON.stringify(payload),
    signal: opts.signal,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new Error(`Cerebellum HTTP ${res.status}: ${detail.slice(0, 300)}`);
  }

  const data = (await res.json()) as { choices?: Array<{ text?: string }> };
  const raw = data.choices?.[0]?.text ?? "";
  const cleaned = cleanHipOutput(raw);
  return cleaned || sourceText.trim();
}

// ---------------------------------------------------------------------------
// Full document pipeline (iterative rounds + parallel chunk workers)
// ---------------------------------------------------------------------------

export type RewriteMode = "fast" | "standard" | "deep";
export type Creativity = "balanced" | "natural";

export interface HumanizeConfig {
  rounds: number;
  temperature: number;
  topP: number;
  targetChunkWords: number;
  maxChunkWords: number;
  maxWorkers: number;
}

export interface ProgressEvent {
  blockIndex: number; // 0-based
  totalBlocks: number;
  activeBlock: number; // 1-based index among active (non-passthrough) blocks
  activeTotal: number;
  round: number;
  rounds: number;
  elapsedMs: number;
  currentWords: number;
  version: "A" | "B";
}

export interface HumanizeCallbacks {
  onProgress?: (ev: ProgressEvent) => void;
  onBlock?: (block: BlockResult, version: "A" | "B") => void;
}

export interface BlockResult {
  index: number;
  passthrough: boolean;
  text: string;
}

export interface HumanizeResult {
  text: string;
  blocks: BlockResult[];
  report: FidelityReport;
  elapsedMs: number;
}

/** Small dynamic worker pool — runs tasks with bounded concurrency. */
async function runPool<T, R>(
  items: T[],
  workers: number,
  fn: (item: T, position: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  const size = Math.max(1, Math.min(workers, items.length));
  const runners = Array.from({ length: size }, async () => {
    for (;;) {
      const i = cursor++;
      if (i >= items.length) return;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(runners);
  return results;
}

export async function humanizeDocument(
  text: string,
  config: Partial<HumanizeConfig> = {},
  callbacks?: HumanizeCallbacks,
  signal?: AbortSignal,
  version: "A" | "B" = "A",
): Promise<HumanizeResult> {
  const cfg: HumanizeConfig = {
    rounds: config.rounds ?? 5,
    temperature: config.temperature ?? 1.0,
    topP: config.topP ?? 0.95,
    targetChunkWords: config.targetChunkWords ?? 220,
    maxChunkWords: config.maxChunkWords ?? 320,
    maxWorkers: config.maxWorkers ?? env.workers,
  };
  const started = Date.now();

  const chunks = splitIntoChunks(text, cfg.targetChunkWords, cfg.maxChunkWords);
  const activeTotal = chunks.filter((c) => !c.passthrough).length;
  const activeIndexOf = new Map<number, number>();
  let n = 0;
  for (const c of chunks) {
    if (!c.passthrough) activeIndexOf.set(c.index, ++n);
  }

  const processChunk = async (chunk: Chunk): Promise<BlockResult> => {
    if (chunk.passthrough) {
      const block: BlockResult = { index: chunk.index, passthrough: true, text: chunk.text };
      callbacks?.onBlock?.(block, version);
      return block;
    }
    const originalWords = chunk.text.split(/\s+/).filter(Boolean).length;
    let current = chunk.text;
    // Size max_tokens proportionally so long chunks are never cut off.
    const maxNewTokens = Math.max(384, Math.min(1024, Math.round(originalWords * 2.2)));
    for (let r = 1; r <= cfg.rounds; r++) {
      const t0 = Date.now();
      const next = await completeHipOnce(current, {
        temperature: cfg.temperature,
        topP: cfg.topP,
        maxNewTokens,
        signal,
      });
      const nextWords = next.split(/\s+/).filter(Boolean).length;
      // Guard against collapsed/empty rounds.
      if (nextWords >= Math.max(10, Math.floor(originalWords * 0.45))) {
        current = next;
      }
      callbacks?.onProgress?.({
        blockIndex: chunk.index,
        totalBlocks: chunks.length,
        activeBlock: activeIndexOf.get(chunk.index) ?? 0,
        activeTotal,
        round: r,
        rounds: cfg.rounds,
        elapsedMs: Date.now() - t0,
        currentWords: nextWords,
        version,
      });
    }
    const block: BlockResult = { index: chunk.index, passthrough: false, text: current };
    callbacks?.onBlock?.(block, version);
    return block;
  };

  const blocks = await runPool(chunks, cfg.maxWorkers, processChunk);
  const resultText = blocks
    .slice()
    .sort((a, b) => a.index - b.index)
    .map((b) => b.text)
    .join("\n\n");

  const report = computeFidelityReport(text, resultText);
  return {
    text: resultText,
    blocks,
    report,
    elapsedMs: Date.now() - started,
  };
}

// ---------------------------------------------------------------------------
// Backend health
// ---------------------------------------------------------------------------

export async function checkModelHealth(): Promise<{ ok: boolean; detail: string }> {
  try {
    const res = await fetch(`${env.backendUrl}/v1/models`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${env.cerebKey}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { ok: false, detail: `HTTP ${res.status}` };
    const body = (await res.json()) as { data?: Array<{ id?: string }> };
    const ids = (body.data ?? []).map((m) => m.id ?? "").join(", ");
    return { ok: true, detail: ids ? `models: ${ids}` : "reachable" };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : String(err) };
  }
}
