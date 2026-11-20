#!/usr/bin/env python3
"""Train the private `jamsaq-v2` LoRA on Qwen3-4B-Base (1-pass shortcut distillation).

What this does (plain English):
  `jamsaq-v1` is accurate but slow: it rewrites a text 5 times in a row, so a
  document takes 15-20 seconds. This script teaches a fresh private student
  model — Qwen/Qwen3-4B-Base (Apache 2.0, commercial-safe) plus a LoRA adapter
  (r=128) — to make the SAME kind of rewrite in ONE pass (2-3 seconds).

  Training examples are exactly the pairs produced by the other two scripts:
    ml/generate_distill_data.py  ->  {"source": AI draft, "target": 5-round teacher rewrite}
    ml/prepare_human_pairs.py    ->  {"source": stiff AI draft, "target": real pre-2022 human text}

  Each pair is formatted the SAME way the live model is prompted at inference:

    <source_text>
    {AI draft}
    </source_text>

    <target_text>
    {final clean human-sounding output}
    </target_text>

  optionally prefixed with a style tag (`<style=blog>` etc.) so paying users can
  pick a tone. Loss is computed on the TARGET portion only (completion-only),
  so the model learns to produce the rewrite, not to copy the draft.

Hardware: needs a GPU box (1x A100/H100 recommended; ~24GB VRAM is enough for
4B bf16 + r=128 LoRA with gradient checkpointing). Install there:
  pip install "torch>=2.4" "transformers>=4.45" "peft>=0.13" "trl>=0.13" \
      "datasets>=3.0" "accelerate>=1.0"

On this Windows VM there is no GPU — and that's fine:
  --dry-run validates data, formats, and prints full statistics WITHOUT any
  heavy dependency or GPU (pure stdlib). --help works everywhere too.

Examples:
  # Validate data + show the exact training format (no GPU, no torch needed)
  python ml/train_hip_v2_lora.py --dry-run

  # 3-step smoke test on a tiny base model (needs the pip installs above)
  python ml/train_hip_v2_lora.py --smoke-test

  # Real training run (on the rented GPU box)
  python ml/train_hip_v2_lora.py --data ml/data/distill_train.jsonl \
      ml/data/human_reverse_pairs.jsonl --epochs 2 --output-dir ml/checkpoints/hip-v2-lora
"""
from __future__ import annotations

import argparse
import json
import math
import os
import pathlib
import sys
from collections import Counter
from typing import Any

ROOT = pathlib.Path(__file__).resolve().parent.parent

DEFAULT_BASE_MODEL = "Qwen/Qwen3-4B-Base"      # Apache 2.0
SMOKE_BASE_MODEL = "Qwen/Qwen3-0.6B"           # tiny stand-in for smoke tests
DEFAULT_DATA = [
    ROOT / "ml/data/distill_train.jsonl",
    ROOT / "ml/data/human_reverse_pairs.jsonl",
]

VALID_STYLES = ("academic", "blog", "casual", "business")
TOKENS_PER_WORD = 1.4  # rough Qwen3 tokenizer estimate for stats only


# ---------------------------------------------------------------------------
# Data loading + the exact training format (shared by dry-run and real run)
# ---------------------------------------------------------------------------

def build_prompt(source: str, style: str | None, style_tags: bool) -> str:
    """Inference-side prompt — must match what the SaaS engine will send."""
    prefix = f"<style={style}>\n" if (style_tags and style) else ""
    return (f"{prefix}<source_text>\n{source.strip()}\n</source_text>\n\n<target_text>\n")


def build_completion(target: str, eos_token: str = "") -> str:
    return f"{target.strip()}\n</target_text>{eos_token}"


