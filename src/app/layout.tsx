import type { Metadata } from "next";
import "./globals.css";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: {
    default: `${BRAND.name} — ${BRAND.tagline}`,
    template: `%s — ${BRAND.name}`,
  },
  description: `${BRAND.positioning} Built for bloggers, researchers, marketers, founders, and multilingual writers. Zero text retention: your drafts are processed in memory and never stored.`,
  keywords: [
    "AI writing editor",
    "natural voice editor",
    "writing refiner",
    "clear writing",
    "authentic prose",
    "ESL writing assistant",
    "document editor",
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
