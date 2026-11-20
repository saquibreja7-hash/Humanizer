import os from "node:os";
import path from "node:path";
import fs from "node:fs";

/**
 * Give each test file its own throwaway SQLite database so tests never touch
 * proseflow.db or each other. Must be called in beforeAll (db connections are
 * opened lazily on first use).
 */
export function setupTestDb(label: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "proseflow-test-"));
  const file = path.join(dir, `${label}.db`);
  process.env.DATABASE_PATH = file;
  process.env.SESSION_SECRET = process.env.SESSION_SECRET || "unit-test-session-secret";
  return file;
}

export function cleanupTestDb(file: string): void {
  for (const suffix of ["", "-wal", "-shm"]) {
    try {
      fs.rmSync(file + suffix, { force: true });
    } catch {
      // ignore
    }
  }
  try {
    fs.rmdirSync(path.dirname(file));
  } catch {
    // ignore
  }
}
