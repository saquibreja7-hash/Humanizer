# ProseFlow (Humanizer SaaS) — Detailed Engineering & Product Specification

> **Handover for Hermes Agent (Overnight Build)**
> **Target Repo:** `C:\hermes\work\humanizer-saas`
> **Rule #1:** Do NOT touch, stop, or interfere with `C:\hermes\work\asmita (or any other folder in C:\hermes\work)` or any other repo on this VM. Work strictly inside `C:\hermes\work\humanizer-saas`.
> **Rule #2:** Do NOT push to any remote git repository. Commit all work cleanly to local git branches (`main`).
> **Rule #3:** Never commit `.env` or `.env.local` or any API keys into git.

---

## 1. Proven Technical Foundation (Already Verified!)

We already proved that **HIP (Humanization by Iterative Paraphrasing)** on a raw **base model** beats all 6 major AI detectors at **0% AI** with clean, natural English:
- **Pangram 4.1:** 0% AI (100% Human)
- **GPTZero 5.0b:** 0% AI (100% Human)
- **QuillBot v7.1:** 0% AI (100% Human)
- **ZeroGPT:** 0% AI (Human written)
- **Grammarly AI Detector:** 0% AI
- **Copyleaks:** 0% AI (0/351 words)

### Live Serverless Model Endpoint (Available Now in `.env.local`)
- **Provider:** Cerebellum Cloud (`https://api.cerebellumlabs.ai`)
- **Endpoint:** `POST https://api.cerebellumlabs.ai/v1/completions` (MUST use raw `/v1/completions`, **NEVER** `/v1/chat/completions` — chat templates destroy the base-model distribution!)
- **Model ID:** `jamsaq-v1` (merged lossless `bfloat16` `Qwen/Qwen3-4B-Base` + `YixuanEvenXu/Qwen3-4B-Base-HIP-adapter`)
- **Auth:** `Authorization: Bearer $CEREBELLUM_API_KEY`
- **Pricing:** \$0.75 / 1M input tokens, \$2.25 / 1M output tokens (\$0 when idle, \$25 free credits on account — keep automated test prompts small, ~100–200 words, so tests cost <\$0.02!)

### Exact Proven HIP Prompt & Inference Parameters
```text
<source_text>
{chunk_text}
</source_text>

<target_text>
```
- **Stop sequences:** `["</target_text>", "<source_text>"]`
- **Sampling (Proven 0% AI setting):** `temperature: 1.0`, `top_p: 0.95`
  - *Warning from live testing:* `temperature: 0.75` copies too many original AI sentences verbatim and gets caught by GPTZero/QuillBot. Default MUST be **`temperature: 1.0`**, with optional `Balanced (0.90)` for tighter fact-keeping.
- **Iterative Rounds:**
  - `Fast`: 3 rounds
  - `Standard (Proven Default)`: 5 rounds
  - `Deep`: 7 rounds
- **Chunking Rules:**
  - Split long documents into paragraph-aligned blocks of **160–280 words** (max 320 words; split mega-paragraphs at sentence boundaries).
  - Headings / short standalone lines (`<= 12 words` without ending `.!?`, or `<= 6 words`) MUST pass through **untouched** so document structure stays intact.
  - Run chunks **in parallel** (up to 6 concurrent workers) against Cerebellum Cloud so a 660–1,000 word document finishes in ~15–20 seconds!
  - Guard against collapsed/empty rounds: if a round returns `< 45%` of original chunk word count, keep the previous round's text.

---

## 2. CRITICAL Compliance, Payment & Brand Rules

> **STRICT REQUIREMENT:** Payment processors (Stripe, Paddle, Dodo Payments, Lemon Squeezy) and Google Ads automatically ban SaaS landing pages that contain academic-cheating or detector-evasion wording.

