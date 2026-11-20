"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BRAND } from "@/lib/brand";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<"login" | "signup">(
    params.get("mode") === "signup" ? "signup" : "login",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const plan = params.get("plan");
  const interval = params.get("interval");
  const currency = params.get("currency");

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
    <main className="min-h-screen flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="block text-center font-bold text-2xl mb-8">
          {BRAND.name}
        </Link>
        <div className="pf-card p-8">
          <div className="flex gap-1 rounded-full border p-1 mb-6" style={{ borderColor: "var(--pf-border)" }}>
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setError(null);
                }}
                className={`pf-btn flex-1 text-sm px-4 py-2 rounded-full ${mode === m ? "pf-btn-primary" : ""}`}
              >
                {m === "login" ? "Log in" : "Create account"}
              </button>
            ))}
          </div>

          {plan && interval && currency && (
            <p className="pf-muted text-sm mb-4" style={{ background: "var(--pf-accent-soft)", padding: "0.6rem 0.8rem", borderRadius: 8 }}>
              After signing up you&apos;ll be taken to checkout for the{" "}
              <strong>{plan}</strong> plan ({interval}, {currency}).
            </p>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label htmlFor="email" className="text-sm font-semibold block mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                className="pf-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-semibold block mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                className="pf-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </div>
            {error && (
              <p className="text-sm" style={{ color: "var(--pf-bad)" }}>
                {error}
              </p>
            )}
            <button type="submit" disabled={busy} className="pf-btn pf-btn-primary w-full">
              {busy ? "Working..." : mode === "signup" ? "Create account — 500 free words" : "Log in"}
            </button>
          </form>

          <p className="pf-muted text-xs mt-5 leading-relaxed">
            By continuing you agree to our{" "}
            <a href="/terms" className="pf-link">
              Terms
            </a>{" "}
            and{" "}
            <a href="/privacy" className="pf-link">
              Privacy Policy
            </a>
            . We store your writing nowhere — zero text retention.
          </p>
        </div>
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
