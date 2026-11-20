#!/usr/bin/env node
/**
 * Live E2E smoke test for ProseFlow (run against the PRODUCTION server):
 *   node scripts/e2e-smoke.mjs [baseUrl]
 *
 * Verifies, end to end, against the live jamsaq-v1 model on Cerebellum Cloud:
 *   1. Signup → 500 free credits granted
 *   2. /api/rewrite SSE streaming (progress + block events + fidelity + credit deduction)
 *   3. Dev billing simulator upgrade → Business plan
 *   4. API key creation → /api/v1/rewrite with Bearer auth (200 JSON)
 *   5. .docx export → extract round-trip
 *   6. ZERO text stored anywhere in SQLite (scan every cell of every table)
 *
 * Total model spend is kept well under $0.02 (fast mode, ~160 words).
 */
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

const BASE = process.argv[2] ?? "http://localhost:3100";
const DB_PATH = process.env.DATABASE_PATH ?? path.resolve(process.cwd(), "proseflow.db");

const results = [];
function check(name, cond, detail = "") {
  const ok = Boolean(cond);
  results.push({ name, ok, detail });
  const mark = ok ? "PASS" : "FAIL";
  console.log(`  [${mark}] ${name}${detail ? ` — ${detail}` : ""}`);
}

// ---- Load ~120 words of the reference AI sample ---------------------------
const conv03 = fs.readFileSync(path.resolve(process.cwd(), "reference/conv03.txt"), "utf8");
const paras = conv03.split(/\n\s*\n+/).filter(Boolean);
const SAMPLE_WORDS = [...paras[0].split(/\s+/)];
// first paragraph (~104 words) + enough words of the second to reach ~120
let SAMPLE = SAMPLE_WORDS.slice(0, 104).join(" ");
const remaining = 120 - SAMPLE_WORDS.slice(0, 104).length;
if (remaining > 0) {
  SAMPLE += " " + paras[1].split(/\s+/).slice(0, remaining).join(" ");
}
const sampleWordCount = SAMPLE.split(/\s+/).filter(Boolean).length;

const MARKER = "Smash Brahminical Patriarchy"; // unique string from the sample
const API_SAMPLE =
  "The quarterly review demonstrated that operational efficiency improved by a significant margin. However, it is of paramount importance to note that these results must be contextualized appropriately.";
const apiSampleWords = API_SAMPLE.split(/\s+/).filter(Boolean).length;

