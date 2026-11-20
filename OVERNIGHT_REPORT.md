# ProseFlow — Overnight Report (Phase A + Phase B complete)

**Built by:** Hermes Agent, overnight build
**Repo:** `C:\hermes\work\humanizer-saas` · branch `main` · committed locally, **nothing pushed**, per rules.
**Status: every claim below was actually executed tonight — commands and exit codes included.**

---

## 0. TL;DR

| Deliverable | Result |
|---|---|
| Phase A SaaS (landing, HIP engine, auth/billing/API, editor) | Done in Phase A — re-verified tonight, still green |
| Phase B `ml/` suite (Work Package 4, 1-pass `jamsaq-v2` training) | **Built tonight — 7 files, all verified** |
| `py_compile` all `ml/*.py` (Python 3.12 via uv AND local 3.14) | **12/12 OK** |
| `--help` + `--dry-run` all 6 scripts | **12/12 exit 0** (no GPU, no deps, no network needed) |
| Live ML smoke vs real `jamsaq-v1` on Cerebellum Cloud | **Ran for real** — 15 teacher calls, fidelity gates proven on both sides (see §2.8) |
| `npx tsc --noEmit` | **exit 0** |
| `npm run lint` | **exit 0** |
| `npm test` (Vitest) | **exit 0 — 79 tests / 9 files, all passing** |
| `npm run build` | **exit 0 — 26 routes** |
| Live E2E vs real `jamsaq-v1` on production server | **39/39 checks passed** (server stopped cleanly) |
| Secret-leak audit (tracked files + full git history) | **Zero secrets.** Live key absent from worktree AND every commit ever made |

---

## 1. What exists now (Phase A recap)

A complete ProseFlow SaaS: Next.js 15 (App Router, TypeScript, Tailwind 4) with the HIP rewriting
engine calling the live `jamsaq-v1` base model on Cerebellum Cloud **only via raw
`POST /v1/completions`** (never chat — enforced by tests), parallel 160–320-word paragraph
chunking, heading passthrough, Fast/Standard/Deep rounds, SSE streaming editor with Option A/B,
Fidelity Shield badges, click-to-regenerate paragraphs, `.docx` upload/export, scrypt auth +
`pf_sk_` API keys, zero-text-retention SQLite (node:sqlite — no native deps), word-credit ledger,
Dodo/Razorpay adapters with verified webhooks + dev simulator, compliance-safe landing page and
legal pages. Details in `src/` and the Phase A commit message
(`git log` — "feat: ProseFlow Phase A").

## 2. What Phase B built tonight: the `ml/` directory (Work Package 4)

The 1-Pass Shortcut Distillation toolkit: everything needed to train the private, commercial-safe
`jamsaq-v2` (Qwen3-4B-Base, Apache 2.0, + LoRA r=128) that rewrites in **one pass (2–3 s)**
instead of 5 rounds (15–20 s), plus the weekly detector-regression alarm.

All six scripts are stdlib-only at import: heavy dependencies (torch/transformers/peft/trl/modal)
are imported lazily, so `--help`/`--dry-run` work on any machine. Artifacts go to
`ml/data/`, `ml/checkpoints/`, `ml/merged/`, `ml/eval/`, `ml/samples/` — all gitignored, so no
datasets or model weights can be committed by accident.

