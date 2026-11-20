import { NextResponse } from "next/server";
import { issueSession, login, setSessionCookie } from "@/lib/auth";
import { authLimiter, clientIp, rateLimitResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const rl = authLimiter.check(`login:${clientIp(request)}`);
  if (!rl.allowed) return rateLimitResponse(rl);

  let body: { email?: string; password?: string };
  try {
    body = (await request.json()) as { email?: string; password?: string };
  } catch {
    return NextResponse.json({ error: "invalid_json", error_message: "Invalid JSON body." }, { status: 400 });
  }
  if (!body.email || !body.password) {
    return NextResponse.json(
      { error: "missing_fields", error_message: "Email and password are required." },
      { status: 400 },
    );
  }

  try {
    const { user } = login(body.email, body.password);
    const session = issueSession(user.id);
    const res = NextResponse.json(
      { ok: true, user: { id: user.id, email: user.email, plan: user.plan } },
      { headers: { "Cache-Control": "no-store" } },
    );
    res.headers.append("Set-Cookie", setSessionCookie(session.cookieValue, session.expires));
    return res;
  } catch {
    // Deliberately generic message — don't leak which field was wrong.
    return NextResponse.json(
      { error: "invalid_credentials", error_message: "Invalid email or password." },
      { status: 401 },
    );
  }
}