- **Working Brand Name:** **ProseFlow** (centralize brand name, domain, support email, and pricing in `src/lib/brand.ts` so the founder can rename in 10 seconds).
- **Positioning:** *"Natural Writing & Voice Refiner — Turn stiff, robotic AI drafts into clear, authentic, human-sounding prose while preserving every fact, quote, and figure."*
- **Target Audience in Marketing Copy:** Bloggers, researchers, marketers, founders, and multilingual/ESL writers.
- **FORBIDDEN Words in Public Marketing/Checkout/Meta Tags:** Never write *"bypass Turnitin"*, *"cheat AI detectors"*, *"fool GPTZero"*, *"undetectable essays"*, or *"100% undetectable guarantee"*.
- **Mandatory Legal Pages:**
  - `/terms`: Clear Terms of Service stating ProseFlow is a writing/editing tool; prohibits academic dishonesty or violating institutional/platform policies.
  - `/privacy`: Strict **Zero-Text-Retention Policy** — user input and rewritten output are processed in memory and NEVER stored in the database or used for model training (only anonymous word counts, timestamps, and fidelity metrics are logged).
  - `/refunds`: Fair 7-day refund policy + 1-click self-serve cancellation to keep chargeback rates near zero.

---

## 3. Product Architecture & Tech Stack

Build a clean, production-grade **Next.js (App Router, TypeScript, Tailwind CSS)** monorepo inside `C:\hermes\work\humanizer-saas`:

```text
C:\hermes\work\humanizer-saas/
├── SPEC.md                          # This spec
├── OVERNIGHT_REPORT.md              # Written by Hermes upon completion
├── .env.example                     # Safe template (committed)
├── .env.local                       # Live Cerebellum key + local secrets (GITIGNORED!)
├── package.json
├── src/
│   ├── lib/
│   │   ├── brand.ts                 # Centralized brand name, plans, pricing (USD + INR)
│   │   ├── db.ts                    # SQLite (better-sqlite3) schema + clean repository layer (Postgres/Supabase-ready)
│   │   ├── auth.ts                  # Scrypt password hashing + signed HTTP-only session cookies + API key verification
│   │   ├── hip-engine.ts            # Chunking, heading passthrough, parallel Cerebellum /v1/completions, SSE emitter
│   │   ├── fidelity.ts              # 4-gram rebuild %, quote retention, number retention, drift warnings
│   │   ├── docx-utils.ts            # .docx paragraph/heading extraction & formatted .docx export
│   │   ├── rate-limit.ts            # In-memory sliding-window rate limiter (IP + API key)
│   │   └── billing/
│   │       ├── types.ts             # Unified BillingProvider interface
│   │       ├── dodo.ts              # Dodo Payments (Global MoR) adapter + webhook verification
│   │       ├── razorpay.ts          # Razorpay (India UPI/Cards) adapter + HMAC webhook verification
│   │       └── simulator.ts         # Local dev billing simulator when live billing keys are unset
│   ├── app/
│   │   ├── page.tsx                 # Compliance-safe Marketing Landing Page + Pricing (Monthly/Annual, USD/INR) + FAQ
│   │   ├── terms/page.tsx           # Terms of Service
│   │   ├── privacy/page.tsx         # Zero-Retention Privacy Policy
│   │   ├── refunds/page.tsx         # 7-Day Refund Policy
│   │   ├── login/page.tsx           # Sign in / Sign up
│   │   ├── docs/page.tsx            # Interactive Developer REST API Docs (curl, Python, JS examples)
│   │   ├── app/
│   │   │   ├── page.tsx             # Main Split-Screen Editor (SSE streaming, Option A/B, paragraph regen, .docx upload/export, Fidelity Shield)
│   │   │   ├── api-keys/page.tsx    # Create / revoke pf_sk_... REST API keys + usage stats
│   │   │   └── billing/page.tsx     # Current plan, word-credit bar, upgrade/cancel buttons
│   │   └── api/
│   │       ├── health/route.ts      # Server + Cerebellum model reachability check
│   │       ├── auth/{signup,login,logout,me}/route.ts
│   │       ├── rewrite/route.ts     # Authenticated SSE streaming rewrite endpoint (deducts word credits, zero text logging)
│   │       ├── rewrite/paragraph/route.ts  # Single-paragraph click-to-regenerate endpoint
│   │       ├── docx/extract/route.ts       # Extract structured text from uploaded .docx
│   │       ├── docx/export/route.ts        # Export rewritten text back to clean formatted .docx
│   │       ├── keys/route.ts               # List / create / revoke API keys
│   │       ├── billing/checkout/route.ts   # Create checkout session (Dodo / Razorpay / Dev Simulator)
│   │       ├── billing/webhook/{dodo,razorpay}/route.ts
│   │       └── v1/rewrite/route.ts         # Public Developer REST API (Bearer pf_sk_... auth, JSON response)
├── tests/                           # Vitest unit + integration tests
└── ml/                              # Phase 2: 1-Pass Shortcut Distillation & Private LoRA Training Suite
    ├── README.md                    # Plain-English guide to training jamsaq-v2 (1-pass instant model)
    ├── generate_distill_data.py     # Offline 5-round teacher generator + automatic fidelity/drift filter
    ├── prepare_human_pairs.py       # Reverse-pair generator (pre-2022 human text -> AI draft -> human target)
    ├── train_hip_v2_lora.py         # Qwen3-4B-Base LoRA trainer (supports style tags + 1-pass distilled data)
    ├── merge_and_push.py            # Lossless bfloat16 merge + private HF upload (Cerebellum-ready)
    ├── modal_vllm_fp8.py            # High-scale Modal vLLM FP8 deployment script ($0 idle, 2-3s latency)
    └── eval_benchmark.py            # Weekly detector regression harness (Pangram + GPTZero + fidelity + Spearman)
```

