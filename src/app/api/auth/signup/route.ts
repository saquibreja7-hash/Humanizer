import { NextResponse } from "next/server";
import { issueSession, setSessionCookie, signup } from "@/lib/auth";
import { grantCredits } from "@/lib/db";
import { authLimiter, clientIp, rateLimitResponse } from "@/lib/rate-limit";
import { SIGNUP_CREDIT_WORDS } from "@/lib/brand";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const rl = authLimiter.check(`signup:${clientIp(request)}`);
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
    const { user } = signup(body.email, body.password);
    // Free plan: 500 words on signup.
    grantCredits(user.id, SIGNUP_CREDIT_WORDS, "signup_free_grant");
    const session = issueSession(user.id);
    const res = NextResponse.json(
      { ok: true, user: { id: user.id, email: user.email, plan: user.plan } },
      { headers: { "Cache-Control": "no-store" } },
    );
    res.headers.append("Set-Cookie", setSessionCookie(session.cookieValue, session.expires));
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Signup failed.";
    const status = message.includes("already exists") ? 409 : 400;
    return NextResponse.json({ error: "signup_failed", error_message: message }, { status });
  }
}
