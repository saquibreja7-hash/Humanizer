# ml/ — Training `jamsaq-v2`, the 1-Pass Private Model (Work Package 4)

This folder contains everything needed to turn the proven-but-slow `jamsaq-v1`
(5 sequential rewriting rounds, 15-20 seconds per document) into a private
`jamsaq-v2` that produces the same quality rewrite in **one pass — 2-3
seconds** — plus the weekly benchmark that watches for detector regressions.

The trick is **shortcut distillation**: do the slow 5-round work *offline,
once*, on a few thousand drafts, and teach a fresh model to jump straight from
"stiff AI draft" to "final clean output" in a single call. Half the training
data also comes from *real pre-2022 human writing*, so the model learns
genuine human rhythm, not an imitation of it.

```
 AI drafts ──► generate_distill_data.py ──► distill_train.jsonl ─┐
 (any LLM)      (5-round jamsaq-v1 teacher,                        ├─► train_hip_v2_lora.py
                strict fidelity gates)                             │     (Qwen3-4B-Base + LoRA r=128)
                                                                   │        │
 pre-2022 ──► prepare_human_pairs.py ──► human_reverse_pairs.jsonl┘        ▼
 human text    (chat LLM writes the stiff                      merge_and_push.py (lossless bf16)
               "AI draft" of it)                                     │
                                          ┌─────────────────────────┴─────────────────┐
                                          ▼                                           ▼
                              Cerebellum Cloud (Stage 1)              ml/modal_vllm_fp8.py (Stage 2)
                              upload merged model, $0 idle             Modal vLLM FP8, $0 idle, 4x cheaper
                                          └───────────────┬─────────────────────────┘
                                                          ▼
                                            eval_benchmark.py (weekly Pangram+GPTZero+fidelity alarm)
```

## The files

| File | What it does | Needs GPU? |
|---|---|---|
| `generate_distill_data.py` | Runs drafts through the 5-round `jamsaq-v1` teacher (parallel), keeps only pairs that pass strict fidelity gates, writes training JSONL | No (API calls to Cerebellum) |
| `prepare_human_pairs.py` | Turns genuine pre-2022 human text into reverse pairs: a chat LLM writes the stiff "AI draft", the human text is the target | No (chat API) |
| `train_hip_v2_lora.py` | Trains the private LoRA (r=128, alpha=128) on `Qwen/Qwen3-4B-Base` (Apache 2.0); `--dry-run` needs no GPU/deps | Yes for the real run |
| `merge_and_push.py` | Lossless bfloat16 merge of LoRA into the base model + private Hugging Face upload | No (CPU, ~16GB RAM) |
| `modal_vllm_fp8.py` | Deploys merged `jamsaq-v2` on Modal serverless GPUs with vLLM in FP8, OpenAI-compatible `/v1/completions` | Modal's GPUs |
| `eval_benchmark.py` | Weekly regression harness: generates candidates with any model/rounds, scores Pangram + GPTZero, checks fidelity, correlates a free local proxy, exits non-zero on regression | No (API calls) |
| `README.md` | This guide | — |

All six scripts are **stdlib-only at import time** — `--help` and `--dry-run`
work on a laptop with zero ML packages installed. Heavy dependencies
(torch/transformers/peft/trl/modal) are imported lazily and only needed on the
box where that step actually runs.

## Running on this Windows VM (`win-desktop`)

Python is invoked through `uv` (spec: Windows VM Notes):

```
uv run --python 3.12 python ml/generate_distill_data.py --help
uv run --python 3.12 python ml/train_hip_v2_lora.py --dry-run
```

Every script was verified here with `py_compile`, `--help`, and `--dry-run`
(all exit 0, no network, no keys). Generated data, checkpoints, merged models
and eval artifacts default to `ml/data/`, `ml/checkpoints/`, `ml/merged/`,
`ml/eval/` — all gitignored, so no bulky or private data can be committed
accidentally. Keys come from `.env.local` (gitignored) or real environment
variables; nothing is ever hardcoded.

---

## Step 0 — prerequisites

**Data generation + benchmark (this VM or anywhere):**
- The `.env.local` at the repo root already has `CEREBELLUM_API_KEY`,
  `HIP_BACKEND_URL=https://api.cerebellumlabs.ai`, `HIP_MODEL_NAME=jamsaq-v1`.
- For `prepare_human_pairs.py`: an ordinary chat LLM key — `OPENAI_API_KEY`
  or `DEEPSEEK_API_KEY` (or any OpenAI-compatible endpoint via
  `AIDRAFT_API_KEY` / `AIDRAFT_BASE_URL` / `AIDRAFT_MODEL`).
- For `eval_benchmark.py`: `PANGRAM_API_KEY` and `GPTZERO_API_KEY`.

