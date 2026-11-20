"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BRAND } from "@/lib/brand";
import { BrandAsterisk } from "@/components/PublicHeader";

interface Me {
  user: { id: number; email: string; plan: string };
  plan_details?: { name: string; words_per_month: number };
  credits: { balance: number };
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
          <div className="flex items-center gap-2.5">
            <span
              className="inline-flex items-center justify-center w-6 h-6 rounded-md"
              style={{ background: "var(--pf-accent)", color: "var(--pf-btn-ink)" }}
            >
              <BrandAsterisk size={13} />
            </span>
            <span className="pf-muted text-xs font-medium">Loading studio...</span>
          </div>
          <div
            className="h-7 w-32 rounded-md animate-pulse"
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
      style={{ borderColor: "var(--pf-border)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <div className="flex items-center gap-4 sm:gap-6 min-w-0">
          <Link
            href="/app"
            className="inline-flex items-center gap-2 font-bold text-base tracking-tight whitespace-nowrap shrink-0"
          >
            <span
              className="inline-flex items-center justify-center w-6 h-6 rounded-md shrink-0"
              style={{ background: "var(--pf-accent)", color: "var(--pf-btn-ink)" }}
            >
              <BrandAsterisk size={13} />
            </span>
            <span>{BRAND.name}</span>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2 whitespace-nowrap" aria-label="Workspace navigation">
            {nav.map((n) => {
              const active =
                n.href === "/app" ? pathname === "/app" : pathname.startsWith(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className="px-3 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap"
                  style={{
                    background: active ? "var(--pf-accent-soft)" : "transparent",
                    color: active ? "var(--pf-accent)" : "var(--pf-muted)",
                  }}
                >
                  {n.label}
                </Link>
              );
            })}
            <Link
              href="/docs"
              className="hidden md:inline-flex px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium pf-muted hover:text-[var(--pf-text)] transition-colors whitespace-nowrap"
            >
              API Docs
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link
            href="/app/billing"
            title="View word balance and plan"
            className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-md border text-xs transition-colors hover:border-[var(--pf-accent)] whitespace-nowrap"
            style={{
              background: "var(--pf-surface-pure)",
              borderColor: "var(--pf-border)",
            }}
          >
            <span className="font-bold pf-mono">{balance.toLocaleString()}</span>
            <span className="hidden sm:inline pf-muted">words</span>
            <span
              className="px-1.5 py-0.5 rounded text-[11px] font-semibold"
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
            className="pf-btn pf-btn-ghost text-xs px-3 py-1.5 whitespace-nowrap"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