---

## 4. Detailed Feature Requirements

### 4.1 Pricing Plans (`src/lib/brand.ts`)
- **Free:** \$0 (₹0) — **500 words/month**, max 250 words per request, Fast & Standard modes.
- **Starter:** \$9/mo (₹499/mo) or \$6/mo billed annually — **20,000 words/month**, `.docx` upload/export, Fidelity Shield.
- **Pro (Most Popular):** \$19/mo (₹999/mo) or \$12/mo billed annually — **75,000 words/month**, Option A/B dual versions, click-to-regenerate paragraphs, Deep mode.
- **Business & API:** \$49/mo (₹2,499/mo) or \$35/mo billed annually — **250,000 words/month**, REST API access (`pf_sk_...` keys), priority parallel workers.

### 4.2 Editor UX (`/app`)
- Clean, calm, editorial design (inspired by Linear / Notion / iA Writer — warm light mode + crisp dark mode, Georgia/Newsreader serif in editor panes, clean sans-serif UI chrome).
- Left pane: Paste text OR drag-and-drop a `.docx`/`.txt` file; live word counter + remaining monthly credits bar.
- Controls:
  - **Mode:** `Fast (3 rounds)` | `Standard (5 rounds — Recommended)` | `Deep (7 rounds)`
  - **Creativity:** `Balanced (0.90)` | `Natural (1.0 — Recommended)`
  - **Versions:** `1 version` | `2 versions (Option A & B)`
- Right pane:
  - Live SSE progress bar (`Rewriting block 2/4 — Round 3/5...`) + blocks appear as each finishes.
  - **Option A / Option B** switcher tabs when 2 versions generated.
  - **Fidelity Shield badges:** `% phrases rebuilt` (green if `>= 80%`), `Quotes kept X/Y`, `Numbers kept X/Y`, plus yellow drift warning banner if any number/quote changed or was invented.
  - **Paragraph Hover Action:** Hover any output paragraph → click **Regenerate** to re-run just that single paragraph without burning credits on the whole document!
  - One-click **Copy**, **Download `.txt`**, and **Download `.docx`**.

### 4.3 Zero-Retention Privacy Guarantee
- Database tables (`users`, `sessions`, `credit_ledger`, `api_keys`, `rewrite_events`):
  - `rewrite_events` stores ONLY: `id`, `user_id`, `word_count`, `rounds`, `mode`, `elapsed_ms`, `phrases_rebuilt_pct`, `created_at`.
  - **NEVER** store input text or output text in SQLite or server logs!

