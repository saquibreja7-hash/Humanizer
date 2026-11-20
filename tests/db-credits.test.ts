import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { setupTestDb, cleanupTestDb } from "./helpers";
import {
  createUser,
  deductCredits,
  getBalance,
  grantCredits,
  listLedger,
  recordBillingEventOnce,
  recordRewriteEvent,
  rewriteStats,
  getDb,
  wordsUsedSince,
  setPlan,
} from "@/lib/db";
import { hashPassword } from "@/lib/auth";

let dbFile: string;

beforeAll(() => {
  dbFile = setupTestDb("credits");
});

afterAll(() => {
  cleanupTestDb(dbFile);
});

const SECRET_MARKER = "MARKER_never_store_this_sentence_anywhere_in_the_database";

describe("word-credit ledger", () => {
  it("grants and deducts credits with a running balance", () => {
    const u = createUser("credits@example.com", hashPassword("password123"));
    grantCredits(u.id, 500, "signup_free_grant");
    expect(getBalance(u.id)).toBe(500);
    deductCredits(u.id, 120, "rewrite:standard");
    deductCredits(u.id, 80, "rewrite:fast");
    expect(getBalance(u.id)).toBe(300);
  });

  it("refuses overdrafts atomically", () => {
    const u = createUser("overdraft@example.com", hashPassword("password123"));
    grantCredits(u.id, 100, "grant");
    expect(() => deductCredits(u.id, 150, "rewrite:standard")).toThrow(/insufficient_credits/);
    expect(getBalance(u.id)).toBe(100); // untouched by the failed attempt
  });

  it("records anonymous rewrite metrics only", () => {
    const u = createUser("events@example.com", hashPassword("password123"));
    grantCredits(u.id, 1000, "grant");
    const ev = recordRewriteEvent({
      userId: u.id,
      wordCount: 123,
      rounds: 5,
      mode: "standard",
      elapsedMs: 8500,
      phrasesRebuiltPct: 91.4,
    });
    expect(ev.word_count).toBe(123);
    expect(ev.rounds).toBe(5);
    expect(ev.mode).toBe("standard");
    expect(ev.phrases_rebuilt_pct).toBe(91.4);
    expect(Object.keys(ev).join(",")).not.toContain("text");
    const stats = rewriteStats(u.id);
    expect(stats.calls).toBe(1);
    expect(stats.total_words).toBe(123);
  });

  it("computes monthly usage from the ledger", () => {
    const u = createUser("usage@example.com", hashPassword("password123"));
    grantCredits(u.id, 10000, "grant");
    deductCredits(u.id, 250, "rewrite:standard");
    deductCredits(u.id, 120, "api_rewrite:fast");
    const monthStart = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    expect(wordsUsedSince(u.id, monthStart)).toBe(370);
    expect(listLedger(u.id)).toHaveLength(3);
  });

  it("applies billing events exactly once (webhook idempotency)", () => {
    const u = createUser("billing@example.com", hashPassword("password123"));
    const first = recordBillingEventOnce({
      provider: "dodo",
      event_id: "evt_123",
      user_id: u.id,
      plan: "pro",
      billing_interval: "monthly",
      words_granted: 75000,
      amount_minor: 1900,
      currency: "USD",
      event_type: "payment.succeeded",
    });
    const second = recordBillingEventOnce({
      provider: "dodo",
      event_id: "evt_123",
      user_id: u.id,
      plan: "pro",
      billing_interval: "monthly",
      words_granted: 75000,
      amount_minor: 1900,
      currency: "USD",
      event_type: "payment.succeeded",
    });
    expect(first).toBe(true);
    expect(second).toBe(false);
    expect(getBalance(u.id)).toBe(0); // words granted via applyPlanPurchase, not raw insert
    setPlan(u.id, "pro");
  });
});

describe("zero-text-retention guarantee", () => {
  it("never stores user text in ANY table (schema-level check)", () => {
    const db = getDb();
    const tables = (db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
      .all() as Array<{ name: string }>).map((r) => r.name);
    expect(tables.sort()).toEqual(
      ["api_keys", "billing_events", "credit_ledger", "rewrite_events", "sessions", "users"].sort(),
    );
    for (const t of tables) {
      const cols = (
        db.prepare(`PRAGMA table_info(${t})`).all() as Array<{ name: string; type: string }>
      ).map((c) => c.name.toLowerCase());
      // No column may hold free text: the only TEXT columns are enumerated
      // identifiers (emails, hashes, plan ids, reasons, timestamps).
      for (const col of cols) {
        expect(col).not.toMatch(/(body|content|document|draft|prompt|source|target|output|input)/);
      }
    }
  });

  it("never persists a sensitive sentence run through the full pipeline", () => {
    const u = createUser("privacy@example.com", hashPassword("password123"));
    grantCredits(u.id, 500, "grant");
    deductCredits(u.id, 111, "rewrite:standard");
    recordRewriteEvent({
      userId: u.id,
      wordCount: 111,
      rounds: 5,
      mode: "standard",
      elapsedMs: 9000,
      phrasesRebuiltPct: 88.8,
    });
    recordBillingEventOnce({
      provider: "simulator",
      event_id: "sim_x",
      user_id: u.id,
      plan: "starter",
      billing_interval: "monthly",
      words_granted: 20000,
      amount_minor: 900,
      currency: "USD",
      event_type: "payment.succeeded",
    });

    // Scan EVERY cell of EVERY table for the marker sentence.
    const db = getDb();
    const tables = (db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
      .all() as Array<{ name: string }>).map((r) => r.name);
    let found: string | null = null;
    for (const t of tables) {
      const rows = db.prepare(`SELECT * FROM ${t}`).all() as Array<Record<string, unknown>>;
      for (const row of rows) {
        for (const [k, v] of Object.entries(row)) {
          if (typeof v === "string" && v.includes(SECRET_MARKER)) {
            found = `${t}.${k}`;
            break;
          }
        }
      }
    }
    expect(found).toBeNull();
  });
});
