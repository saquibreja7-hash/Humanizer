/** Typed access to environment variables (loaded from .env.local by Next.js). */

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback ?? "";
  return v.trim();
}

export const env = {
  get cerebKey() {
    return required("CEREBELLUM_API_KEY");
  },
  get backendUrl() {
    return required("HIP_BACKEND_URL", "https://api.cerebellumlabs.ai").replace(/\/+$/, "");
  },
  get backendMode() {
    return required("HIP_BACKEND_MODE", "openai");
  },
  get modelName() {
    return required("HIP_MODEL_NAME", "jamsaq-v1");
  },
  get workers() {
    const n = Number(required("HIP_WORKERS", "6"));
    return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 6;
  },
  get sessionSecret() {
    return required("SESSION_SECRET");
  },
  get databasePath() {
    return required("DATABASE_PATH", "proseflow.db");
  },
  get appUrl() {
    return required("APP_URL", "http://localhost:3000").replace(/\/+$/, "");
  },
  get devBillingSimulator() {
    return required("DEV_BILLING_SIMULATOR", "false") === "true";
  },
  billing: {
    get dodoApiKey() {
      return required("DODO_PAYMENTS_API_KEY");
    },
    get dodoWebhookKey() {
      return required("DODO_PAYMENTS_WEBHOOK_KEY");
    },
    dodoProductId(plan: "starter" | "pro" | "business") {
      return required(`DODO_PRODUCT_ID_${plan.toUpperCase()}`);
    },
    get razorpayKeyId() {
      return required("RAZORPAY_KEY_ID");
    },
    get razorpayKeySecret() {
      return required("RAZORPAY_KEY_SECRET");
    },
    get razorpayWebhookSecret() {
      return required("RAZORPAY_WEBHOOK_SECRET");
    },
  },
};

export function isProd(): boolean {
  return process.env.NODE_ENV === "production";
}
