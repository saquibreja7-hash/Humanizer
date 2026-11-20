/**
 * Auth: scrypt password hashing, signed HTTP-only session cookies, and
 * pf_sk_... API key verification. Session cookies carry an HMAC signature so
 * tampered tokens are rejected before any DB lookup.
 */
import crypto from "node:crypto";
import { env, isProd } from "./env";
import {
  createSession,
  createUser,
  deleteSession,
  getApiKeyByHash,
  getSession,
  getUserByEmail,
  getUserById,
  type UserRow,
} from "./db";

export const SESSION_COOKIE = "pf_session";
const SESSION_TTL_DAYS = 30;

// ---------------------------------------------------------------------------
// Password hashing (scrypt)
// ---------------------------------------------------------------------------

export function hashPassword(password: string): string {
  if (typeof password !== "string" || password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `scrypt:${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [scheme, saltHex, hashHex] = stored.split(":");
    if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
    const expected = Buffer.from(hashHex, "hex");
    const actual = crypto.scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
    return crypto.timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Session tokens: raw token only lives in the cookie; DB stores sha256(token)
// ---------------------------------------------------------------------------

function hmac(value: string): string {
  return crypto.createHmac("sha256", env.sessionSecret).update(value).digest("base64url");
}

export function issueSession(userId: number): { cookieValue: string; expires: Date } {
  const raw = crypto.randomBytes(32).toString("base64url");
  createSession(userId, sha256Hex(raw), SESSION_TTL_DAYS);
  const cookieValue = `${raw}.${hmac(raw)}`;
  return { cookieValue, expires: new Date(Date.now() + SESSION_TTL_DAYS * 24 * 3600 * 1000) };
}

export function parseSessionCookie(cookieValue: string | undefined | null): string | null {
  if (!cookieValue) return null;
  const idx = cookieValue.lastIndexOf(".");
  if (idx <= 0) return null;
  const raw = cookieValue.slice(0, idx);
  const sig = cookieValue.slice(idx + 1);
  const expected = hmac(raw);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return raw;
}

export function userFromSessionCookie(cookieValue: string | undefined | null): UserRow | null {
  const raw = parseSessionCookie(cookieValue);
  if (!raw) return null;
  const session = getSession(sha256Hex(raw));
  if (!session) return null;
  return getUserById(session.user_id);
}

export function destroySession(cookieValue: string | undefined | null): void {
  const raw = parseSessionCookie(cookieValue);
  if (raw) deleteSession(sha256Hex(raw));
}

export function sha256Hex(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

// ---------------------------------------------------------------------------
// API keys (pf_sk_...)
// ---------------------------------------------------------------------------

export const API_KEY_PREFIX = "pf_sk_";

export function generateApiKey(): { fullKey: string; hash: string; prefix: string } {
  const secret = crypto.randomBytes(24).toString("base64url");
  const fullKey = `${API_KEY_PREFIX}${secret}`;
  return { fullKey, hash: sha256Hex(fullKey), prefix: fullKey.slice(0, 12) };
}

export function validateApiKey(key: string): { user: UserRow; keyId: number } | null {
  if (!key.startsWith(API_KEY_PREFIX)) return null;
  const row = getApiKeyByHash(sha256Hex(key));
  if (!row || row.revoked_at) return null;
  const user = getUserById(row.user_id);
  if (!user) return null;
  return { user, keyId: row.id };
}

// ---------------------------------------------------------------------------
// Signup / login
// ---------------------------------------------------------------------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function signup(email: string, password: string): { user: UserRow } {
  if (!EMAIL_RE.test(email.trim())) throw new Error("Please enter a valid email address.");
  if (password.length < 8) throw new Error("Password must be at least 8 characters.");
  if (getUserByEmail(email)) throw new Error("An account with this email already exists.");
  const user = createUser(email, hashPassword(password));
  return { user };
}

export function login(email: string, password: string): { user: UserRow } {
  const user = getUserByEmail(email);
  if (!user || !verifyPassword(password, user.password_hash)) {
    throw new Error("Invalid email or password.");
  }
  return { user };
}

// ---------------------------------------------------------------------------
// Cookie helpers for route handlers
// ---------------------------------------------------------------------------

export function setSessionCookie(cookieValue: string, expires: Date): string {
  const parts = [
    `${SESSION_COOKIE}=${cookieValue}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Expires=${expires.toUTCString()}`,
  ];
  if (isProd()) parts.push("Secure");
  return parts.join("; ");
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function readCookies(header: string | null): Map<string, string> {
  const map = new Map<string, string>();
  if (!header) return map;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    map.set(part.slice(0, idx).trim(), part.slice(idx + 1).trim());
  }
  return map;
}

export function sessionCookieFromRequest(request: Request): string | undefined {
  return readCookies(request.headers.get("cookie")).get(SESSION_COOKIE);
}

export function userFromRequest(request: Request): { user: UserRow; keyId?: number } | null {
  // 1) Bearer API key
  const auth = request.headers.get("authorization") ?? "";
  if (auth.toLowerCase().startsWith("bearer ")) {
    const key = auth.slice(7).trim();
    const hit = validateApiKey(key);
    if (hit) return { user: hit.user, keyId: hit.keyId };
    return null;
  }
  // 2) Session cookie
  const user = userFromSessionCookie(sessionCookieFromRequest(request));
  if (user) return { user };
  return null;
}
