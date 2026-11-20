/**
 * SQLite repository layer (Node 22 built-in `node:sqlite` — zero native deps).
 *
 * ZERO-TEXT-RETENTION POLICY (see /privacy):
 * No table ever stores user input text or rewritten output text. Only
 * anonymous word counts, timestamps, plan info, and fidelity metrics persist.
 */
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { env } from "./env";

export interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  plan: string;
  subscription_id: string | null;
  subscription_provider: string | null;
  created_at: string;
}

export interface SessionRow {
  id: string; // sha256 of the raw session token
  user_id: number;
  created_at: string;
  expires_at: string;
}

export interface ApiKeyRow {
  id: number;
  user_id: number;
  key_hash: string;
  prefix: string;
  created_at: string;
  revoked_at: string | null;
}

export interface LedgerRow {
  id: number;
  user_id: number;
  delta: number;
  reason: string;
  created_at: string;
}

export interface RewriteEventRow {
  id: number;
  user_id: number;
  api_key_id: number | null;
  word_count: number;
  rounds: number;
  mode: string;
  elapsed_ms: number;
  phrases_rebuilt_pct: number | null;
  created_at: string;
}

export interface BillingEventRow {
  id: number;
  provider: string;
  event_id: string; // provider event id — used for idempotent webhook handling
  user_id: number;
  plan: string;
  billing_interval: string;
  words_granted: number;
  amount_minor: number;
  currency: string;
  event_type: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Connection management
// ---------------------------------------------------------------------------

const dbCache = new Map<string, DatabaseSync>();

export function getDb(dbPath?: string): DatabaseSync {
  const file = path.resolve(dbPath ?? env.databasePath);
  let db = dbCache.get(file);
  if (db) return db;
  db = new DatabaseSync(file);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  migrate(db);
  dbCache.set(file, db);
  return db;
}

/** Close and forget all cached connections (used by tests and graceful stop). */
export function closeAllDbs(): void {
  for (const db of dbCache.values()) {
    try {
      db.exec("PRAGMA wal_checkpoint(TRUNCATE);");
      db.close();
    } catch {
      // ignore
    }
  }
  dbCache.clear();
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  subscription_id TEXT,
  subscription_provider TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS api_keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL UNIQUE,
  prefix TEXT NOT NULL,
  created_at TEXT NOT NULL,
  revoked_at TEXT
);

CREATE TABLE IF NOT EXISTS credit_ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rewrite_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  api_key_id INTEGER REFERENCES api_keys(id) ON DELETE SET NULL,
  word_count INTEGER NOT NULL,
  rounds INTEGER NOT NULL,
  mode TEXT NOT NULL,
  elapsed_ms INTEGER NOT NULL,
  phrases_rebuilt_pct REAL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS billing_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL,
  event_id TEXT NOT NULL UNIQUE,
  user_id INTEGER NOT NULL,
  plan TEXT NOT NULL,
  billing_interval TEXT NOT NULL,
  words_granted INTEGER NOT NULL,
  amount_minor INTEGER NOT NULL,
  currency TEXT NOT NULL,
  event_type TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ledger_user ON credit_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_events_user ON rewrite_events(user_id);
CREATE INDEX IF NOT EXISTS idx_apikeys_user ON api_keys(user_id);
`;

function migrate(db: DatabaseSync): void {
  db.exec(SCHEMA);
}

function now(): string {
  return new Date().toISOString();
}

// ---------------------------------------------------------------------------
// Users & sessions
// ---------------------------------------------------------------------------

export function createUser(email: string, passwordHash: string): UserRow {
  const db = getDb();
  const res = db
    .prepare("INSERT INTO users (email, password_hash, plan, created_at) VALUES (?, ?, 'free', ?)")
    .run(email.trim().toLowerCase(), passwordHash, now());
  return getUserById(Number(res.lastInsertRowid))!;
}

export function getUserByEmail(email: string): UserRow | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM users WHERE email = ?").get(email.trim().toLowerCase());
  return (row as unknown as UserRow) ?? null;
}

export function getUserById(id: number): UserRow | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
  return (row as unknown as UserRow) ?? null;
}

export function setPlan(userId: number, plan: string): void {
  const db = getDb();
  db.prepare("UPDATE users SET plan = ? WHERE id = ?").run(plan, userId);
}

export function setSubscription(
  userId: number,
  provider: string | null,
  subscriptionId: string | null,
): void {
  const db = getDb();
  db.prepare("UPDATE users SET subscription_provider = ?, subscription_id = ? WHERE id = ?").run(
    provider,
    subscriptionId,
    userId,
  );
}

export function createSession(userId: number, sessionHash: string, ttlDays = 30): SessionRow {
  const db = getDb();
  const created = now();
  const expires = new Date(Date.now() + ttlDays * 24 * 3600 * 1000).toISOString();
  db.prepare("INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)").run(
    sessionHash,
    userId,
    created,
    expires,
  );
  return { id: sessionHash, user_id: userId, created_at: created, expires_at: expires };
}

export function getSession(sessionHash: string): SessionRow | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM sessions WHERE id = ?").get(sessionHash);
  if (!row) return null;
  const s = row as unknown as SessionRow;
  if (new Date(s.expires_at).getTime() < Date.now()) {
    db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionHash);
    return null;
  }
  return s;
}

export function deleteSession(sessionHash: string): void {
  getDb().prepare("DELETE FROM sessions WHERE id = ?").run(sessionHash);
}

export function deleteExpiredSessions(): void {
  getDb().prepare("DELETE FROM sessions WHERE expires_at < ?").run(now());
}

// ---------------------------------------------------------------------------
// API keys
// ---------------------------------------------------------------------------

export function createApiKey(userId: number, keyHash: string, prefix: string): ApiKeyRow {
  const db = getDb();
  const res = db
    .prepare("INSERT INTO api_keys (user_id, key_hash, prefix, created_at) VALUES (?, ?, ?, ?)")
    .run(userId, keyHash, prefix, now());
  return getApiKeyById(Number(res.lastInsertRowid))!;
}

export function getApiKeyById(id: number): ApiKeyRow | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM api_keys WHERE id = ?").get(id);
  return (row as unknown as ApiKeyRow) ?? null;
}

export function getApiKeyByHash(keyHash: string): ApiKeyRow | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM api_keys WHERE key_hash = ?").get(keyHash);
  return (row as unknown as ApiKeyRow) ?? null;
}

export function listApiKeys(userId: number): ApiKeyRow[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM api_keys WHERE user_id = ? ORDER BY id DESC").all(userId);
  return rows as unknown as ApiKeyRow[];
}

export function revokeApiKey(userId: number, keyId: number): boolean {
  const db = getDb();
  const res = db
    .prepare("UPDATE api_keys SET revoked_at = ? WHERE id = ? AND user_id = ? AND revoked_at IS NULL")
    .run(now(), keyId, userId);
  return res.changes > 0;
}

export function apiKeyUsage(userId: number): { total_words: number; calls: number } {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT COALESCE(SUM(word_count), 0) AS total_words, COUNT(*) AS calls
       FROM rewrite_events WHERE user_id = ? AND api_key_id IS NOT NULL`,
    )
    .get(userId);
  return row as { total_words: number; calls: number };
}

