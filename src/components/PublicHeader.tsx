"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BRAND } from "@/lib/brand";

export function BrandAsterisk({ size = 14 }: { size?: number }) {
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

const NAV_LINKS = [
  { href: "/about", label: "About" },
  { href: "/demo", label: "Live Demo" },
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/docs", label: "API Docs" },
];

export default function PublicHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-40 pf-glass border-b"
      style={{ borderColor: "color-mix(in srgb, var(--pf-border) 80%, transparent)" }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-5 h-16 flex items-center justify-between gap-3">
        <div className="flex items-center gap-6 shrink-0">
          <Link
            href="/"
            className="inline-flex items-center rounded-md overflow-hidden border shadow-2xs shrink-0"
            style={{ borderColor: "var(--pf-border)", background: "var(--pf-surface-2)" }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1.5 font-bold text-sm tracking-tight whitespace-nowrap">
              <span
                className="inline-flex items-center justify-center w-5 h-5 rounded shrink-0"
                style={{ background: "var(--pf-espresso)", color: "#f4f1ea" }}
              >
                <BrandAsterisk size={12} />
              </span>
              <span>{BRAND.name.toLowerCase()}.</span>
            </span>
            <span
              className="px-2.5 py-2 text-[11px] font-mono hidden sm:inline-flex items-center"
              style={{ background: "var(--pf-espresso)", color: "#f4f1ea" }}
              aria-hidden="true"
            >
              =
            </span>
          </Link>

          <nav
            className="hidden md:flex items-center gap-6 text-sm font-medium pf-muted whitespace-nowrap"
            aria-label="Primary navigation"
          >
            {NAV_LINKS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`transition-colors whitespace-nowrap ${
                    active
                      ? "text-[var(--pf-accent)] font-semibold"
                      : "hover:text-[var(--pf-text)]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/login"
            className="pf-btn pf-btn-primary text-xs sm:text-sm px-3.5 sm:px-4 py-2 whitespace-nowrap"
          >
            Log in
          </Link>
          <Link
            href="/login?mode=signup"
            className="pf-btn pf-btn-ghost text-xs sm:text-sm px-4 py-2 whitespace-nowrap hidden sm:inline-flex"
          >
            Sign up
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden pf-btn pf-btn-ghost text-sm px-3 py-2 whitespace-nowrap"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div
          className="md:hidden border-t px-4 py-3 space-y-1 text-sm"
          style={{ borderColor: "var(--pf-border)", background: "var(--pf-surface)" }}
        >
          {NAV_LINKS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`block py-2.5 px-2 rounded-md font-medium ${
                  active ? "text-[var(--pf-accent)] font-semibold" : "pf-muted"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <div className="pt-2 mt-2 border-t flex gap-2" style={{ borderColor: "var(--pf-border)" }}>
            <Link
              href="/login?mode=signup"
              onClick={() => setMobileOpen(false)}
              className="pf-btn pf-btn-primary text-xs w-full py-2.5 whitespace-nowrap"
            >
              Create free account
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