def load_pairs(paths: list[pathlib.Path]) -> list[dict[str, Any]]:
    pairs: list[dict[str, Any]] = []
    for path in paths:
        if not path.is_file():
            continue
        for ln, line in enumerate(path.read_text(encoding="utf-8", errors="ignore").splitlines(), 1):
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
            except json.JSONDecodeError as e:
                raise ValueError(f"{path}:{ln}: not valid JSON ({e})") from e
            src = (obj.get("source") or "").strip()
            tgt = (obj.get("target") or "").strip()
            if not src or not tgt:
                raise ValueError(f"{path}:{ln}: pair needs non-empty 'source' and 'target'")
            style = str(obj.get("style") or "").strip().lower() or None
            if style and style not in VALID_STYLES:
                style = None
            pairs.append({"source": src, "target": tgt, "style": style,
                         "_origin": path.name})
    return pairs


def balance_datasets(pairs: list[dict[str, Any]], max_ratio: float) -> list[dict[str, Any]]:
    """Downsample big files so no single data source dominates (see --balance)."""
    by_origin: dict[str, list[dict[str, Any]]] = {}
    for p in pairs:
        by_origin.setdefault(p["_origin"], []).append(p)
    if len(by_origin) < 2:
        return pairs
    counts = {k: len(v) for k, v in by_origin.items()}
    cap = max(counts.values())
    if max(counts.values()) > max_ratio * min(counts.values()):
        cap = int(max_ratio * min(counts.values()))
        print(f"--balance: capping each data file at {cap:,} pairs "
              f"(files were {json.dumps(counts)})")
    out: list[dict[str, Any]] = []
    for rows in by_origin.values():
        out.extend(rows[:cap])
    return out


# ---------------------------------------------------------------------------
# Dry-run: pure stdlib statistics + format preview
# ---------------------------------------------------------------------------

def dry_run(args: argparse.Namespace, paths: list[pathlib.Path]) -> int:
    existing = [p for p in paths if p.is_file()]
    if not existing:
        print("No training data found. Expected either of:")
        for p in DEFAULT_DATA:
            print(f"  {p}")
        print("Generate it first (see ml/README.md):")
        print("  python ml/generate_distill_data.py --input <drafts> --output ml/data/distill_train.jsonl")
        print("  python ml/prepare_human_pairs.py --input ml/samples/human --output ml/data/human_reverse_pairs.jsonl")
        print("(this message is expected on a fresh checkout; re-run with --data <file.jsonl>)")
        return 0

    try:
        pairs = load_pairs(existing)
    except ValueError as e:
        print(f"ERROR: {e}", file=sys.stderr)
        return 2
    if not pairs:
        print("ERROR: data files exist but contain no pairs.", file=sys.stderr)
        return 2
    if args.balance:
        pairs = balance_datasets(pairs, args.balance)

    src_w = [len(p["source"].split()) for p in pairs]
    tgt_w = [len(p["target"].split()) for p in pairs]
    est_tokens = int((sum(src_w) + sum(tgt_w)) * TOKENS_PER_WORD + len(pairs) * 20)
    batch = args.batch_size * args.grad_accum
    steps_per_epoch = math.ceil(len(pairs) / batch)
    total_steps = steps_per_epoch * args.epochs

    origins = Counter(p["_origin"] for p in pairs)
    styles = Counter(p["style"] or "(none)" for p in pairs)

    print(f"Data files: {[str(p) for p in existing]}")
    print(f"Pairs: {len(pairs):,}  (per file: {json.dumps(dict(origins))})")
    print(f"Style tags: {json.dumps(dict(styles))}")
    print(f"Source words: avg {sum(src_w)//len(src_w)}, max {max(src_w)} | "
          f"Target words: avg {sum(tgt_w)//len(tgt_w)}, max {max(tgt_w)}")
    print(f"Estimated tokens (pairs only): ~{est_tokens:,}")
    print(f"Schedule: {args.epochs} epoch(s) x batch {args.batch_size} x "
          f"grad-accum {args.grad_accum} = {total_steps} optimizer steps")
    print(f"LoRA: r={args.lora_r} alpha={args.lora_alpha} dropout={args.lora_dropout} "
          f"on q/k/v/o/gate/up/down projections of {args.base_model}")
    print("VRAM: ~16-24GB fits (bf16 4B weights + r=128 adapter + grad checkpointing); "
          "1x A100 trains ~8-15k pairs in 2-4h.")

    print("\n--- Example training sample (exactly what the model sees) ---")
    ex = pairs[0]
    print(build_prompt(ex["source"], ex["style"], style_tags=args.style_tags) +
          build_completion(ex["target"], eos_token="<|endoftext|>"))
    print("--- end sample ---")

    print("\nDRY RUN OK — data is valid and the format above is what will be trained.")
    print("Next: run this script on a GPU box with torch/transformers/peft/trl installed.")
    return 0


