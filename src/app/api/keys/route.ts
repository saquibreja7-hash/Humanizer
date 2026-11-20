/**
 * /api/keys — list, create, and revoke pf_sk_... REST API keys.
 * GET    → list keys (masked) + usage stats
 * POST   → create key (returns the full key ONCE)
 * DELETE → revoke by id (?id=... or JSON body)
 */
import { NextResponse } from "next/server";
import { requireAuth, authErrorResponse } from "@/lib/api-helpers";
import { generateApiKey } from "@/lib/auth";
import { apiKeyUsage, createApiKey, listApiKeys, revokeApiKey } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = requireAuth(request);
  if (!ctx) return authErrorResponse();
  const keys = listApiKeys(ctx.user.id).map((k) => ({
    id: k.id,
    prefix: `${k.prefix}...`,
    created_at: k.created_at,
    revoked_at: k.revoked_at,
  }));
  return NextResponse.json(
    { keys, usage: apiKeyUsage(ctx.user.id) },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  const ctx = requireAuth(request);
  if (!ctx) return authErrorResponse();

  if (!ctx.plan.apiAccess) {
    return NextResponse.json(
      {
        error: "plan_limit",
        error_message: "REST API keys are available on the Business & API plan.",
      },
      { status: 403 },
    );
  }

  const active = listApiKeys(ctx.user.id).filter((k) => !k.revoked_at).length;
  if (active >= 10) {
    return NextResponse.json(
      { error: "key_limit", error_message: "You can have at most 10 active API keys." },
      { status: 429 },
    );
  }

  const { fullKey, hash, prefix } = generateApiKey();
  const row = createApiKey(ctx.user.id, hash, prefix);
  return NextResponse.json(
    {
      key: fullKey, // shown exactly once — only a hash is stored
      id: row.id,
      prefix: row.prefix,
      created_at: row.created_at,
    },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}

export async function DELETE(request: Request) {
  const ctx = requireAuth(request);
  if (!ctx) return authErrorResponse();

  let keyId: number | undefined;
  const url = new URL(request.url);
  const fromQuery = url.searchParams.get("id");
  if (fromQuery) {
    keyId = Number(fromQuery);
  } else {
    try {
      const body = (await request.json()) as { id?: number };
      keyId = Number(body?.id);
    } catch {
      keyId = undefined;
    }
  }
  if (!Number.isInteger(keyId) || (keyId ?? 0) <= 0) {
    return NextResponse.json(
      { error: "missing_id", error_message: "Provide the key id to revoke." },
      { status: 400 },
    );
  }
  const ok = revokeApiKey(ctx.user.id, keyId!);
  if (!ok) {
    return NextResponse.json(
      { error: "not_found", error_message: "Key not found or already revoked." },
      { status: 404 },
    );
  }
  return NextResponse.json({ ok: true, revoked: keyId }, { headers: { "Cache-Control": "no-store" } });
}
