"use client";

import { Suspense, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BRAND } from "@/lib/brand";

function BrandAsterisk({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <line x1="12" y1="3" x2="12" y2="21" />
      <line x1="4.2" y1="7.5" x2="19.8" y2="16.5" />
      <line x1="19.8" y1="7.5" x2="4.2" y2="16.5" />
    </svg>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c6.5 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3.5 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<"login" | "signup">(
    params.get("mode") === "signup" ? "signup" : "login",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const plan = params.get("plan");
  const interval = params.get("interval");
  const currency = params.get("currency");

  const strength = useMemo(() => {
    if (!password) return { score: 0, label: "Use at least 8 characters" };
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Za-z]/.test(password) && /\d/.test(password)) score += 1;
    if (password.length >= 12 || /[^A-Za-z0-9]/.test(password)) score += 1;
    const labels = [
      "Too short — keep typing (min 8 chars)",
      "Good — meets minimum length",
      "Strong password",
      "Very strong password",
    ];
    return { score, label: labels[score] };
  }, [password]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/auth/${mode === "signup" ? "signup" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { error_message?: string };
      if (!res.ok) {
        setError(data.error_message ?? "Something went wrong. Please try again.");
        setBusy(false);
        return;
      }
      const target =
        plan && interval && currency
          ? `/app/billing?plan=${plan}&interval=${interval}&currency=${currency}`
          : "/app";
      router.push(target);
    } catch {
      setError("Network error. Please try again.");
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen grid lg:grid-cols-12">
      {/* Left Deep Espresso Editorial Showcase */}
      <section className="relative lg:col-span-6 pf-espresso-band overflow-hidden flex flex-col justify-between min-h-[300px] lg:min-h-screen">
        {/* Bespoke Nano Banana Writer's Desk Photograph */}
        <Image
          src="/images/login-studio.jpg"
          alt="Stack of cream deckle-edge notebooks, oxblood clothbound journal, and burgundy fountain pen on a dark walnut writing desk"
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover object-center opacity-80 transition-transform duration-1000 ease-out hover:scale-[1.02]"
        />
        {/* Layered Deep Espresso editorial scrim for crisp contrast */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(36,16,14,0.88) 0%, rgba(36,16,14,0.38) 42%, rgba(28,12,10,0.95) 100%)",
          }}
        />

        {/* Top Bar inside Showcase */}
        <div className="relative z-10 p-6 sm:p-8 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center rounded-md overflow-hidden border"
            style={{ borderColor: "var(--pf-espresso-border)", background: "rgba(36,16,14,0.85)" }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1.5 font-bold text-sm tracking-tight text-[#f4f1ea]">
              <span
                className="inline-flex items-center justify-center w-5 h-5 rounded"
                style={{ background: "var(--pf-accent)", color: "#ffffff" }}
              >
                <BrandAsterisk size={12} />
              </span>
              <span>{BRAND.name.toLowerCase()}.</span>
            </span>
            <span
              className="px-2.5 py-2 text-[11px] font-mono hidden sm:inline-flex items-center"
              style={{ background: "#dfdacc", color: "#1a1311" }}
              aria-hidden="true"
            >
              =
            </span>
          </Link>

          <span
            className="inline-flex items-center gap-2 text-[11px] font-semibold px-3 py-1.5 rounded-md border"
            style={{
              background: "rgba(36,16,14,0.78)",
              borderColor: "var(--pf-espresso-border)",
              color: "#f4f1ea",
            }}
          >
            <span className="w-2 h-2 rounded-full pf-pulse-dot" style={{ background: "#c96d72" }} />
            <span>Zero Text Retention</span>
          </span>
        </div>

        {/* Bottom Editorial Story & Micro Before/After Card */}
        <div className="relative z-10 p-6 sm:p-8 lg:p-12 space-y-6">
          <div className="max-w-lg">
            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#e5a6aa] mb-3">
              Natural Voice Studio
            </div>
            <h1 className="text-2xl sm:text-4xl font-semibold tracking-[-0.03em] leading-[1.12] text-[#f4f1ea]">
              A quiet desk for authentic, human-sounding prose.
            </h1>
            <p className="mt-3 text-sm sm:text-[15px] leading-relaxed" style={{ color: "#d5c7c2" }}>
              Turn stiff first drafts, essays, and Word documents into natural, readable writing—with
              Fidelity Shield protecting every number, date, and quote.
            </p>
          </div>

          {/* Subtle Tactile Micro-Preview (Desktop) */}
          <div
            className="hidden sm:block rounded-xl border p-4 backdrop-blur-md"
            style={{
              background: "rgba(36, 16, 14, 0.82)",
              borderColor: "var(--pf-espresso-border)",
            }}
          >
            <div className="flex items-center justify-between text-[11px] mb-2.5" style={{ color: "var(--pf-espresso-muted)" }}>
              <span className="font-semibold uppercase tracking-wider text-[#e5a6aa]">
                Sample Refinement
              </span>
              <span className="pf-mono">96.4% rebuilt · 0 bytes stored</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 text-xs leading-relaxed">
              <div
                className="rounded-lg p-3 border"
                style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)", color: "#bca7a2" }}
              >
                <div className="text-[10px] uppercase tracking-wider font-semibold mb-1 opacity-75">
                  Before
                </div>
                <p>
                  &ldquo;In today&apos;s rapidly evolving landscape, leveraging structured methodologies
                  significantly enhances cross-functional alignment.&rdquo;
                </p>
              </div>
              <div
                className="rounded-lg p-3 border"
                style={{ background: "rgba(124,53,57,0.22)", borderColor: "rgba(201,109,114,0.4)", color: "#f4f1ea" }}
              >
                <div className="text-[10px] uppercase tracking-wider font-semibold mb-1 text-[#f3b6ba]">
                  After · ProseFlow
                </div>
                <p className="pf-serif text-[13px]">
                  &ldquo;Clear habits keep teams moving in the same direction long after the kickoff
                  meeting fades.&rdquo;
                </p>
              </div>
            </div>
          </div>

          {/* 3 Editorial Metrics */}
          <div
            className="pt-5 border-t grid grid-cols-3 gap-4"
            style={{ borderColor: "rgba(255,255,255,0.14)" }}
          >
            {[
              { val: "500 words", label: "Free on signup" },
              { val: "0 bytes", label: "Draft text saved" },
              { val: ".docx", label: "Upload & export" },
            ].map((item) => (
              <div key={item.label}>
                <div className="text-sm sm:text-base font-semibold text-[#f4f1ea] pf-mono">
                  {item.val}
                </div>
                <div className="text-[11px] mt-0.5" style={{ color: "var(--pf-espresso-muted)" }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Right Warm Limestone Workspace & Auth Form */}
      <section className="relative lg:col-span-6 flex flex-col justify-between px-5 sm:px-10 py-6 sm:py-8 overflow-hidden">
        {/* Subtle Architectural Corner Lines */}
        <svg
          className="pointer-events-none absolute inset-0 w-full h-full opacity-55"
          viewBox="0 0 720 900"
          fill="none"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <g stroke="var(--pf-border)" strokeWidth="1.1">
            <path d="M0 110 H120 V190 H240" />
            <path d="M720 740 H580 V660 H470" />
          </g>
          <g stroke="var(--pf-accent)" strokeWidth="1.8" strokeLinecap="round" opacity="0.55">
            <path d="M0 110 H120 V190 H240" className="pf-flow-line-slow" />
          </g>
        </svg>

        {/* Top Utility Navigation */}
        <div className="relative z-10 flex items-center justify-between text-xs font-medium pf-muted">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 hover:text-[var(--pf-text)] transition-colors"
          >
            <span aria-hidden="true">←</span>
            <span>Back to homepage</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/docs" className="hover:text-[var(--pf-text)] transition-colors">
              API Docs
            </Link>
            <Link href="/privacy" className="hover:text-[var(--pf-text)] transition-colors">
              Privacy
            </Link>
          </div>
        </div>

        {/* Center Auth Card */}
        <div className="relative z-10 w-full max-w-md mx-auto my-8 pf-fade-in">
          <div className="mb-6">
            <div className="pf-eyebrow mb-2.5">
              {mode === "signup" ? "Free Starter Studio" : "Writer Sign In"}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-[-0.03em]">
              {mode === "signup" ? "Create your free account" : "Welcome back"}
            </h2>
            <p className="pf-muted text-sm mt-1.5 leading-relaxed">
              {mode === "signup"
                ? "Start with 500 free words right away—no credit card required."
                : "Sign in to open your writing studio, credit balance, and API keys."}
            </p>
          </div>

          <div className="pf-card-pure p-6 sm:p-8 shadow-lg shadow-black/[0.04]">
            {/* Segmented Mode Switcher */}
            <div
              className="grid grid-cols-2 gap-1 rounded-lg border p-1 mb-6"
              style={{ borderColor: "var(--pf-border)", background: "var(--pf-surface)" }}
              role="tablist"
              aria-label="Account mode"
            >
              {(["login", "signup"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => {
                    setMode(m);
                    setError(null);
                  }}
                  className={`pf-btn text-xs sm:text-sm px-3 py-2 rounded-md ${
                    mode === m ? "pf-btn-primary" : "pf-muted hover:text-[var(--pf-text)]"
                  }`}
                >
                  {m === "login" ? "Log in" : "Create account"}
                </button>
              ))}
            </div>

            {plan && interval && currency && (
              <div
                className="text-xs sm:text-sm mb-5 rounded-lg p-3.5 border flex items-start gap-2.5"
                style={{
                  background: "var(--pf-accent-soft)",
                  borderColor: "color-mix(in srgb, var(--pf-accent) 30%, var(--pf-border))",
                }}
              >
                <span className="pf-accent font-bold mt-0.5" aria-hidden="true">
                  ✳
                </span>
                <div>
                  <div className="font-semibold">
                    Selected plan: <span className="capitalize">{plan}</span> ({interval},{" "}
                    {currency})
                  </div>
                  <div className="pf-muted text-xs mt-0.5">
                    Right after {mode === "signup" ? "creating your account" : "signing in"}, we&apos;ll
                    take you straight to secure checkout.
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider block mb-1.5 pf-muted">
                  Work or Personal Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="pf-input text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider pf-muted">
                    Password
                  </label>
                  {mode === "signup" && (
                    <span className="text-[11px] pf-muted">Min. 8 characters</span>
                  )}
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    className="pf-input text-sm pr-11"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "signup" ? "Create a strong password" : "Enter your password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded pf-muted hover:text-[var(--pf-text)] transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>

                {/* Live Password Strength Indicator on Signup */}
                {mode === "signup" && (
                  <div className="mt-2">
                    <div className="grid grid-cols-3 gap-1.5">
                      {[1, 2, 3].map((step) => (
                        <div
                          key={step}
                          className="h-1 rounded-full transition-colors duration-300"
                          style={{
                            background:
                              strength.score >= step
                                ? strength.score === 1
                                  ? "var(--pf-warn)"
                                  : strength.score === 2
                                    ? "var(--pf-accent)"
                                    : "var(--pf-good)"
                                : "var(--pf-surface-2)",
                          }}
                        />
                      ))}
                    </div>
                    <p className="text-[11px] pf-muted mt-1">{strength.label}</p>
                  </div>
                )}
              </div>

              {error && (
                <div
                  role="alert"
                  className="text-xs sm:text-sm rounded-lg px-3.5 py-2.5 border flex items-start gap-2"
                  style={{
                    background: "color-mix(in srgb, var(--pf-bad) 10%, var(--pf-surface-pure))",
                    borderColor: "color-mix(in srgb, var(--pf-bad) 35%, var(--pf-border))",
                    color: "var(--pf-bad)",
                  }}
                >
                  <span className="font-bold" aria-hidden="true">!</span>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="pf-btn pf-btn-primary w-full py-3 text-sm mt-1"
              >
                {busy ? (
                  <>
                    <span
                      className="inline-block w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin"
                      aria-hidden="true"
                    />
                    <span>{mode === "signup" ? "Creating your studio..." : "Signing in..."}</span>
                  </>
                ) : mode === "signup" ? (
                  <span>Create free account · 500 words →</span>
                ) : (
                  <span>Log in to Studio →</span>
                )}
              </button>
            </form>

            {/* Included Benefits Checklist */}
            <div
              className="mt-6 pt-5 border-t space-y-2 text-xs pf-muted"
              style={{ borderColor: "var(--pf-border)" }}
            >
              {[
                "500 free words included immediately — no card required",
                "Upload full .docx files & compare Option A / B side by side",
                "Zero text retention: your drafts are processed in RAM only",
              ].map((perk) => (
                <div key={perk} className="flex items-start gap-2">
                  <span className="pf-accent font-bold leading-4" aria-hidden="true">
                    ✓
                  </span>
                  <span>{perk}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Mode Switcher */}
          <p className="text-center text-xs pf-muted mt-5">
            {mode === "login" ? (
              <>
                New to {BRAND.name}?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                  }}
                  className="pf-link font-semibold cursor-pointer"
                >
                  Create a free account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError(null);
                  }}
                  className="pf-link font-semibold cursor-pointer"
                >
                  Log in instead
                </button>
              </>
            )}
          </p>
        </div>

        {/* Bottom Legal Footer */}
        <div className="relative z-10 text-center text-[11px] pf-muted leading-relaxed">
          By continuing you agree to our{" "}
          <Link href="/terms" className="pf-link">
            Terms
          </Link>
          ,{" "}
          <Link href="/privacy" className="pf-link">
            Privacy Policy
          </Link>
          , and{" "}
          <Link href="/refunds" className="pf-link">
            7-Day Refund Policy
          </Link>
          .
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