async function main() {
  console.log(`ProseFlow E2E smoke test → ${BASE}`);
  console.log(`Sample: ${sampleWordCount} words (SSE) + ${apiSampleWords} words (API)\n`);

  let cookie = "";

  // ---- 0. Health ----
  console.log("0. Health check");
  const health = await fetch(`${BASE}/api/health`);
  const healthJson = await health.json();
  check("GET /api/health returns 200", health.status === 200);
  check("database reachable", healthJson.db === true);
  check(
    "Cerebellum model reachable",
    healthJson.model?.reachable === true,
    String(healthJson.model?.detail ?? ""),
  );

  // ---- 1. Signup ----
  console.log("\n1. Signup + free credits");
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@proseflow.test`;
  const signup = await fetch(`${BASE}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "e2e-password-123" }),
  });
  const signupJson = await signup.json();
  cookie = (signup.headers.get("set-cookie") ?? "").split(";")[0];
  check("signup returns 200 with user", signup.status === 200 && signupJson.user?.id > 0);
  check("session cookie set (HttpOnly)", cookie.startsWith("pf_session="));

  const me1 = await fetch(`${BASE}/api/auth/me`, { headers: { cookie } });
  const me1Json = await me1.json();
  check("me: free plan", me1Json.user?.plan === "free");
  check("me: 500 free credits granted", me1Json.credits?.balance === 500, `balance=${me1Json.credits?.balance}`);

  // ---- 2. SSE streaming rewrite (live model, fast mode) ----
  console.log("\n2. SSE streaming rewrite against live jamsaq-v1 (fast mode, 3 rounds)");
  const t0 = Date.now();
  const sseRes = await fetch(`${BASE}/api/rewrite`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify({ text: SAMPLE, mode: "fast", creativity: "natural", versions: 1 }),
  });
  if (!sseRes.ok || !sseRes.body) {
    const errText = await sseRes.text().catch(() => "");
    check("SSE endpoint reachable", false, `HTTP ${sseRes.status}: ${errText.slice(0, 200)}`);
    throw new Error("SSE rewrite failed");
  }
  check("SSE endpoint streams (text/event-stream)", sseRes.headers.get("content-type").includes("text/event-stream"));

  const events = [];
  const outputParagraphs = [];
  const reader = sseRes.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf("\n\n")) !== -1) {
      const line = buf.slice(0, i);
      buf = buf.slice(i + 2);
      if (!line.startsWith("data: ")) continue;
      const ev = JSON.parse(line.slice(6));
      events.push(ev);
      if (ev.type === "block" && !ev.passthrough) outputParagraphs.push(ev.text);
    }
  }
  const types = events.map((e) => e.type);
  const doneEv = events.find((e) => e.type === "done");
  check("SSE start event first", types[0] === "start");
  check("SSE progress events streamed live", types.includes("progress"), `${types.filter((t) => t === "progress").length} round updates`);
  check("SSE block events streamed", types.includes("block"), `${outputParagraphs.length} blocks`);
  check("SSE fidelity (version_done) present", types.includes("version_done"));
  check("SSE done event last", types[types.length - 1] === "done");
  const rewritten = outputParagraphs.join("\n\n");
  check("rewritten output is non-trivial", rewritten.split(/\s+/).length >= Math.floor(sampleWordCount * 0.6), `${rewritten.split(/\s+/).length} words out`);
  check("output differs from input", rewritten !== SAMPLE);
  check("credits deducted on done", doneEv?.credits_used === sampleWordCount, `used=${doneEv?.credits_used}`);
  check(
    "balance after rewrite correct",
    doneEv?.balance === 500 - sampleWordCount,
    `balance=${doneEv?.balance} (expected ${500 - sampleWordCount})`,
  );
  const fid = doneEv?.fidelity?.A;
  check(
    "Fidelity Shield report attached",
    fid && typeof fid.phrases_rebuilt_pct === "number" && fid.original_words === sampleWordCount,
    `rebuilt=${fid?.phrases_rebuilt_pct}%`,
  );
  console.log(`   elapsed: ${((Date.now() - t0) / 1000).toFixed(1)}s`);

  // ---- 3. Simulator upgrade to Business (needed for API keys) ----
  console.log("\n3. Dev billing simulator → Business & API plan");
  const sim = await fetch(`${BASE}/api/billing/simulate/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify({ plan: "business", interval: "monthly" }),
  });
  const simJson = await sim.json();
  check("simulator upgrade applied", sim.status === 200 && simJson.applied === true);
  check("250,000 words granted", simJson.words_granted === 250_000);
  check("balance after upgrade", simJson.balance === 500 - sampleWordCount + 250_000, `balance=${simJson.balance}`);

  // ---- 4. API key + public REST API ----
  console.log("\n4. API key + /api/v1/rewrite (Bearer auth, live model)");
  const keyRes = await fetch(`${BASE}/api/keys`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie },
    body: "{}",
  });
  const keyJson = await keyRes.json();
  check("API key created (pf_sk_...)", keyRes.status === 201 && keyJson.key?.startsWith("pf_sk_"));

  const apiRes = await fetch(`${BASE}/api/v1/rewrite`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${keyJson.key}` },
    body: JSON.stringify({ text: API_SAMPLE, mode: "fast", creativity: "balanced" }),
  });
  const apiJson = await apiRes.json();
  check("v1 rewrite returns 200 JSON", apiRes.status === 200 && typeof apiJson.text === "string");
  check("v1 rewrite output non-trivial", apiJson.text.split(/\s+/).length >= Math.floor(apiSampleWords * 0.6));
  check("v1 fidelity report included", typeof apiJson.fidelity?.phrases_rebuilt_pct === "number");
  check(
    "v1 credits deducted",
    apiJson.credits_used === apiSampleWords &&
      apiJson.credits_remaining === 500 - sampleWordCount + 250_000 - apiSampleWords,
    `remaining=${apiJson.credits_remaining}`,
  );

  const badAuth = await fetch(`${BASE}/api/v1/rewrite`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer pf_sk_invalid_key" },
    body: JSON.stringify({ text: "x" }),
  });
  check("v1 rejects invalid keys with 401", badAuth.status === 401);

  // ---- 5. .docx round-trip ----
  console.log("\n5. .docx export → extract round-trip");
  const exportBlocks = [
    { type: "heading", level: 1, text: "E2E Round Trip" },
    { type: "paragraph", text: API_SAMPLE },
    { type: "heading", level: 2, text: "Notes" },
    { type: "paragraph", text: rewritten.slice(0, 300) },
  ];
  const exportRes = await fetch(`${BASE}/api/docx/export`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify({ blocks: exportBlocks }),
  });
  check("docx export returns a Word file", exportRes.status === 200 && exportRes.headers.get("content-type").includes("wordprocessingml"));
  const docxBlob = await exportRes.arrayBuffer();
  check("exported file is a real zip/docx (>2KB)", docxBlob.byteLength > 2000, `${docxBlob.byteLength} bytes`);

  const form = new FormData();
  form.append("file", new Blob([docxBlob]), "round-trip.docx");
  const extractRes = await fetch(`${BASE}/api/docx/extract`, { method: "POST", headers: { cookie }, body: form });
  const extractJson = await extractRes.json();
  check("docx extract parses the exported file", extractRes.status === 200 && extractJson.blocks?.length === exportBlocks.length);
  const textsMatch =
    (extractJson.blocks ?? []).every((b, i) => b.text === exportBlocks[i].text) &&
    (extractJson.blocks ?? []).every((b, i) => b.type === exportBlocks[i].type);
  check("docx round-trip preserves text + structure", textsMatch);
  check("docx words counted", typeof extractJson.words === "number" && extractJson.words > 30, `words=${extractJson.words}`);

  // ---- 6. Zero-text-retention in SQLite ----
  console.log("\n6. Zero-text-retention audit of SQLite");
  const db = new DatabaseSync(DB_PATH, { readOnly: true });
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    .all()
    .map((r) => r.name);
  let markerHits = [];
  let anySampleHit = [];
  const needle2 = "chief executive of Twitter";
  for (const t of tables) {
    const rows = db.prepare(`SELECT * FROM ${t}`).all();
    for (const row of rows) {
      for (const [col, val] of Object.entries(row)) {
        if (typeof val !== "string") continue;
        if (val.includes(MARKER)) markerHits.push(`${t}.${col}`);
        if (val.includes(needle2)) anySampleHit.push(`${t}.${col}`);
      }
    }
  }
  const userRow = db.prepare("SELECT id, email, plan FROM users WHERE email = ?").get(email);
  const ledger = db.prepare("SELECT delta, reason FROM credit_ledger WHERE user_id = ? ORDER BY id").all(userRow?.id);
  const events_ = db
    .prepare("SELECT word_count, rounds, mode, elapsed_ms, phrases_rebuilt_pct FROM rewrite_events WHERE user_id = ? ORDER BY id")
    .all(userRow?.id);
  const billing = db.prepare("SELECT provider, event_type, words_granted FROM billing_events WHERE user_id = ?").all(userRow?.id);
  db.close();

  check("no rewrite text stored in ANY table (marker 1)", markerHits.length === 0, markerHits.join(", ") || "clean");
  check("no rewrite text stored in ANY table (marker 2)", anySampleHit.length === 0, anySampleHit.join(", ") || "clean");
  check("user upgraded to business plan", userRow?.plan === "business");
  const signupGrant = ledger.some((r) => r.reason === "signup_free_grant" && r.delta === 500);
  const planGrant = ledger.some((r) => r.reason.startsWith("plan_purchase:business") && r.delta === 250_000);
  const deductions = ledger.filter((r) => r.delta < 0);
  check("ledger: signup grant + plan grant recorded", signupGrant && planGrant);
  check(
    "ledger: both rewrites deducted",
    deductions.length === 2 &&
      deductions[0].delta === -sampleWordCount &&
      deductions[1].delta === -apiSampleWords,
    JSON.stringify(deductions),
  );
  check(
    "rewrite_events: anonymous metrics only (word_count, rounds, mode, ms, rebuilt%)",
    events_.length === 2 &&
      events_.every(
        (e) =>
          e.word_count > 0 &&
          e.rounds === 3 &&
          e.mode === "fast" &&
          e.elapsed_ms > 0 &&
          e.phrases_rebuilt_pct !== null,
      ),
    JSON.stringify(events_),
  );
  check("billing_events: simulator purchase logged", billing.length === 1 && billing[0].provider === "simulator");

  // ---- Summary ----
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${failed.length === 0 ? "ALL CHECKS PASSED" : "E2E FAILED"}: ${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("E2E crashed:", err);
  process.exitCode = 1;
});
