import type { Metadata } from "next";
import { DM_Sans, Newsreader, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { BRAND } from "@/lib/brand";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

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
    <html
      lang="en"
      suppressHydrationWarning
      className={`${dmSans.variable} ${newsreader.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
