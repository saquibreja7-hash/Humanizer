import { describe, expect, it } from "vitest";
import { RateLimiter } from "@/lib/rate-limit";

describe("rate limiter", () => {
  it("allows up to max hits inside the window and blocks after", () => {
    const rl = new RateLimiter(3, 10_000);
    expect(rl.check("ip:1").allowed).toBe(true);
    expect(rl.check("ip:1").allowed).toBe(true);
    expect(rl.check("ip:1").allowed).toBe(true);
    const blocked = rl.check("ip:1");
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it("tracks keys independently", () => {
    const rl = new RateLimiter(1, 10_000);
    expect(rl.check("key:a").allowed).toBe(true);
    expect(rl.check("key:b").allowed).toBe(true);
    expect(rl.check("key:a").allowed).toBe(false);
    expect(rl.check("key:b").allowed).toBe(false);
  });

  it("frees the window as time passes", async () => {
    const rl = new RateLimiter(2, 60);
    expect(rl.check("k").allowed).toBe(true);
    expect(rl.check("k").allowed).toBe(true);
    expect(rl.check("k").allowed).toBe(false);
    await new Promise((r) => setTimeout(r, 80));
    expect(rl.check("k").allowed).toBe(true);
  });

  it("reports remaining quota", () => {
    const rl = new RateLimiter(3, 10_000);
    expect(rl.check("r").remaining).toBe(2);
    expect(rl.check("r").remaining).toBe(1);
    expect(rl.check("r").remaining).toBe(0);
  });
});
