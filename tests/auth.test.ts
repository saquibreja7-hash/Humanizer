import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { setupTestDb, cleanupTestDb } from "./helpers";
import {
  hashPassword,
  verifyPassword,
  issueSession,
  parseSessionCookie,
  userFromSessionCookie,
  generateApiKey,
  validateApiKey,
  signup,
  login,
  destroySession,
  setSessionCookie,
  clearSessionCookie,
  readCookies,
} from "@/lib/auth";
import {
  createApiKey,
  createUser,
  getUserByEmail,
  revokeApiKey,
} from "@/lib/db";

let dbFile: string;

beforeAll(() => {
  dbFile = setupTestDb("auth");
});

afterAll(() => {
  cleanupTestDb(dbFile);
});

describe("password hashing (scrypt)", () => {
  it("hashes and verifies passwords", () => {
    const hash = hashPassword("correct horse battery staple");
    expect(hash.startsWith("scrypt:")).toBe(true);
    expect(verifyPassword("correct horse battery staple", hash)).toBe(true);
    expect(verifyPassword("wrong password entirely", hash)).toBe(false);
  });

  it("salts every hash differently", () => {
    const a = hashPassword("same password 1");
    const b = hashPassword("same password 1");
    expect(a).not.toBe(b);
  });

  it("rejects short passwords at hash time", () => {
    expect(() => hashPassword("short")).toThrow(/at least 8/);
  });

  it("does not crash on malformed stored hashes", () => {
    expect(verifyPassword("x", "garbage")).toBe(false);
    expect(verifyPassword("x", "")).toBe(false);
  });
});

describe("session cookies", () => {
  it("round-trips a signed session cookie", () => {
    const user = createUser("sess@example.com", hashPassword("password123"));
    const { cookieValue } = issueSession(user.id);
    expect(parseSessionCookie(cookieValue)).toBe(parseSessionCookie(cookieValue));
    const u = userFromSessionCookie(cookieValue);
    expect(u?.id).toBe(user.id);
    expect(u?.email).toBe("sess@example.com");
  });

  it("rejects tampered cookies", () => {
    const user = createUser("tamper@example.com", hashPassword("password123"));
    const { cookieValue } = issueSession(user.id);
    const flipped = cookieValue.slice(0, -3) + (cookieValue.endsWith("aaa") ? "bbb" : "aaa");
    expect(userFromSessionCookie(flipped)).toBeNull();
    expect(userFromSessionCookie("no-dot")).toBeNull();
    expect(userFromSessionCookie(undefined)).toBeNull();
  });

  it("destroySession invalidates the session", () => {
    const user = createUser("destroy@example.com", hashPassword("password123"));
    const { cookieValue } = issueSession(user.id);
    expect(userFromSessionCookie(cookieValue)).not.toBeNull();
    destroySession(cookieValue);
    expect(userFromSessionCookie(cookieValue)).toBeNull();
  });

  it("sets HttpOnly, SameSite cookies and clears them", () => {
    const user = createUser("cookie@example.com", hashPassword("password123"));
    const { cookieValue, expires } = issueSession(user.id);
    const set = setSessionCookie(cookieValue, expires);
    expect(set).toContain("HttpOnly");
    expect(set).toContain("SameSite=Lax");
    expect(set).toContain("Expires=");
    const clear = clearSessionCookie();
    expect(clear).toContain("Max-Age=0");
    const jar = readCookies(`a=1; pf_session=${cookieValue}`);
    expect(jar.get("pf_session")).toBe(cookieValue);
  });
});

describe("API keys (pf_sk_...)", () => {
  it("generates, validates, and revokes keys", () => {
    const user = createUser("keys@example.com", hashPassword("password123"));
    const { fullKey, hash, prefix } = generateApiKey();
    expect(fullKey.startsWith("pf_sk_")).toBe(true);
    expect(fullKey.length).toBeGreaterThan(30);
    expect(hash).toHaveLength(64); // sha256 hex
    expect(prefix).toBe(fullKey.slice(0, 12));

    createApiKey(user.id, hash, prefix);
    const hit = validateApiKey(fullKey);
    expect(hit?.user.id).toBe(user.id);
    expect(hit?.keyId).toBeGreaterThan(0);

    revokeApiKey(user.id, hit!.keyId);
    expect(validateApiKey(fullKey)).toBeNull();
  });

  it("rejects non-pf_sk bearer tokens", () => {
    expect(validateApiKey("sk_live_totally_real")).toBeNull();
    expect(validateApiKey("")).toBeNull();
  });
});

describe("signup / login flows", () => {
  it("signs up and refuses duplicate emails", () => {
    const { user } = signup("newuser@example.com", "password123");
    expect(user.email).toBe("newuser@example.com");
    expect(() => signup("newuser@example.com", "password123")).toThrow(/already exists/);
  });

  it("logs in with valid credentials and rejects bad ones", () => {
    login("newuser@example.com", "password123");
    expect(() => login("newuser@example.com", "wrongpassword")).toThrow(/Invalid email or password/);
    expect(() => login("ghost@example.com", "password123")).toThrow(/Invalid email or password/);
  });

  it("normalizes email case", () => {
    const { user } = signup("CaseTest@Example.COM", "password123");
    expect(user.email).toBe("casetest@example.com");
    expect(getUserByEmail("casetest@example.com")?.id).toBe(user.id);
  });

  it("validates email format", () => {
    expect(() => signup("not-an-email", "password123")).toThrow(/valid email/);
  });
});
