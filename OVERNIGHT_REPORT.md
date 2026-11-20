# ProseFlow — Phase A Overnight Report

**Built by:** Hermes Agent, overnight build (Phase A — Work Packages 1, 2, 3, 5a)
**Repo:** `C:\hermes\work\humanizer-saas` · branch `main` · nothing pushed, per rules.
**Status: everything below was actually executed and verified — exit codes included.**

---

## 1. What was built

A complete, production-ready ProseFlow SaaS: Next.js 15 (App Router, TypeScript, Tailwind CSS 4)
with a server-side HIP rewriting engine that talks to the live `jamsaq-v1` base model on
Cerebellum Cloud — the exact proven recipe from `reference/engine.py`, ported faithfully to
TypeScript, including the critical detail that it **only ever calls raw
`POST /v1/completions`, never `/v1/chat/completions`** (enforced by tests).

### Work Package 1 — Compliance-safe landing site
- `/` — landing page: hero, interactive Before/After demo (3 canned examples, client-side),
  feature grid, FAQ, and pricing with **Monthly/Annual × USD/INR** toggles
  (Free $0 · Starter $9/₹499 · Pro $19/₹999 — Most Popular · Business & API $49/₹2,499;
  annual ≈ 35% off). All brand/plan/pricing data lives in `src/lib/brand.ts` — rename the
  product in 10 seconds.
- Legal pages: `/terms` (editing-tool positioning, academic-dishonesty prohibition),
  `/privacy` (zero-text-retention policy), `/refunds` (7-day refund + 1-click cancel).
- Zero detector-bypass or academic-cheating wording on any public page — enforced by an
  automated compliance test (`tests/compliance.test.ts`) that fails the build on words like
  *bypass / undetectable / Turnitin / GPTZero / cheat / fool / evade*.

### Work Package 2 — HIP engine + editor API
- `src/lib/hip-engine.ts` — prompt format `<source_text>…</source_text>\n\n<target_text>\n`,
  stop sequences `["</target_text>", "<source_text>"]`, `temperature 1.0 / top_p 0.95`
  (Balanced 0.90 option), iterative rounds (Fast 3 / Standard 5 / Deep 7), parallel chunking
  (160–320-word paragraph-aligned blocks, up to `HIP_WORKERS=6` concurrent), heading/short-line
  passthrough, and the <45% collapse guard.
- `POST /api/rewrite` — authenticated **SSE streaming** with live per-round progress
  (`Rewriting block 2/4 — Round 3/5`), per-block streaming, Option A/B dual versions,
  and a final Fidelity Shield report. No credit deduction on failure.
- `POST /api/rewrite/paragraph` — single-paragraph click-to-regenerate (Pro+), burns only
  that paragraph's words.
- `src/lib/fidelity.ts` — 4-gram rebuild %, quote retention, number retention, drift warnings
  (faithful port of the proven Python checks).
- `POST /api/docx/extract` and `POST /api/docx/export` — in-memory `.docx` parsing (headings
  detected from Word styles) and styled `.docx` export with real Heading 1/2/3 styles.
  Round-trip verified by tests and the live E2E.

### Work Package 3 — Accounts, billing, developer API
- `src/lib/db.ts` — SQLite via Node 22's built-in `node:sqlite` (zero native deps — no
  MSVC/better-sqlite3 problems on Windows). **Zero-text-retention schema**: `users`,
  `sessions`, `api_keys`, `credit_ledger`, `rewrite_events`, `billing_events` — no table has
  any column that can hold document text; `rewrite_events` stores only word_count, rounds,
  mode, elapsed_ms, phrases_rebuilt_pct, created_at.
- `src/lib/auth.ts` — scrypt password hashing, HMAC-signed HTTP-only session cookies,
  `pf_sk_...` API keys stored as SHA-256 hashes (full key shown exactly once).
- `src/lib/rate-limit.ts` — in-memory sliding-window limiter (IP for sessions, per-key for API).
- `/app` split-screen editor: left = paste / drag-drop `.docx`/`.txt`, live word counter,
  credit bar, Mode + Creativity + Versions controls; right = streaming progress, Option A/B
  tabs, Fidelity Shield badges, hover-to-regenerate paragraphs, Copy / `.txt` / `.docx`.
- `/app/api-keys` — create/revoke `pf_sk_` keys + usage stats (Business plan).
- `/app/billing` — plan, word-credit bar, Monthly/Annual USD/INR upgrade buttons,
  1-click cancel, credit history ledger. Providers: **Dodo Payments** adapter (global MoR —
  hosted checkout via `POST /checkout_sessions`, Standard Webhooks signature verification
  over `{id}.{timestamp}.{body}` with replay protection), **Razorpay** adapter (Orders API,
  `X-Razorpay-Signature` HMAC verification), and a local **DEV_BILLING_SIMULATOR** that
  drives the exact same idempotent billing-event code path (active now, since no live keys
  are set). Webhook handlers at `/api/billing/webhook/{dodo,razorpay}` with idempotency via
  `billing_events.event_id`.
- `POST /api/v1/rewrite` — public Developer REST API (`Authorization: Bearer pf_sk_...`),
  JSON response with text + fidelity + credits. `/docs` has curl/Python/JS examples.
- `GET /api/health` — DB + live model reachability (`jamsaq-v1` shows as reachable).

Not in Phase A (per plan): the `ml/` distillation suite is Work Package 4 / Phase B.

