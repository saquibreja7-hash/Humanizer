/**
 * In-memory sliding-window rate limiter (per IP and per API key).
 * Single-instance deployments only; swap for Redis when scaling out.
 */

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

export class RateLimiter {
  private readonly windowMs: number;
  private readonly max: number;
  private hits = new Map<string, number[]>();

  constructor(max: number, windowMs: number) {
    this.max = max;
    this.windowMs = windowMs;
  }

  check(key: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    let stamps = this.hits.get(key);
    if (!stamps) {
      stamps = [];
      this.hits.set(key, stamps);
    }
    const fresh = stamps.filter((t) => t > windowStart);
    if (fresh.length >= this.max) {
      const retryAfterMs = fresh[0] + this.windowMs - now;
      stamps.length = 0;
      stamps.push(...fresh);
      return { allowed: false, remaining: 0, retryAfterMs };
    }
    fresh.push(now);
    stamps.length = 0;
    stamps.push(...fresh);
    if (this.hits.size > 10_000) {
      // opportunistic cleanup to bound memory
      for (const [k, v] of this.hits) {
        if (v.length === 0 || v[v.length - 1] <= windowStart) this.hits.delete(k);
      }
    }
    return { allowed: true, remaining: this.max - fresh.length, retryAfterMs: 0 };
  }
}

/** Rewrite endpoint limits: per-IP for session users. */
export const sessionRewriteLimiter = new RateLimiter(12, 60_000);
/** Per-API-key limits (Business plan). */
export const apiRewriteLimiter = new RateLimiter(60, 60_000);
/** Auth endpoints (signup/login brute-force guard). */
export const authLimiter = new RateLimiter(10, 60_000);

export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "local";
}

export function rateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({ error: "rate_limited", retry_after_ms: result.retryAfterMs }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": Math.ceil(result.retryAfterMs / 1000).toString(),
      },
    },
  );
}
