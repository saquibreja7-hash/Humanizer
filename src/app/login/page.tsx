"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BRAND } from "@/lib/brand";
import { BrandAsterisk } from "@/components/PublicHeader";

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
    if (!password) return { score: 0, label: "Minimum 8 characters" };
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Za-z]/.test(password) && /\d/.test(password)) score += 1;
    if (password.length >= 12 || /[^A-Za-z0-9]/.test(password)) score += 1;
    const labels = [
      "Too short (min 8 chars)",
      "Meets minimum length",
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
    <main className="min-h-dvh flex flex-col justify-between px-5 py-8">
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between text-xs pf-muted">
        <Link href="/" className="inline-flex items-center gap-2 font-bold text-sm text-[var(--pf-text)]">
          <span
            className="inline-flex items-center justify-center w-5 h-5 rounded"
            style={{ background: "var(--pf-espresso)", color: "var(--pf-espresso-ink)" }}
          >
            <BrandAsterisk size={12} />
          </span>
          <span>{BRAND.name.toLowerCase()}.</span>
        </Link>
        <Link href="/" className="hover:text-[var(--pf-text)]">
          Back to home
        </Link>
      </div>

      <div className="w-full max-w-sm mx-auto my-10">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-[-0.03em]">
            {mode === "signup" ? "Create your account" : "Sign in"}
          </h1>
          <p className="pf-muted text-sm mt-1.5">
            {mode === "signup"
              ? "Includes 500 free words. Zero drafts stored."
              : "Open your writing studio and credits."}
          </p>
        </div>

        <div className="pf-card-pure p-6 sm:p-7">
          <div
            className="grid grid-cols-2 gap-1 rounded-lg border p-1 mb-5"
            style={{ borderColor: "var(--pf-border)", background: "var(--pf-surface)" }}
            role="tablist"
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
                className={`pf-btn text-xs px-3 py-2 rounded-md ${
                  mode === m ? "pf-btn-primary" : "pf-muted hover:text-[var(--pf-text)]"
                }`}
              >
                {m === "login" ? "Log in" : "Sign up"}
              </button>
            ))}
          </div>

          {plan && interval && currency && (
            <div
              className="text-xs mb-4 rounded-lg p-3 border"
              style={{ background: "var(--pf-accent-soft)", borderColor: "var(--pf-border)" }}
            >
              Selected plan: <strong className="capitalize">{plan}</strong> ({interval}, {currency})
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label htmlFor="email" className="text-xs font-semibold block mb-1.5">
                Email
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
              <label htmlFor="password" className="text-xs font-semibold block mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  className="pf-input text-sm pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 pf-muted hover:text-[var(--pf-text)]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
              {mode === "signup" && (
                <div className="mt-2">
                  <div className="grid grid-cols-3 gap-1">
                    {[1, 2, 3].map((step) => (
                      <div
                        key={step}
                        className="h-1 rounded-full"
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
              <p role="alert" className="text-xs font-medium" style={{ color: "var(--pf-bad)" }}>
                {error}
              </p>
            )}

            <button type="submit" disabled={busy} className="pf-btn pf-btn-primary w-full py-2.5 text-sm">
              {busy ? "Working..." : mode === "signup" ? "Create account" : "Log in"}
            </button>
          </form>
        </div>
      </div>

      <div className="text-center text-xs pf-muted">
        By continuing, you agree to our{" "}
        <Link href="/terms" className="pf-link">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="pf-link">
          Privacy Policy
        </Link>
        .
      </div>
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