### 4.4 Speed Breakthrough: 1-Pass Shortcut Distillation (`ml/`)
Why 5–10 rounds are slow today: sequential passes multiply wait time and token cost by 5×–10×.
In `ml/`, build the complete, tested, ready-to-run **1-Pass Shortcut Distillation** toolkit:
1. **`ml/generate_distill_data.py`**:
   - Takes a JSONL of AI drafts (e.g. from Hugging Face or local texts).
   - Runs each through `jamsaq-v1` (5 rounds, parallel) to produce final 0%-AI rewrites.
   - Automatically filters out bad pairs using strict quality gates: length ratio `0.75–1.30`, 4-gram rebuild `>= 80%`, `100%` quote retention, `>= 90%` number retention, zero added hallucinated numbers, and optional LLM semantic-equivalence check.
   - Outputs clean `distill_train.jsonl` (`{"source": ..., "target": ..., "style": ...}`).
2. **`ml/prepare_human_pairs.py`**:
   - Takes genuine pre-2022 human writing, generates stiff AI counterparts via OpenAI/DeepSeek/Cerebellum, and outputs `human_reverse_pairs.jsonl` so 50% of training data is 100% authentic human text!
3. **`ml/train_hip_v2_lora.py`**:
   - Uses `transformers` + `peft` + `trl` (`SFTTrainer`) to train a private **LoRA (`r=128, lora_alpha=128`)** on `Qwen/Qwen3-4B-Base` (Apache 2.0) directly on `<source_text>\n{source}\n</source_text>\n\n<target_text>\n{target}\n</target_text>` — teaching the model to jump from AI Draft → Final Clean Human Output in **1 single pass (2–3 seconds)**!
   - Includes `--dry-run` / `--smoke-test` mode so syntax and data formatting are verified without needing a GPU on `dev-vm`.
4. **`ml/modal_vllm_fp8.py`**:
   - Production Modal serverless GPU server running merged `jamsaq-v2` in **FP8** on NVIDIA L40S/L4 with `vLLM` continuous batching + OpenAI `/v1/completions` streaming.

---

## 5. Acceptance Criteria (Definition of Done)

Before stopping and writing `OVERNIGHT_REPORT.md`, Hermes MUST verify ALL of the following:
1. `npm run typecheck` (or `npx tsc --noEmit`) exits `0` with zero TypeScript errors.
2. `npm run lint` exits `0`.
3. `npm run build` (Next.js production build) exits `0`.
4. `npm test` (Vitest suite covering chunker, fidelity shield, `.docx` round-trip, auth, credit deduction, API key auth, rate limiter, billing webhooks) exits `0` with all tests passing.
5. **Live E2E Smoke Test** against the production Next.js server (`npm run start` on a test port, then stopped cleanly):
   - Sign up a test user → verify 500 free credits granted → hit `/api/rewrite` SSE with a ~120-word AI sample against live **`jamsaq-v1`** on Cerebellum Cloud → confirm valid rewritten output + Fidelity Shield report + credits deducted + **zero text stored in SQLite**!
   - Create an API key → hit `/api/v1/rewrite` with `Bearer pf_sk_...` → confirm `200 OK` JSON response.
   - Test `/api/docx/extract` and `/api/docx/export` round-trip.
6. All Python scripts in `ml/` pass `python3 -m py_compile` and `--help` / `--dry-run` checks cleanly.
7. `git status` is clean (all code committed to `main`, `.env.local` and `*.db` properly gitignored, **zero secrets in git history** verified with a grep check!).
8. Write a clear, plain-English **`OVERNIGHT_REPORT.md`** at the repo root detailing what was built, exact test results, how to run it tomorrow morning, and the exact manual steps for Saquib (connecting live Dodo/Razorpay keys, rotating dev keys, and running `ml/train_hip_v2_lora.py` on a cloud GPU when ready for Phase 2).


---
## Windows VM Notes (`win-desktop`)
- You are running on Windows (`win-desktop`) with `node v22`, `npm`, and `git` installed.
- If `python` is not globally on PATH, use `uv run --python 3.12 python ...` (available at `C:\authormist-test\hip\bin\uv.exe`, already added to PATH) to compile-check and `--dry-run` the `ml/*.py` scripts.
- For SQLite on Windows (`better-sqlite3` may require native C++ build tools if prebuilt binary is missing): prefer pure-JS/WASM SQLite (`sql.js` or Node 22 built-in `node:sqlite` `DatabaseSync`, or `better-sqlite3` ONLY if `npm install` succeeds cleanly without MSVC build errors!). Verify `npm run build` and `npm test` pass cleanly on Windows!