**Training (rented GPU box — RunPod / Vast / Modal / Lambda):**
- 1x 24GB GPU (L4 / L40S / RTX 4090) is enough for a 4B base + r=128 LoRA
  with gradient checkpointing; A100/H100 finishes faster.
- Software: `pip install "torch>=2.4" "transformers>=4.45" "peft>=0.13"
  "trl>=0.13" "datasets>=3.0" "accelerate>=1.0"`
- Expected cost: **$12-30 total** for 8-15k pairs, 2 epochs (2-4 h on 1 A100).

## Step 1 — collect AI drafts (~5,000-10,000)

Create one of:

```
ml/data/ai_drafts.jsonl      # one JSON object per line:
{"text": "The quarterly review demonstrated that operational efficiency improved...", "style": "blog"}
```
or a directory (`ml/data/ai_drafts/blog/*.txt`, `.../academic/*.txt`, ...) —
the subfolder name becomes the style tag.

Where drafts come from: generate them with any chat LLM (blog intros, product
blurbs, email drafts, summaries — the kind of text ProseFlow users actually
paste). Mix topics and lengths (150-320 word paragraphs are ideal). Style
tags (`academic` `blog` `casual` `business`) are optional but unlock the
tone-selector feature later.

Sanity check (free):

```
uv run --python 3.12 python ml/generate_distill_data.py --input ml/data/ai_drafts.jsonl --dry-run
```

You'll see how many chunks were found and the estimated teacher cost before
spending a cent.

## Step 2 — distill with the 5-round teacher

```
uv run --python 3.12 python ml/generate_distill_data.py \
    --input ml/data/ai_drafts.jsonl \
    --output ml/data/distill_train.jsonl
```

- Proven settings by default: `temperature 1.0`, `top_p 0.95`, 5 rounds, raw
  `POST /v1/completions` (never chat), 6 parallel workers, collapse guard.
- Every pair must pass the strict gates (length ratio 0.75-1.30, >=80% of
  4-word phrases rebuilt, 100% quote retention, >=90% number retention, zero
  invented numbers). Rejected pairs + reasons land in
  `distill_train.jsonl.rejected.jsonl` so you can see what the teacher got
  wrong.
- `--limit 5 --rounds 1` gives a ~1-cent smoke run before the real thing.
- Expect a 70-90% acceptance rate. Lower means something's off (check
  `--temperature`; it must be 1.0).
- Optional extra filter: `--semantic-check` asks an LLM judge
  (`JUDGE_API_KEY`/`JUDGE_BASE_URL`/`JUDGE_MODEL`) to confirm meaning.

## Step 3 — real-human reverse pairs (~5,000-10,000, ~50% of the mix)

Gather genuine **pre-2022** human writing (before ChatGPT existed): public-
domain essays and books, your own old blog posts/newsletters, licensed
corpora. Sort by style:

```
ml/samples/human/blog/2019_post.txt
ml/samples/human/academic/2016_essay.txt
```

Then:

```
export OPENAI_API_KEY=<your OpenAI key>          # or DEEPSEEK_API_KEY
uv run --python 3.12 python ml/prepare_human_pairs.py \
    --input ml/samples/human --provider openai \
    --output ml/data/human_reverse_pairs.jsonl
```

The chat LLM writes a stiff AI-flavored draft of each human chunk; the pair
(draft -> original human text) trains the model toward *authentic* phrasing.
The same fidelity gates apply (no dropped quotes, no number drift, and the
draft must actually be a rewrite — near-copies are rejected).

**Privacy rules:** never use ProseFlow customer text (zero-retention promise),
never use paywalled content you don't have rights to, and remember everything
here stays private — never push datasets to public HF repos.

## Step 4 — train the LoRA

```
# 1. Validate data + see the EXACT training format (no GPU needed)
uv run --python 3.12 python ml/train_hip_v2_lora.py --dry-run

# 2. Smoke test on the GPU box (tiny 0.6B model, 3 steps — proves the pipeline)
python ml/train_hip_v2_lora.py --smoke-test

# 3. Real run (GPU box)
python ml/train_hip_v2_lora.py \
    --data ml/data/distill_train.jsonl ml/data/human_reverse_pairs.jsonl \
    --epochs 2 --output-dir ml/checkpoints/hip-v2-lora
```

- `--balance 2` caps any one data file at 2x the smallest, keeping a ~50/50
  human/distilled mix.
- Loss is computed on the **target portion only** — the model learns to
  produce the clean rewrite, not to copy the draft.
- The training format matches inference exactly:
  `<source_text>\n{draft}\n</source_text>\n\n<target_text>\n{clean}\n</target_text>`
  with an optional `<style=blog>` prefix line.
- Save the trainer log; loss should fall from ~2.5 to below ~1.2 and flatten.

## Step 5 — merge + private push

