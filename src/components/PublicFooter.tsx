import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { BrandAsterisk } from "@/components/PublicHeader";

export default function PublicFooter() {
  return (
    <footer
      className="border-t"
      style={{ borderColor: "var(--pf-border)", background: "var(--pf-surface)" }}
    >
      <div className="max-w-6xl mx-auto px-5 py-12 grid gap-8 md:grid-cols-4 text-sm">
        <div>
          <div className="font-bold text-lg flex items-center gap-2">
            <span
              className="inline-flex items-center justify-center w-5 h-5 rounded"
              style={{ background: "var(--pf-accent)", color: "var(--pf-btn-ink)" }}
            >
              <BrandAsterisk size={11} />
            </span>
            {BRAND.name.toLowerCase()}.
          </div>
          <p className="pf-muted mt-2.5 leading-relaxed">
            {BRAND.tagline}. Clear, authentic prose with every fact, quote, and figure preserved.
          </p>
        </div>
        <div>
          <div className="font-semibold mb-3">Product</div>
          <ul className="pf-muted space-y-2.5">
            <li><Link href="/about" className="hover:text-[var(--pf-text)]">About</Link></li>
            <li><Link href="/demo" className="hover:text-[var(--pf-text)]">Live Demo</Link></li>
            <li><Link href="/features" className="hover:text-[var(--pf-text)]">Features</Link></li>
            <li><Link href="/pricing" className="hover:text-[var(--pf-text)]">Pricing</Link></li>
            <li><Link href="/docs" className="hover:text-[var(--pf-text)]">Developer API</Link></li>
            <li><Link href="/login" className="hover:text-[var(--pf-text)]">Log in</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-3">Legal</div>
          <ul className="pf-muted space-y-2.5">
            <li><Link href="/terms" className="hover:text-[var(--pf-text)]">Terms of Service</Link></li>
            <li><Link href="/privacy" className="hover:text-[var(--pf-text)]">Privacy Policy</Link></li>
            <li><Link href="/refunds" className="hover:text-[var(--pf-text)]">Refund Policy</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-3">Support</div>
          <ul className="pf-muted space-y-2.5">
            <li>
              <a href={`mailto:${BRAND.supportEmail}`} className="hover:text-[var(--pf-text)]">
                {BRAND.supportEmail}
              </a>
            </li>
            <li className="text-xs">7-day fair refund guarantee</li>
          </ul>
        </div>
      </div>
      <div
        className="border-t py-5 text-center text-xs pf-muted"
        style={{ borderColor: "var(--pf-border)" }}
      >
        © {new Date().getFullYear()} {BRAND.name}
      </div>
    </footer>
  );
}