// ---------------------------------------------------------------------------
// Word-credit ledger
// ---------------------------------------------------------------------------

export function getBalance(userId: number): number {
  const db = getDb();
  const row = db
    .prepare("SELECT COALESCE(SUM(delta), 0) AS balance FROM credit_ledger WHERE user_id = ?")
    .get(userId);
  return Number((row as { balance: number | bigint }).balance ?? 0);
}

export function grantCredits(userId: number, delta: number, reason: string): void {
  if (delta <= 0) throw new Error("grantCredits requires a positive delta");
  const db = getDb();
  db.prepare("INSERT INTO credit_ledger (user_id, delta, reason, created_at) VALUES (?, ?, ?, ?)").run(
    userId,
    delta,
    reason,
    now(),
  );
}

/**
 * Atomically deduct word credits. Throws Error('insufficient_credits') when the
 * balance is too low — the caller must have pre-checked, but this is the
 * authoritative guard.
 */
export function deductCredits(userId: number, delta: number, reason: string): void {
  if (delta <= 0) throw new Error("deductCredits requires a positive delta");
  const db = getDb();
  db.exec("BEGIN IMMEDIATE");
  try {
    const row = db
      .prepare("SELECT COALESCE(SUM(delta), 0) AS balance FROM credit_ledger WHERE user_id = ?")
      .get(userId);
    const balance = Number((row as { balance: number | bigint }).balance ?? 0);
    if (balance < delta) {
      db.exec("ROLLBACK");
      throw new Error("insufficient_credits");
    }
    db.prepare("INSERT INTO credit_ledger (user_id, delta, reason, created_at) VALUES (?, ?, ?, ?)").run(
      userId,
      -delta,
      reason,
      now(),
    );
    db.exec("COMMIT");
  } catch (err) {
    try {
      db.exec("ROLLBACK");
    } catch {
      /* transaction already ended */
    }
    throw err;
  }
}

