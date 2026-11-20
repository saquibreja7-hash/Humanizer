import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { completeHipOnce, humanizeDocument, splitIntoChunks } from "@/lib/hip-engine";

// The engine must talk to the raw base-model endpoint only.
process.env.CEREBELLUM_API_KEY = "cb_sk_test_key";
process.env.HIP_BACKEND_URL = "https://api.cerebellumlabs.ai";
process.env.HIP_BACKEND_MODE = "openai";
process.env.HIP_MODEL_NAME = "jamsaq-v1";
process.env.HIP_WORKERS = "4";

let calls: Array<{ url: string; body: Record<string, unknown> }> = [];

function mockCompletions(responder: (prompt: string) => string): void {
  calls = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string | URL, init?: RequestInit) => {
      calls.push({
        url: String(url),
        body: JSON.parse(String(init?.body)) as Record<string, unknown>,
      });
      return new Response(
        JSON.stringify({ choices: [{ text: responder(String(init?.body)) }] }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }),
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("completeHipOnce", () => {
  it("POSTs to the RAW /v1/completions endpoint (never /v1/chat/completions)", async () => {
    mockCompletions(() => "some rewritten text");
    await completeHipOnce("original text");
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe("https://api.cerebellumlabs.ai/v1/completions");
    expect(calls[0].url).not.toContain("chat");
  });

  it("sends the exact HIP prompt, sampling params, and stop sequences", async () => {
    mockCompletions(() => "output");
    await completeHipOnce("my source paragraph", { temperature: 1.0, maxNewTokens: 512 });
    const body = calls[0].body;
    expect(body.model).toBe("jamsaq-v1");
    expect(body.temperature).toBe(1.0);
    expect(body.top_p).toBe(0.95);
    expect(body.stop).toEqual(["</target_text>", "<source_text>"]);
    const prompt = body.prompt as string;
    expect(prompt.startsWith("<source_text>\nmy source paragraph\n</source_text>")).toBe(true);
    expect(prompt.endsWith("<target_text>\n")).toBe(true);
  });

  it("returns the original text when the model echoes nothing usable", async () => {
    mockCompletions(() => "");
    const out = await completeHipOnce("keep me");
    expect(out).toBe("keep me");
  });

  it("raises on HTTP errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("boom", { status: 500 })),
    );
    await expect(completeHipOnce("x")).rejects.toThrow(/HTTP 500/);
  });
});

describe("humanizeDocument", () => {
  const longPara = (n: number) =>
    `Paragraph ${n} ` +
    "with a decent number of words so the chunker keeps it as body text. ".repeat(10);

  it("runs the configured number of rounds per active chunk", async () => {
    let n = 0;
    mockCompletions(() => `rewritten attempt number ${++n}`);
    const text = longPara(1);
    const result = await humanizeDocument(text, { rounds: 5, maxWorkers: 2 });
    // The 4-word candidates fall under the 45% collapse guard, so the engine
    // keeps the original — but exactly 5 model calls were made.
    expect(calls.length).toBe(5);
    expect(result.text).toContain("Paragraph 1");
  });

  it("runs chunks in parallel and keeps heading passthroughs untouched", async () => {
    let n = 0;
    mockCompletions(() => `v${++n}`);
    const text = "My Heading\n\n" + longPara(1) + "\n\n" + longPara(2);
    const result = await humanizeDocument(text, { rounds: 3, maxWorkers: 2 });
    const chunks = splitIntoChunks(text);
    expect(chunks.filter((c) => !c.passthrough).length).toBe(2);
    expect(calls.length).toBe(6); // 2 chunks x 3 rounds
    // heading appears verbatim in the output, in position
    expect(result.text.startsWith("My Heading")).toBe(true);
  });

  it("guards against collapsed rounds (< 45% of original length kept is rejected)", async () => {
    const longCandidate = Array.from({ length: 80 }, (_, i) => `word${i}`).join(" ");
    let round = 0;
    mockCompletions(() => {
      round++;
      if (round === 1) return longCandidate; // 80 words ≥ 45% of the ~170-word chunk
      return "too short"; // rounds 2+ collapse
    });
    const text = longPara(1);
    const result = await humanizeDocument(text, { rounds: 3 });
    expect(result.text).toBe(longCandidate);
    expect(result.text).not.toBe(text);
  });

  it("accepts a valid rewrite when the original is short", async () => {
    mockCompletions(() => "this here is a noticeably different rewrite that still reads quite well");
    const text = "This is a short body paragraph for testing purposes, with enough words to avoid the heading rule. Yes indeed.";
    const result = await humanizeDocument(text, { rounds: 2 });
    expect(result.text).toBe("this here is a noticeably different rewrite that still reads quite well");
    expect(result.report.original_words).toBeGreaterThan(0);
  });

  it("emits progress and block callbacks in order (sequential workers)", async () => {
    mockCompletions(() => "the final rewritten chunk text after all rounds here");
    const text = longPara(1) + "\n\n" + longPara(2);
    const progress: number[] = [];
    const blocks: number[] = [];
    await humanizeDocument(
      text,
      { rounds: 2, maxWorkers: 1 },
      {
        onProgress: (ev) => progress.push(ev.round),
        onBlock: (b) => blocks.push(b.index),
      },
    );
    expect(progress).toEqual([1, 2, 1, 2]); // chunk 1 fully, then chunk 2
    expect(blocks).toEqual([0, 1]);
  });

  it("never sends credit text through chat endpoints — regression guard", async () => {
    mockCompletions(() => "x");
    await completeHipOnce("guard");
    for (const c of calls) {
      expect(c.url).toMatch(/\/v1\/completions$/);
      expect(c.body).not.toHaveProperty("messages");
      expect(c.body).toHaveProperty("prompt");
    }
  });
});