| File | Purpose |
|---|---|
| `ml/README.md` | Plain-English guide: the whole pipeline, exact commands, cost cheat-sheet, troubleshooting |
| `ml/generate_distill_data.py` | Runs AI drafts through the **5-round `jamsaq-v1` teacher** (parallel, proven settings: temp 1.0, top_p 0.95, raw `/v1/completions`, collapse guard), then keeps only pairs passing **strict fidelity gates**: length ratio 0.75–1.30, ≥80% of 4-word phrases rebuilt, 100% quote retention, ≥90% number retention, **zero invented numbers**, optional LLM semantic judge (`--semantic-check`). Writes `{"source","target","style"}` JSONL + a `.rejected.jsonl` with reasons. Style tags: `academic/blog/casual/business` |
| `ml/prepare_human_pairs.py` | Reverse pairs from **genuine pre-2022 human writing**: an ordinary chat LLM (OpenAI/DeepSeek/any OpenAI-compatible via `AIDRAFT_*`) writes the stiff AI-flavored draft of each human chunk; the human original is the target. Same strict gates (quotes, numbers, no near-copies, no draft inventions) |
| `ml/train_hip_v2_lora.py` | LoRA trainer (**r=128, alpha=128**) on `Qwen/Qwen3-4B-Base`. Trains on the exact inference format `<source_text>\n{draft}\n</source_text>\n\n<target_text>\n{clean}\n</target_text>` (+ optional `<style=…>` tag), **loss on the target portion only**. `--dry-run` validates data and prints stats + a full sample with no GPU; `--smoke-test` runs 3 real steps on a 0.6B model; `--balance 2` keeps the ~50/50 human/distilled mix |
| `ml/merge_and_push.py` | **Lossless bfloat16 merge** of the adapter into the base (same precision as `jamsaq-v1`), saves a standalone `jamsaq-v2`, and uploads to Hugging Face **private-only** (public uploads refused — that's the moat) |
| `ml/modal_vllm_fp8.py` | Stage-2 serving: Modal serverless GPU running merged `jamsaq-v2` with **vLLM FP8** (L40S default), OpenAI-compatible `/v1/completions`, 5-min idle scaledown ($0 idle), config via `MODAL_*` env vars, mirrors the current official Modal vLLM pattern |
| `ml/eval_benchmark.py` | The **weekly alarm** (upgraded `reference/eval_benchmark.py`): generates candidates with any model/rounds (`--model jamsaq-v2 --rounds 1` for the 1-pass claim), scores **Pangram** (async task API) + **GPTZero v2** (sha-256-cached), checks **fidelity** vs sources, correlates a free local stiffness proxy (Spearman), and **exits non-zero on regression** for cron |

### 2.8 Live proof the teacher pipeline actually works (not just compiles)

Tonight I ran `generate_distill_data.py` **for real** against live `jamsaq-v1` on Cerebellum
Cloud (`.env.local` key, ~$0.01 total spend). Findings worth knowing:

- **Accept path:** a 185-word draft → 3 rounds → 200 words, **96.2% of 4-word phrases rebuilt**,
  all gates passed → clean `{"source","target","style":"blog"}` pair written to JSONL.
- **Reject path (gates doing their job), each reason seen live at least once:**
  - `quote changed or dropped` — the teacher rephrased a quoted sentence (gate caught it),
  - `length_ratio 1.331 outside [0.75, 1.30]` — the teacher over-expanded a short chunk,
  - `teacher invented new number(s): 2` — the teacher turned "two minutes" into "2 minutes"
    (digit-vs-word formatting counts as drift under the strict spec gates).
- Practical implication for the real training run: **expect a meaningful rejection rate** on short
  chunks; feed it more drafts than the pair target (e.g. ~15k drafts for ~8–10k accepted pairs)
  and prefer 160–320-word chunks. Rejected pairs + reasons land in `*.rejected.jsonl` for review.

## 3. Verification — exact commands and results, tonight

| # | Check | Command | Result |
|---|---|---|---|
| 1 | Byte-compile, uv Python 3.12 | `uv run --python 3.12 python -m py_compile ml/*.py` (each) | **6/6 OK** |
| 2 | Byte-compile, local Python 3.14 | `python -m py_compile ml/*.py` (each) | **6/6 OK** |
| 3 | Help text | `uv run --python 3.12 python ml/<script>.py --help` (each of 6) | **6/6 exit 0** |
| 4 | Dry-run, fresh checkout | each script `--dry-run` with no data present | **6/6 exit 0** — friendly "expected on a fresh checkout" guidance instead of a crash |
| 5 | Dry-run, real fixtures | same, pointing at fixture drafts/pairs in scratch | **6/6 exit 0** — correct chunk stats, cost estimates, and the exact training-format sample |
| 6 | Live teacher smoke | `generate_distill_data.py --rounds 3` vs `jamsaq-v1` | **15 real API calls, accept + all 3 reject gate types demonstrated** (§2.8) |
| 7 | Typecheck | `npx tsc --noEmit` | **exit 0** |
| 8 | Lint | `npm run lint` | **exit 0 — No ESLint warnings or errors** |
| 9 | Tests | `npm test` | **exit 0 — 79 tests, 9 files, all passing** (chunker, fidelity, raw-endpoint guard, auth, credits, zero-retention audit, rate limiter, docx round-trip, webhooks, compliance wording) |
| 10 | Production build | `npm run build` | **exit 0 — 26 routes** |
| 11 | Live E2E (production server, real model) | `npm run start -- -p 3100` then `node scripts/e2e-smoke.mjs http://localhost:3100` | **39/39 PASS**, server stopped cleanly after |

Tonight's live E2E details (real money-path, ~$0.005 model spend): signup → 500 free credits;
SSE rewrite of a 120-word sample in fast mode streamed 3 round-updates, finished in **7.4 s**,
93 words out, **97.4% of 4-word phrases rebuilt**, quotes/numbers kept; credits **500 → 380**
exactly; dev-simulator upgrade → **+250,000**; `pf_sk_` key created → `/api/v1/rewrite` 200 JSON,
credits **250,380 → 250,353** exactly; invalid key → 401; `.docx` export→extract round-trip
identical; **SQLite audit: zero user text in any table** (only anonymous metrics rows).

### 3.1 Secret-leak audit (acceptance criterion)

- **Real-secret formats** (`cb_sk_…`, `hf_…`, `sk-…` with 20+ key chars, plus `Bearer <token>`),
  all tracked files: **zero matches**.
- **The actual live Cerebellum key value**: searched every tracked file **and every blob in the
  entire git history** (`git rev-list --all --objects` walk): **absent everywhere**.
- Naive literal scan for `cb_sk_ / hf_ / sk-` finds exactly two explainable hits, no secrets:
  - `PROMPT_PHASE_B.txt` — the handover prompt itself, which quotes the search patterns as
    instructions;
  - `package-lock.json` — `queue-microtask-1.2.3.tgz` (the "sk-" is inside "ta**sk-1.2**.3").
- Hygiene tightened tonight so even the naive scan has no key-prefix dummies:
  - `.env.example`: placeholder changed from `cb_sk_xxx…` to a neutral `<your Cerebellum Cloud API key>`;
  - `tests/hip-engine.test.ts`: dummy env key `cb_sk_test_key` → `test-key-not-a-secret`
    (test still passes — nothing asserts the prefix).
- `.env.local`, `proseflow.db` (and all `*.db`) are **not tracked**; `.gitignore` now also covers
  all `ml/` artifact directories.

## 4. How to run ProseFlow tomorrow morning

Local:

```bash
cd C:\hermes\work\humanizer-saas
npm install          # only if node_modules is missing
npm run dev          # dev server on http://localhost:3000
# or production:
npm run build && npm run start          # :3000
npm run start -- -p 3100                # different port
node scripts/e2e-smoke.mjs http://localhost:3100   # optional live smoke (spends ~$0.005)
```

The SQLite database (`proseflow.db`) is created on first request. `.env.local` already has the
live Cerebellum key, `jamsaq-v1`, 6 workers, a session secret, and `DEV_BILLING_SIMULATOR=true`.

Vercel:

1. Push the repo to GitHub (your call — nothing was pushed tonight, per rules).
2. Import it in Vercel (framework auto-detects Next.js; build `npm run build`).
3. Set the env vars from `.env.local` in the Vercel dashboard: `CEREBELLUM_API_KEY`,
   `HIP_BACKEND_URL`, `HIP_BACKEND_MODE=openai`, `HIP_MODEL_NAME`, `HIP_WORKERS`,
   `SESSION_SECRET` (a fresh one — see checklist), `APP_URL=https://your-domain`,
   `DEV_BILLING_SIMULATOR=false` once billing keys are in, plus the Dodo/Razorpay keys below.
4. Note: SQLite works for a single-instance demo; the repository layer in `src/lib/db.ts` is
   deliberately thin — plan the Supabase/Postgres swap before scaling beyond one instance.

Any Node 22 host works the same way (`npm run build` + `npm start`).

## 5. The `jamsaq-v2` pipeline — quick command reference (see `ml/README.md`)

```bash
# 1) Collect ~5-15k AI drafts -> ml/data/ai_drafts.jsonl  (style tags optional)
uv run --python 3.12 python ml/generate_distill_data.py --input ml/data/ai_drafts.jsonl --dry-run
uv run --python 3.12 python ml/generate_distill_data.py --input ml/data/ai_drafts.jsonl

# 2) Collect genuine pre-2022 human texts -> ml/samples/human/{blog,academic,...}/*.txt
export OPENAI_API_KEY=<your key>
uv run --python 3.12 python ml/prepare_human_pairs.py --input ml/samples/human --provider openai

# 3) Train on a rented 24GB+ GPU box (torch/transformers/peft/trl installed there)
python ml/train_hip_v2_lora.py --dry-run
python ml/train_hip_v2_lora.py --data ml/data/distill_train.jsonl ml/data/human_reverse_pairs.jsonl --epochs 2

# 4) Merge (bf16, lossless) and optionally push privately
python ml/merge_and_push.py --push-to yourusername/jamsaq-v2     # needs HF_TOKEN

# 5) Serve: upload merged folder to Cerebellum Cloud, then in .env.local: HIP_MODEL_NAME=jamsaq-v2
#    or Stage 2:  modal deploy ml/modal_vllm_fp8.py   (see ml/README.md Step 6)

# 6) Weekly regression alarm (cron / Task Scheduler; non-zero exit = retrain)
uv run --python 3.12 python ml/eval_benchmark.py --model jamsaq-v2 --rounds 1 --detectors pangram gptzero --report
```

Budget: ~$25–45 for a full cycle (teacher tokens ~$10-12, chat drafts ~$1-3, GPU ~$12-30);
repeatable in ~2 hours whenever a detector updates.

## 6. Manual checklist for Saquib

**Go-live (billing):**
1. **Dodo Payments** (global MoR): create products for Starter/Pro/Business → set
   `DODO_PAYMENTS_API_KEY`, `DODO_PRODUCT_ID_STARTER/PRO/BUSINESS`, `DODO_PAYMENTS_WEBHOOK_KEY`;
   point the dashboard webhook at `https://your-domain/api/billing/webhook/dodo`.
2. **Razorpay** (India): `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`;
   webhook → `https://your-domain/api/billing/webhook/razorpay`. INR checkouts auto-route to it.
3. Set `DEV_BILLING_SIMULATOR=false` and `APP_URL=https://your-domain` once real keys are in.
4. **Rotate `SESSION_SECRET`** before real customers exist (`openssl rand -hex 32`). Rotating logs
   everyone out — safe now. The Cerebellum key can be rotated from their dashboard.

**Model / Phase 2 (when ready, ~1 day of your involvement):**
5. Collect AI drafts (Step 1 above) and confirm rights-cleared **pre-2022** human texts — never
   ProseFlow customer text (zero-retention promise).
6. Rent an A100/H100 (RunPod/Vast/Lambda), run Steps 1–4 of §5. Use `--dry-run` everywhere
   first; run `train_hip_v2_lora.py --smoke-test` before the real training.
7. Upload the merged `ml/merged/jamsaq-v2` to Cerebellum Cloud as a new model, test it, then
   flip `HIP_MODEL_NAME=jamsaq-v2` in `.env.local` (no code change). Keep `jamsaq-v1` as fallback.
8. **Keep the Hugging Face repo private** — the script enforces it; don't work around it. Public
   weights would hand detector vendors the model.
9. Put 10–20 varied AI samples in `ml/samples/ai/`, add `PANGRAM_API_KEY` + `GPTZERO_API_KEY`
   to `.env.local`, and schedule `ml/eval_benchmark.py` weekly (Task Scheduler or the cron on
   whatever box runs it). A non-zero exit means a detector updated → retrain per §5.
10. Optional hardening: Modal proxy auth for the vLLM endpoint
    (`MODAL_UNAUTHENTICATED=false`), and consider an "Instant (1 pass)" UI mode once `jamsaq-v2`
    is live — it's a small rounds-config change in `src/lib/hip-engine.ts` + brand copy.

## 7. Known limits (honest list)

- Phase A limits unchanged: in-memory rate limiter/session store (single instance by design);
  Razorpay uses Orders API per cycle (move to Subscription plans for auto-renewing UPI);
  monthly credits are a cumulative balance, not a hard calendar reset.
- The `ml/` suite is **verified end-to-end for everything runnable without a GPU** (compiles,
  dry-runs, live teacher + gates). The trainer/merge/Modal steps require a GPU box and were
  validated structurally (`--dry-run`, `--check`) and against the current official
  Modal/vLLM/TRL patterns — they are expected to run as written but are not GPU-executed here.
- Live teacher smoke showed the strict gates reject short (<150-word) chunks often (§2.8) —
  plan input volume accordingly; rejections with reasons are written for review.
- The eval benchmark's local stiffness proxy is a heuristic; its Spearman ρ vs the paid
  detectors is printed each run — use it as a canary between weekly paid runs.

## 8. Git state

All Phase B work committed to local `main` (ml/ suite, `.gitignore` artifact rules, secret-hygiene
edits to `.env.example` and the engine test's dummy key, this report). **Nothing pushed.**
Working tree clean after the commit; `.env.local`, `*.db`, and all `ml/` artifact directories
ignored; zero secrets in tracked files or history (§3.1).