export function listLedger(userId: number, limit = 20): LedgerRow[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM credit_ledger WHERE user_id = ? ORDER BY id DESC LIMIT ?")
    .all(userId, limit);
  return rows as unknown as LedgerRow[];
}

export function wordsUsedSince(userId: number, sinceIso: string): number {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT COALESCE(SUM(-delta), 0) AS used FROM credit_ledger WHERE user_id = ? AND delta < 0 AND created_at >= ?",
    )
    .get(userId, sinceIso);
  return Number((row as { used: number | bigint }).used ?? 0);
}

// ---------------------------------------------------------------------------
// Rewrite events (metrics only — NEVER any text)
// ---------------------------------------------------------------------------

export function recordRewriteEvent(ev: {
  userId: number;
  apiKeyId?: number | null;
  wordCount: number;
  rounds: number;
  mode: string;
  elapsedMs: number;
  phrasesRebuiltPct?: number | null;
}): RewriteEventRow {
  const db = getDb();
  const res = db
    .prepare(
      `INSERT INTO rewrite_events
        (user_id, api_key_id, word_count, rounds, mode, elapsed_ms, phrases_rebuilt_pct, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      ev.userId,
      ev.apiKeyId ?? null,
      ev.wordCount,
      ev.rounds,
      ev.mode,
      ev.elapsedMs,
      ev.phrasesRebuiltPct ?? null,
      now(),
    );
  return db
    .prepare("SELECT * FROM rewrite_events WHERE id = ?")
    .get(Number(res.lastInsertRowid)) as unknown as RewriteEventRow;
}

export function rewriteStats(userId: number): {
  calls: number;
  total_words: number;
  avg_elapsed_ms: number | null;
} {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT COUNT(*) AS calls, COALESCE(SUM(word_count), 0) AS total_words,
              AVG(elapsed_ms) AS avg_elapsed_ms
       FROM rewrite_events WHERE user_id = ?`,
    )
    .get(userId);
  const r = row as { calls: number | bigint; total_words: number | bigint; avg_elapsed_ms: number | null };
  return {
    calls: Number(r.calls),
    total_words: Number(r.total_words),
    avg_elapsed_ms: r.avg_elapsed_ms === null ? null : Math.round(Number(r.avg_elapsed_ms)),
  };
}

// ---------------------------------------------------------------------------
// Billing events (idempotent webhook application)
// ---------------------------------------------------------------------------

/**
 * Records a billing event. Returns true if this provider event id was new
 * (i.e. the caller should apply its effects), false if it was already handled.
 */
export function recordBillingEventOnce(ev: Omit<BillingEventRow, "id" | "created_at">): boolean {
  const db = getDb();
  try {
    db.prepare(
      `INSERT INTO billing_events
        (provider, event_id, user_id, plan, billing_interval, words_granted, amount_minor, currency, event_type, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      ev.provider,
      ev.event_id,
      ev.user_id,
      ev.plan,
      ev.billing_interval,
      ev.words_granted,
      ev.amount_minor,
      ev.currency,
      ev.event_type,
      now(),
    );
    return true;
  } catch {
    return false; // UNIQUE(event_id) violation → already handled
  }
}

export function listBillingEvents(userId: number, limit = 20): BillingEventRow[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM billing_events WHERE user_id = ? ORDER BY id DESC LIMIT ?")
    .all(userId, limit);
  return rows as unknown as BillingEventRow[];
}