# ---------------------------------------------------------------------------
# Real training (heavy imports only happen here)
# ---------------------------------------------------------------------------

def train(args: argparse.Namespace, paths: list[pathlib.Path]) -> int:
    try:
        import torch
        from transformers import AutoTokenizer
        from trl import SFTConfig, SFTTrainer
        from peft import LoraConfig
        from datasets import Dataset
        from dataclasses import fields as dataclass_fields
    except ImportError as e:
        print(f"ERROR: training dependencies missing ({e}).\n"
              f"Install on the GPU box:\n"
              f"  pip install \"torch>=2.4\" \"transformers>=4.45\" \"peft>=0.13\" "
              f"\"trl>=0.13\" \"datasets>=3.0\" \"accelerate>=1.0\"\n"
              f"(or use --dry-run, which needs nothing)", file=sys.stderr)
        return 2

    pairs = load_pairs([p for p in paths if p.is_file()])
    if not pairs:
        print("ERROR: no training pairs found. Run the two data scripts first "
              "(or pass --data). Use --dry-run to inspect.", file=sys.stderr)
        return 2
    if args.balance:
        pairs = balance_datasets(pairs, args.balance)

    base_model = SMOKE_BASE_MODEL if (args.smoke_test and args.base_model == DEFAULT_BASE_MODEL) else args.base_model
    has_cuda = torch.cuda.is_available()

    rows = []
    for p in pairs:
        rows.append({
            "prompt": build_prompt(p["source"], p["style"], style_tags=args.style_tags),
            "completion": build_completion(p["target"]),
        })
    dataset = Dataset.from_list(rows)
    print(f"Loaded {len(dataset):,} pairs from {[p.name for p in paths if p.is_file()]}")

    tokenizer = AutoTokenizer.from_pretrained(base_model)
    if tokenizer.pad_token_id is None:
        tokenizer.pad_token = tokenizer.eos_token

    lora_config = LoraConfig(
        r=args.lora_r,
        lora_alpha=args.lora_alpha,
        lora_dropout=args.lora_dropout,
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj",
                         "gate_proj", "up_proj", "down_proj"],
        bias="none",
        task_type="CAUSAL_LM",
    )

    # TRL renamed a few SFTConfig fields across versions — only pass what exists.
    wanted = {
        "output_dir": str(args.output_dir),
        "num_train_epochs": args.epochs,
        "max_steps": 3 if args.smoke_test else -1,
        "per_device_train_batch_size": args.batch_size,
        "gradient_accumulation_steps": args.grad_accum,
        "learning_rate": 2e-4 if args.smoke_test else args.lr,
        "lr_scheduler_type": "cosine",
        "warmup_ratio": args.warmup_ratio,
        "logging_steps": 5 if args.smoke_test else 10,
        "save_strategy": "steps",
        "save_steps": 500,
        "save_total_limit": 2,
        "report_to": "none",
        "seed": 42,
        "max_length": args.max_length,          # TRL >= 0.13
        "packing": False,                       # never pack: pairs must stay whole
        "gradient_checkpointing": True,
        "gradient_checkpointing_kwargs": {"use_reentrant": False},
        "dataset_num_proc": 4,
    }
    supported = {f.name for f in dataclass_fields(SFTConfig)}
    if "max_seq_length" in supported and "max_length" not in supported:
        wanted["max_seq_length"] = wanted.pop("max_length")
    dropped = [k for k in wanted if k not in supported]
    for k in dropped:
        wanted.pop(k)
    if dropped:
        print(f"(note: this TRL version does not support {dropped}; skipped)")
    if has_cuda and torch.cuda.is_bf16_supported():
        wanted["bf16"] = True
    cfg = SFTConfig(**wanted)

    if args.smoke_test:
        print("\n*** SMOKE TEST: 3 steps on a tiny base model — verifies the whole "
              "pipeline end-to-end, NOT a quality run. ***\n")

    trainer = SFTTrainer(
        model=base_model,
        args=cfg,
        train_dataset=dataset,
        processing_class=tokenizer,
        peft_config=lora_config,
    )

    # TRL computes loss on the completion (target) portion only for
    # prompt-completion datasets — exactly what we want: learn to write the
    # clean rewrite, not to copy the draft.

    trainer.train()

    trainer.save_model(str(args.output_dir))
    tokenizer.save_pretrained(str(args.output_dir))
    print(f"\nSaved LoRA adapter + tokenizer to {args.output_dir}")
    print("Next: python ml/merge_and_push.py --adapter " + str(args.output_dir))
    return 0


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> int:
    for name in (".env.local", ".env"):
        p = ROOT / name
        if not p.is_file():
            continue
        for raw in p.read_text(encoding="utf-8", errors="ignore").splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            k, v = k.strip(), v.strip().strip('"').strip("'")
            if k and k not in os.environ:
                os.environ[k] = v

    ap = argparse.ArgumentParser(
        description="Train the private jamsaq-v2 LoRA (r=128) on Qwen3-4B-Base.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="See ml/README.md for the full walkthrough.")
    ap.add_argument("--data", nargs="+", type=pathlib.Path, default=None,
                    help=f"Training pair JSONL file(s) (default: {[str(p.relative_to(ROOT)) for p in DEFAULT_DATA]})")
    ap.add_argument("--base-model", default=DEFAULT_BASE_MODEL,
                    help="HF model id of the base (default: %(default)s, Apache 2.0)")
    ap.add_argument("--output-dir", type=pathlib.Path,
                    default=pathlib.Path("ml/checkpoints/hip-v2-lora"),
                    help="Where to save the trained adapter (default: %(default)s)")
    ap.add_argument("--lora-r", type=int, default=128, help="LoRA rank (default: %(default)s)")
    ap.add_argument("--lora-alpha", type=int, default=128, help="LoRA alpha (default: %(default)s)")
    ap.add_argument("--lora-dropout", type=float, default=0.05)
    ap.add_argument("--epochs", type=int, default=2)
    ap.add_argument("--batch-size", type=int, default=1)
    ap.add_argument("--grad-accum", type=int, default=16)
    ap.add_argument("--lr", type=float, default=1e-4)
    ap.add_argument("--warmup-ratio", type=float, default=0.03)
    ap.add_argument("--max-length", type=int, default=2048,
                    help="Max prompt+completion tokens (default: %(default)s)")
    ap.add_argument("--no-style-tags", action="store_true",
                    help="Strip <style=...> tags from training (train one neutral voice)")
    ap.add_argument("--balance", type=float, default=None, metavar="MAX_RATIO",
                    help="Downsample large data files so no source exceeds "
                         "MAX_RATIO x the smallest (e.g. --balance 2 keeps ~50/50 mix)")
    ap.add_argument("--dry-run", action="store_true",
                    help="Validate data + print the exact training format; no GPU, "
                         "no torch, no network needed")
    ap.add_argument("--smoke-test", action="store_true",
                    help="Real 3-step run on a tiny 0.6B base model — end-to-end "
                         "pipeline check (needs torch/trl/peft installed)")
    args = ap.parse_args()

    paths = args.data if args.data else DEFAULT_DATA
    style_tags = not args.no_style_tags
    args.style_tags = style_tags  # used by dry_run/train via args

    if args.dry_run:
        return dry_run(args, paths)
    return train(args, paths)


if __name__ == "__main__":
    raise SystemExit(main())
