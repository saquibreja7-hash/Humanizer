import { NextResponse } from "next/server";
import { clearSessionCookie, destroySession, sessionCookieFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  destroySession(sessionCookieFromRequest(request));
  const res = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  res.headers.append("Set-Cookie", clearSessionCookie());
  return res;
}
