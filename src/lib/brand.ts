/**
 * ProseFlow — centralized brand, plans and pricing.
 * The founder can rename the brand, domain, support email, or adjust any price
 * here and every public page updates.
 */

export const BRAND = {
  name: "ProseFlow",
  tagline: "Natural Writing & Voice Refiner",
  positioning:
    "Turn stiff, robotic AI drafts into clear, authentic, human-sounding prose — while preserving every fact, quote, and figure.",
  domain: "proseflow.app",
  supportEmail: "support@proseflow.app",
  refundWindowDays: 7,
} as const;

export type PlanId = "free" | "starter" | "pro" | "business";
export type BillingInterval = "monthly" | "annual";
export type Currency = "USD" | "INR";

export interface Plan {
  id: PlanId;
  name: string;
  wordsPerMonth: number;
  /** Per-request word cap. */
  maxWordsPerRequest: number;
  /** Monthly price in USD. */
  monthlyUsd: number;
  /** Effective monthly price when billed annually (annual total = 12 x this). */
  annualMonthlyUsd: number;
  /** Monthly price in INR (India pricing). */
  monthlyInr: number;
  /** Effective monthly price in INR when billed annually. */
  annualMonthlyInr: number;
  features: string[];
  popular?: boolean;
  apiAccess: boolean;
  docxSupport: boolean;
  dualVersions: boolean;
  paragraphRegen: boolean;
  modes: ("fast" | "standard" | "deep")[];
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    wordsPerMonth: 500,
    maxWordsPerRequest: 250,
    monthlyUsd: 0,
    annualMonthlyUsd: 0,
    monthlyInr: 0,
    annualMonthlyInr: 0,
    features: [
      "500 words per month",
      "Up to 250 words per request",
      "Fast & Standard modes",
      "Live streaming editor",
    ],
    apiAccess: false,
    docxSupport: false,
    dualVersions: false,
    paragraphRegen: false,
    modes: ["fast", "standard"],
  },
  starter: {
    id: "starter",
    name: "Starter",
    wordsPerMonth: 20_000,
    maxWordsPerRequest: 2_000,
    monthlyUsd: 9,
    annualMonthlyUsd: 6,
    monthlyInr: 499,
    annualMonthlyInr: 333,
    features: [
      "20,000 words per month",
      "Word (.docx) upload & styled export",
      "Fidelity Shield fact & quote checks",
      "Balanced creativity control",
    ],
    apiAccess: false,
    docxSupport: true,
    dualVersions: false,
    paragraphRegen: false,
    modes: ["fast", "standard"],
  },
  pro: {
    id: "pro",
    name: "Pro",
    wordsPerMonth: 75_000,
    maxWordsPerRequest: 4_000,
    monthlyUsd: 19,
    annualMonthlyUsd: 12,
    monthlyInr: 999,
    annualMonthlyInr: 666,
    features: [
      "75,000 words per month",
      "Option A / Option B dual versions",
      "Click-to-regenerate any paragraph",
      "Deep mode (7 rounds)",
      "Word (.docx) upload & styled export",
      "Fidelity Shield fact & quote checks",
    ],
    popular: true,
    apiAccess: false,
    docxSupport: true,
    dualVersions: true,
    paragraphRegen: true,
    modes: ["fast", "standard", "deep"],
  },
  business: {
    id: "business",
    name: "Business & API",
    wordsPerMonth: 250_000,
    maxWordsPerRequest: 8_000,
    monthlyUsd: 49,
    annualMonthlyUsd: 35,
    monthlyInr: 2499,
    annualMonthlyInr: 1666,
    features: [
      "250,000 words per month",
      "REST API access (pf_sk_... keys)",
      "Priority parallel processing",
      "Option A / Option B dual versions",
      "Click-to-regenerate any paragraph",
      "Deep mode (7 rounds)",
    ],
    apiAccess: true,
    docxSupport: true,
    dualVersions: true,
    paragraphRegen: true,
    modes: ["fast", "standard", "deep"],
  },
};

export const PLAN_ORDER: PlanId[] = ["free", "starter", "pro", "business"];

export function planPrice(
  plan: Plan,
  interval: BillingInterval,
  currency: Currency,
): number {
  if (currency === "USD") {
    return interval === "annual" ? plan.annualMonthlyUsd : plan.monthlyUsd;
  }
  return interval === "annual" ? plan.annualMonthlyInr : plan.monthlyInr;
}

export function formatPrice(amount: number, currency: Currency): string {
  if (amount === 0) return currency === "USD" ? "$0" : "₹0";
  if (currency === "USD") return `$${amount}`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function annualTotal(plan: Plan, currency: Currency): string {
  const perMonth = planPrice(plan, "annual", currency);
  if (perMonth === 0) return formatPrice(0, currency);
  const total = perMonth * 12;
  return currency === "USD" ? `$${total}` : `₹${total.toLocaleString("en-IN")}`;
}

export const MODE_ROUNDS: Record<"fast" | "standard" | "deep", number> = {
  fast: 3,
  standard: 5,
  deep: 7,
};

export const CREATIVITY_TEMPERATURE: Record<"balanced" | "natural", number> = {
  balanced: 0.9,
  natural: 1.0,
};

/** Words granted once on signup (Free plan). */
export const SIGNUP_CREDIT_WORDS = 500;
