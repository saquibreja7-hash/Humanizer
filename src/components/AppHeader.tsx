"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BRAND } from "@/lib/brand";

interface Me {
  user: { id: number; email: string; plan: string };
  plan_details?: { name: string; words_per_month: number };
  credits: { balance: number };
}

function BrandAsterisk({ size = 12 }: { size?: number }) {
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

export default function AppHeader() {
  const [me, setMe] = useState<Me | null>(null);
  const [loaded, setLoaded] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = (await res.json()) as Me;
        setMe(data);
        setLoaded(true);
      } else {
        router.replace("/login");
      }
    } catch {
      router.replace("/login");
    }
  }, [router]);

  useEffect(() => {
    void fetchMe();
  }, [fetchMe, pathname]);

  useEffect(() => {
    const onCredits = () => {
      void fetchMe();
    };
    window.addEventListener("proseflow:credits-updated", onCredits);
    return () => window.removeEventListener("proseflow:credits-updated", onCredits);
  }, [fetchMe]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  if (!loaded) {
    return (
      <header
        className="sticky top-0 z-40 pf-glass border-b"
        style={{ borderColor: "var(--pf-border)" }}
      >
        <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className="inline-flex items-center justify-center w-6 h-6 rounded"
              style={{ background: "var(--pf-espresso)", color: "#f4f1ea" }}
            >
              <BrandAsterisk size={12} />
            </span>
            <span className="pf-muted text-xs font-medium">Opening your studio...</span>
          </div>
          <div
            className="h-7 w-36 rounded-md animate-pulse"
            style={{ background: "var(--pf-surface-2)" }}
          />
        </div>
      </header>
    );
  }

  const nav = [
    { href: "/app", label: "Studio" },
    { href: "/app/billing", label: "Billing" },
    { href: "/app/api-keys", label: "API Keys" },
  ];

  const balance = me?.credits.balance ?? 0;
  const planName = me?.plan_details?.name ?? me?.user.plan ?? "Free";

  return (
    <header
      className="sticky top-0 z-40 pf-glass border-b"
      style={{ borderColor: "color-mix(in srgb, var(--pf-border) 85%, transparent)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Left: Brand badge + Workspace nav */}
        <div className="flex items-center gap-4 sm:gap-6 min-w-0">
          <Link
            href="/app"
            className="inline-flex items-center rounded-md overflow-hidden border shadow-2xs shrink-0"
            style={{ borderColor: "var(--pf-border)", background: "var(--pf-surface-2)" }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1.5 font-bold text-sm tracking-tight">
              <span
                className="inline-flex items-center justify-center w-5 h-5 rounded"
                style={{ background: "var(--pf-espresso)", color: "#f4f1ea" }}
              >
                <BrandAsterisk size={12} />
              </span>
              <span>{BRAND.name.toLowerCase()}.</span>
            </span>
            <span
              className="px-2 py-2 text-[11px] font-mono hidden sm:inline-flex items-center"
              style={{ background: "var(--pf-espresso)", color: "#f4f1ea" }}
              aria-hidden="true"
            >
              =
            </span>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-1.5" aria-label="Workspace navigation">
            {nav.map((n) => {
              const active =
                n.href === "/app" ? pathname === "/app" : pathname.startsWith(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className="px-3 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-colors"
                  style={{
                    background: active ? "var(--pf-espresso)" : "transparent",
                    color: active ? "#f4f1ea" : "var(--pf-muted)",
                  }}
                >
                  {n.label}
                </Link>
              );
            })}
            <Link
              href="/docs"
              className="hidden md:inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium pf-muted hover:text-[var(--pf-text)] transition-colors"
            >
              <span>API Docs</span>
              <span aria-hidden="true" className="text-[11px]">↗</span>
            </Link>
          </nav>
        </div>

        {/* Right: Credits pill + User email + Log out */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link
            href="/app/billing"
            title="View word balance and plan"
            className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-md border text-xs transition-colors hover:border-[var(--pf-accent)]"
            style={{
              background: "var(--pf-surface-pure)",
              borderColor: "var(--pf-border)",
            }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: balance > 150 ? "var(--pf-good)" : "var(--pf-warn)" }}
              aria-hidden="true"
            />
            <span className="font-bold pf-mono">{balance.toLocaleString()}</span>
            <span className="hidden sm:inline pf-muted">words</span>
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
              style={{ background: "var(--pf-accent-soft)", color: "var(--pf-accent)" }}
            >
              {planName}
            </span>
          </Link>

          {me?.user.email && (
            <span
              className="hidden lg:inline-block text-xs pf-muted max-w-[160px] truncate"
              title={me.user.email}
            >
              {me.user.email}
            </span>
          )}

          <button
            type="button"
            onClick={() => void logout()}
            className="pf-btn pf-btn-ghost text-xs px-3 py-1.5"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
