/**
 * Shared helpers for API route handlers: JSON responses, auth extraction,
 * plan-feature enforcement, and rewrite-option parsing.
 */
import { NextResponse } from "next/server";
import {
  CREATIVITY_TEMPERATURE,
  MODE_ROUNDS,
  PLANS,
  type Currency,
  type PlanId,
} from "./brand";
import { userFromRequest } from "./auth";
import { getBalance, type UserRow } from "./db";
import type { Creativity, RewriteMode } from "./hip-engine";

export function json(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data as Record<string, unknown>, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export function errorJson(message: string, status = 400, code?: string): NextResponse {
  return NextResponse.json(
    { error: code ?? snake(message), error_message: message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

function snake(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

export interface AuthedContext {
  user: UserRow;
  apiKeyId: number | null;
  plan: (typeof PLANS)[PlanId];
  balance: number;
}

/** Resolve the authenticated user (session cookie or Bearer pf_sk_ key). */
export function requireAuth(request: Request): AuthedContext | null {
  const hit = userFromRequest(request);
  if (!hit) return null;
  const plan = PLANS[(hit.user.plan as PlanId) ?? "free"] ?? PLANS.free;
  return { user: hit.user, apiKeyId: hit.keyId ?? null, plan, balance: getBalance(hit.user.id) };
}

export function authErrorResponse(): NextResponse {
  return NextResponse.json(
    { error: "unauthorized", error_message: "Sign in or provide a valid API key." },
    { status: 401, headers: { "Cache-Control": "no-store" } },
  );
}

export interface RewriteOptions {
  mode: RewriteMode;
  creativity: Creativity;
  rounds: number;
  temperature: number;
  versions: 1 | 2;
}

export function parseRewriteOptions(
  body: Record<string, unknown>,
  plan: (typeof PLANS)[PlanId],
): { options: RewriteOptions; error?: never } | { options?: never; error: string } {
  const mode = (body.mode === "fast" || body.mode === "standard" || body.mode === "deep"
    ? body.mode
    : "standard") as RewriteMode;
  const creativity = (body.creativity === "balanced" || body.creativity === "natural"
    ? body.creativity
    : "natural") as Creativity;
  const versions = body.versions === 2 ? 2 : 1;

  if (!plan.modes.includes(mode)) {
    return { error: `The ${mode} mode is not available on the ${plan.name} plan.` };
  }
  if (versions === 2 && !plan.dualVersions) {
    return { error: `Option A/B dual versions require the Pro plan.` };
  }

  return {
    options: {
      mode,
      creativity,
      rounds: MODE_ROUNDS[mode],
      temperature: CREATIVITY_TEMPERATURE[creativity],
      versions,
    },
  };
}

export function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

export function resolveCurrency(value: unknown): Currency {
  return value === "INR" ? "INR" : "USD";
}
