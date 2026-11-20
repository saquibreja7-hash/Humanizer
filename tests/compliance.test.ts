import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Compliance guard: payment processors and ad platforms ban writing tools
 * whose public pages contain detector-evasion or academic-cheating wording.
 * This test fails the build if any of that language sneaks into a public page.
 */
const PUBLIC_FILES = [
  "src/app/page.tsx",
  "src/app/about/page.tsx",
  "src/app/demo/page.tsx",
  "src/app/features/page.tsx",
  "src/app/pricing/page.tsx",
  "src/app/layout.tsx",
  "src/app/terms/page.tsx",
  "src/app/privacy/page.tsx",
  "src/app/refunds/page.tsx",
  "src/app/docs/page.tsx",
  "src/app/login/page.tsx",
  "src/components/PublicHeader.tsx",
  "src/components/PublicFooter.tsx",
  "src/components/BeforeAfter.tsx",
  "src/components/HeroLiveDemo.tsx",
  "src/components/PricingSection.tsx",
  "src/components/LegalLayout.tsx",
  "src/lib/brand.ts",
];

const FORBIDDEN = [
  /bypass/i,
  /undetectable/i,
  /turnitin/i,
  /gptzero/i,
  /quillbot/i,
  /copyleaks/i,
  /pangram/i,
  /zerogpt/i,
  /\bcheat/i,
  /\bfooling?\b/i,
  /evade/i,
  /beat ai/i,
  /ai detect/i,
  /trick/i,
];

describe("compliance-safe marketing language", () => {
  for (const file of PUBLIC_FILES) {
    it(`${file} contains no detector-evasion or academic-cheating wording`, () => {
      const full = path.resolve(process.cwd(), file);
      expect(fs.existsSync(full), `${file} should exist`).toBe(true);
      const content = fs.readFileSync(full, "utf8");
      const hits = FORBIDDEN.filter((re) => re.test(content));
      expect(hits, `${file} matched forbidden patterns: ${hits.map((r) => String(r)).join(", ")}`).toEqual([]);
    });
  }

  it("targets the allowed audiences, not students trying to cheat", () => {
    const landing = fs.readFileSync(path.resolve(process.cwd(), "src/app/page.tsx"), "utf8");
    expect(landing).toMatch(/bloggers|researchers|marketers|founders|ESL writers/);
  });

  it("Terms page prohibits academic dishonesty", () => {
    const terms = fs.readFileSync(path.resolve(process.cwd(), "src/app/terms/page.tsx"), "utf8");
    expect(terms).toMatch(/academic dishonesty/);
  });

  it("Privacy page states the zero-retention guarantee", () => {
    const privacy = fs.readFileSync(path.resolve(process.cwd(), "src/app/privacy/page.tsx"), "utf8");
    expect(privacy).toMatch(/never store your text/i);
  });

  it("Refunds page offers 7-day refunds and 1-click cancellation", () => {
    const refunds = fs.readFileSync(path.resolve(process.cwd(), "src/app/refunds/page.tsx"), "utf8");
    expect(refunds).toMatch(/7-day/);
    expect(refunds).toMatch(/Cancel anytime/i);
  });
});
