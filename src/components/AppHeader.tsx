"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BRAND } from "@/lib/brand";

interface Me {
  user: { id: number; email: string; plan: string };
  credits: { balance: number };
}

export default function AppHeader() {
  const [me, setMe] = useState<Me | null>(null);
  const [loaded, setLoaded] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then(async (res) => {
        if (res.ok) {
          const data = (await res.json()) as Me;
          if (!cancelled) {
            setMe(data);
            setLoaded(true);
          }
        } else {
          router.replace("/login");
        }
      })
      .catch(() => router.replace("/login"));
    return () => {
      cancelled = true;
    };
  }, [router, pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  if (!loaded) {
    return (
      <header className="border-b px-5 py-4" style={{ borderColor: "var(--pf-border)" }}>
        <span className="pf-muted text-sm">Loading…</span>
      </header>
    );
  }

  const nav = [
    { href: "/app", label: "Editor" },
    { href: "/app/api-keys", label: "API Keys" },
    { href: "/app/billing", label: "Billing" },
  ];

  return (
    <header className="border-b" style={{ borderColor: "var(--pf-border)" }}>
      <div className="max-w-7xl mx-auto px-5 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/app" className="font-bold text-lg">
            {BRAND.name}
          </Link>
          <nav className="flex gap-4 text-sm">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="hover:opacity-70"
                style={{ fontWeight: pathname === n.href ? 700 : 400 }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="pf-badge" style={{ background: "var(--pf-accent-soft)" }}>
            {me?.credits.balance.toLocaleString()} words · {me?.user.plan}
          </span>
          <button onClick={logout} className="pf-btn pf-btn-ghost text-xs px-3 py-1.5">
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