---

## 2. Verification — actual results, this morning

| Check | Command | Result |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | **exit 0**, zero errors |
| Lint | `npm run lint` | **exit 0**, zero warnings/errors |
| Unit + integration tests | `npm test` (Vitest) | **exit 0 — 79 tests / 9 files, all passing** |
| Production build | `npm run build` | **exit 0** — 26 routes built |
| Live E2E vs real `jamsaq-v1` | `node scripts/e2e-smoke.mjs` on `next start -p 3100` | **39/39 checks passed** (server stopped cleanly after) |

What the Vitest suite covers: chunker + heading passthrough + collapse guard, fidelity
shield math (quotes/numbers/rebuilt%), raw `/v1/completions`-only regression guard
(fails if anyone ever points the engine at `/v1/chat/completions`), scrypt auth + signed
cookies + API-key lifecycle, credit ledger (grants, deductions, overdraft refusal),
zero-text-retention audit, rate limiter, `.docx` round-trip, Razorpay + Dodo webhook
signature verification (+ replay rejection), billing idempotency, and marketing-compliance
language scanning.

Live E2E highlights (real model, real money-path, **total spend ≈ $0.002**):
- Signup → 500 free credits granted.
- SSE rewrite of a **120-word sample from `reference/conv03.txt`**: streamed start →
  progress (3/3 rounds) → block → fidelity → done. Output: 137 words,
  **96.6% of 4-word phrases rebuilt**, quotes/numbers kept, elapsed 17.8s (fast mode).
  Credits: 500 → **380** exactly.
- Dev-simulator upgrade to Business: +250,000 words (ledger + billing_events recorded).
- `pf_sk_` key created → `POST /api/v1/rewrite` returned 200 JSON with fidelity and
  correct credit math (250,380 → **250,353**); invalid keys get 401.
- `.docx` export → re-extract round-trip: text, types, and heading levels identical.
- **SQLite audit: every cell of every table scanned — zero sample text stored.** Only
  anonymous metrics rows exist.

Secrets: `.env.local` and `*.db` are gitignored; a repo-wide scan confirms the Cerebellum
key value appears **nowhere** outside `.env.local`, and nothing is staged or committed.

---

## 3. How to run it tomorrow

```bash
cd C:\hermes\work\humanizer-saas
npm install          # only if node_modules is missing
npm run dev           # dev server on http://localhost:3000
# or, production:
npm run build && npm run start          # defaults to :3000
npm run start -- -p 3100                # different port
```

- The SQLite database (`proseflow.db`) is created automatically on first request — no setup.
- `.env.local` already contains the live Cerebellum key, model `jamsaq-v1`, 6 workers,
  a session secret, and `DEV_BILLING_SIMULATOR=true`.
- Handy: `npm test` · `npm run lint` · `npm run typecheck` ·
  `npm run e2e` (starts nothing itself — run it against a server on `:3100`, or
  `node scripts/e2e-smoke.mjs <baseUrl>`).
- Health probe: `GET /api/health` → shows DB status and whether Cerebellum can see the model.

---

## 4. Manual steps for Saquib

**Go live with payments (either one or both):**
1. **Dodo Payments** (global MoR): create products in the Dodo dashboard for Starter,
   Pro, Business. Put the API key in `DODO_PAYMENTS_API_KEY`, product ids in
   `DODO_PRODUCT_ID_STARTER/PRO/BUSINESS`, and the webhook endpoint signing secret in
   `DODO_PAYMENTS_WEBHOOK_KEY` (`.env.local`). Point the dashboard webhook at
   `https://your-domain/api/billing/webhook/dodo`.
2. **Razorpay** (India): `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`;
   webhook → `https://your-domain/api/billing/webhook/razorpay`. INR checkouts are routed to
   Razorpay automatically when its keys are present.
3. Set `DEV_BILLING_SIMULATOR=false` once real keys are in, and set `APP_URL` to the real
   domain (used for checkout return URLs).

**Rotate the dev secrets before production:**
- `SESSION_SECRET` — generate a new one (`openssl rand -hex 32`). Rotating it logs everyone
  out (safe), but do it before real customers exist.
- The Cerebellum key can be rotated from the Cerebellum dashboard; only `.env.local` holds it.

**Deploy:** works on any Node 22 host (`npm run build` + `npm start`) or Vercel (set the
env vars in the dashboard; SQLite is fine for single-instance demos but plan a move to
Supabase/Postgres before multi-instance scale-out — the repository layer in `src/lib/db.ts`
is deliberately thin so the swap is contained).

**Phase B (tonight):** run the Phase B prompt to build `ml/` — the 1-pass distilled
`jamsaq-v2` training suite — and re-verify everything. The report file will be updated then.

---

## 5. Known limits (honest list)

- Rate limiter and session store are in-memory (single-instance only — by design for Phase A).
- Razorpay integration uses the Orders API (one-time charge per cycle). Webhooks handle
  `payment.captured`; for true auto-renewing UPI subscriptions, switch to Razorpay
  Subscription plans when you enable it (the adapter shape already supports it).
- Monthly credits are a cumulative balance, not a hard calendar-month reset — plan grants
  happen on webhook/simulator purchase and future `subscription.renewed` events.
- The landing-page demo is canned client-side examples (no unauthenticated model calls,
  keeping costs at zero and payment-risk review clean).