```
# Plan only (works anywhere):
uv run --python 3.12 python ml/merge_and_push.py --dry-run

# Real merge (CPU ok, ~16GB RAM, needs torch/transformers/peft):
python ml/merge_and_push.py --adapter ml/checkpoints/hip-v2-lora \
    --base Qwen/Qwen3-4B-Base --output ml/merged/jamsaq-v2

# Optionally upload PRIVATELY (HF write token required):
export HF_TOKEN=<your HF write token>
python ml/merge_and_push.py --push-to yourusername/jamsaq-v2
```

The merge is **lossless bfloat16** — the same precision `jamsaq-v1` was merged
in. The upload is **private-only on purpose**: public weights would hand
detector companies (and competitors) the model overnight. Public uploads are
refused by the script.

## Step 6 — deploy

**Option A — Cerebellum Cloud (Stage 1, start here):** upload the merged
`ml/merged/jamsaq-v2` folder as a new model in the Cerebellum dashboard,
then switch the SaaS over in `.env.local`:

```
HIP_MODEL_NAME=jamsaq-v2
```

No code changes needed — the engine already calls raw `/v1/completions`.
With a 1-pass model, even Fast mode (3 rounds) converges instantly and the
per-paragraph Regenerate button effectively adds extra passes where needed.
(A dedicated rounds=1 "Instant" mode is a small future config change in
`src/lib/hip-engine.ts` if you want it.)

**Option B — Modal vLLM FP8 (Stage 2, when volume grows):**

```
pip install modal && modal setup
modal secret create huggingface HF_TOKEN=<your HF write token>   # once
export MODAL_MODEL_ID=yourusername/jamsaq-v2
python ml/modal_vllm_fp8.py --check      # readiness checklist
modal deploy ml/modal_vllm_fp8.py         # or: python ml/modal_vllm_fp8.py --deploy
```

Copy the printed `*.modal.direct` URL into `.env.local` as `HIP_BACKEND_URL`
(keep `HIP_MODEL_NAME=jamsaq-v2`). Defaults: L40S GPU, FP8 quantization
(near-lossless 8-bit — 4-bit measurably hurt quality in earlier tests),
5-minute idle scaledown ($0 idle), 8k context. Tune via the `MODAL_*` env
vars documented in the script.

## Step 7 — the weekly regression alarm

```
# jamsaq-v1 baseline (5-round):
uv run --python 3.12 python ml/eval_benchmark.py --detectors pangram gptzero --report

# jamsaq-v2 1-pass (the speed claim under test):
uv run --python 3.12 python ml/eval_benchmark.py --model jamsaq-v2 --rounds 1 \
    --detectors pangram gptzero --report
```

Put AI-written sample documents in `ml/samples/ai/*.txt` first (10-20 varied
samples, 150-400 words each, is plenty). The benchmark:

1. generates rewrites through the model under test (or scores
   `--candidates <dir>` of existing outputs),
2. scores **Pangram** (fraction AI + AI-assisted) and **GPTZero v2**
   (document probability + flagged sentences) — results cached by text hash,
   so re-runs are free,
3. checks **fidelity** vs the sources (>=80% phrases rebuilt, quotes/numbers
   kept, sane length ratio),
4. correlates a free local "stiffness" proxy with the paid detectors
   (Spearman), so you can spot drift on days you skip paid calls,
5. **exits non-zero if any candidate fails** — perfect for a weekly cron /
   Task Scheduler job: a non-zero exit means "a detector updated; retrain
   `jamsaq-v2`" (the 2-hour LoRA retrain path is Steps 1-5 again).

## Cost cheat-sheet (per full training cycle)

| Step | Rough cost |
|---|---|
| Teacher distillation (10k drafts x 5 rounds, ~2.2M words) | ~$10-12 Cerebellum tokens |
| Human reverse pairs (10k chunks via gpt-4o-mini/DeepSeek) | ~$1-3 |
| LoRA training (1x A100, 2-4 h) | ~$12-30 |
| TOTAL (one-time, repeatable weekly if a detector updates) | **~$25-45** |
| Serving (Cerebellum) | $0 idle; ~$0.32 per 75k Pro user |
| Serving (Modal FP8) | $0 idle; ~$0.08 per 75k Pro user |

## Troubleshooting

- `--dry-run` everywhere: every script plans before it spends.
- Teacher pairs rejected en masse -> temperature must be 1.0; check
  `HIP_BACKEND_URL`/model name; look at the `.rejected.jsonl` reasons.
- `train_hip_v2_lora.py` says deps missing -> you're on the wrong box (or use
  `--dry-run` there).
- Merge runs out of RAM -> close other apps; bf16 4B needs ~16GB; or merge on
  the GPU box.
- Modal cold starts too slow -> raise `MODAL_SCALEDOWN_WINDOW` or keep one
  warm replica during peak hours.
- Pangram/GPTZero scores creep up (weekly alarm fires) -> detectors updated;
  regenerate data with the (still strong) multi-round teacher, retrain,
  redeploy — that's the whole moat loop this folder automates.
