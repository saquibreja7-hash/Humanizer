#!/usr/bin/env python3
"""Merge the trained LoRA into the base model (lossless bfloat16) and optionally
upload the result as a PRIVATE Hugging Face repo.

What this does (plain English):
  A LoRA adapter is a small "patch" file. Cerebellum Cloud (and most serving
  stacks) want ONE self-contained model. This script downloads Qwen/Qwen3-4B-Base
  (Apache 2.0), applies your private jamsaq-v2 adapter on top in bfloat16 —
  the same numeric precision the proven jamsaq-v1 was merged in, so there is
  ZERO quality loss — and saves a standalone `jamsaq-v2` folder you can serve
  anywhere.

  It can then push that folder to Hugging Face as a PRIVATE repo (the moat:
  public adapters can be downloaded by anyone, including AI-detector vendors —
  see MASTER_PLAN.md section 3). Public uploads are deliberately unsupported.

Hardware: merging runs fine on CPU (no GPU needed) with ~16GB free RAM.
Needs the heavy libs on the machine where you merge:
  pip install "torch>=2.4" "transformers>=4.45" "peft>=0.13" "huggingface_hub>=0.26"

Examples:
  # Plan only — no downloads, no heavy imports, works anywhere
  python ml/merge_and_push.py --dry-run

  # Real merge on the GPU/CPU box
  python ml/merge_and_push.py --adapter ml/checkpoints/hip-v2-lora \
      --base Qwen/Qwen3-4B-Base --output ml/merged/jamsaq-v2

  # Merge AND upload privately (HF_TOKEN env or --hf-token)
  export HF_TOKEN=<your HF write token>   # from huggingface.co/settings/tokens
  python ml/merge_and_push.py --push-to yourname/jamsaq-v2
"""
from __future__ import annotations

import argparse
import os
import pathlib
import sys
from typing import Any

ROOT = pathlib.Path(__file__).resolve().parent.parent
DEFAULT_ADAPTER = pathlib.Path("ml/checkpoints/hip-v2-lora")
DEFAULT_OUTPUT = pathlib.Path("ml/merged/jamsaq-v2")
DEFAULT_BASE = "Qwen/Qwen3-4B-Base"


def load_env_files() -> None:
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


def check_adapter(path: pathlib.Path, strict: bool) -> list[str]:
    """A valid PEFT adapter dir has adapter_config.json + weights. Empty list = OK."""
    if not path.is_dir():
        msg = f"adapter directory not found: {path}"
        return [msg] if strict else [f"WARNING: {msg} (fine for a dry-run)"]
    problems: list[str] = []
    cfg = path / "adapter_config.json"
    weights = [p for p in path.iterdir()
               if p.name in ("adapter_model.safetensors", "adapter_model.bin")]
    if not cfg.is_file():
        problems.append(f"missing {cfg}")
    if not weights:
        problems.append(f"no adapter_model.safetensors / adapter_model.bin in {path}")
    return problems


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> int:
    load_env_files()
    ap = argparse.ArgumentParser(
        description="Lossless bfloat16 merge of the jamsaq-v2 LoRA + private HF upload.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="See ml/README.md for the full walkthrough.")
    ap.add_argument("--adapter", type=pathlib.Path, default=DEFAULT_ADAPTER,
                    help="Trained LoRA adapter dir (default: %(default)s)")
    ap.add_argument("--base", default=DEFAULT_BASE,
                    help="Base model id to merge into (default: %(default)s)")
    ap.add_argument("--output", type=pathlib.Path, default=DEFAULT_OUTPUT,
                    help="Where to save the merged standalone model (default: %(default)s)")
    ap.add_argument("--push-to", default=None, metavar="HF_REPO",
                    help="Optional: upload the merged model to this PRIVATE Hugging Face "
                         "repo id (e.g. yourusername/jamsaq-v2)")
    ap.add_argument("--hf-token", default=None,
                    help="HF write token (default: HF_TOKEN env var)")
    ap.add_argument("--max-upload-gb", type=float, default=10.0,
                    help="Refuse uploads larger than this (default: %(default)s)")
    ap.add_argument("--dry-run", action="store_true",
                    help="Print the merge/upload plan and validate paths; "
                         "no downloads, no heavy imports, no network")
    args = ap.parse_args()

    token = args.hf_token or os.environ.get("HF_TOKEN", "").strip()
    adapter_problems = check_adapter(args.adapter, strict=not args.dry_run)

    print("Merge plan")
    print(f"  base model : {args.base}   (loaded in bfloat16 — lossless, same as jamsaq-v1)")
    print(f"  adapter    : {args.adapter}")
    print(f"  output     : {args.output}")
    print(f"  push-to    : {args.push_to or '(no upload, local merge only)'}")
    print(f"  HF token   : {'present' if token else 'MISSING'}"
          + ("" if not args.push_to or token else "  (upload will be refused)"))
    for p in adapter_problems:
        print(f"  ! {p}")

    if args.dry_run:
        print("\nDRY RUN OK — plan printed, nothing downloaded or written.")
        if args.push_to and not token:
            print("Note: set HF_TOKEN before the real run or the upload will be refused.")
        return 0

    if adapter_problems:
        print("\nERROR: adapter is not ready:", file=sys.stderr)
        for p in adapter_problems:
            print(f"  - {p}", file=sys.stderr)
        return 2

    # ---- Real merge (heavy imports from here on) ----------------------------
    try:
        import torch
        from transformers import AutoModelForCausalLM, AutoTokenizer
        from peft import PeftModel
    except ImportError as e:
        print(f"ERROR: merge dependencies missing ({e}).\n"
              f"Run on the GPU/CPU box with:\n"
              f"  pip install \"torch>=2.4\" \"transformers>=4.45\" \"peft>=0.13\" "
              f"\"huggingface_hub>=0.26\"\n"
              f"(or use --dry-run, which needs nothing)", file=sys.stderr)
        return 2

    print(f"\nLoading base model {args.base} in bfloat16 on CPU...")
    model = AutoModelForCausalLM.from_pretrained(
        args.base, torch_dtype=torch.bfloat16, device_map="cpu")
    print(f"Applying LoRA adapter from {args.adapter} ...")
    model = PeftModel.from_pretrained(model, str(args.adapter))
    print("Merging adapter into base weights (lossless bfloat16)...")
    model = model.merge_and_unload()
    # merge_and_unload keeps the adapter's dtype; force clean bf16 weights.
    model = model.to(torch.bfloat16)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    print(f"Saving merged model to {args.output} (~8GB, safe_serialization)...")
    model.save_pretrained(str(args.output), safe_serialization=True)
    tokenizer = AutoTokenizer.from_pretrained(args.base)
    tokenizer.save_pretrained(str(args.output))

    total_gb = sum(f.stat().st_size for f in args.output.rglob("*") if f.is_file()) / 1e9
    print(f"Saved {total_gb:.1f}GB. Merge complete.")

    # ---- Optional private upload ---------------------------------------------
    if not args.push_to:
        print("\nNo --push-to given: model stays local. Next steps:")
        print(f"  - upload to Cerebellum Cloud as a new model (they serve the local "
              f"folder directly), or")
        print(f"  - re-run with --push-to <username>/jamsaq-v2 to put it on Hugging Face "
              f"(private) and then deploy via ml/modal_vllm_fp8.py")
        return 0

    if not token:
        print("ERROR: --push-to needs an HF WRITE token. Set HF_TOKEN or --hf-token.",
              file=sys.stderr)
        return 2
    if total_gb > args.max_upload_gb:
        print(f"ERROR: merged model is {total_gb:.1f}GB > --max-upload-gb {args.max_upload_gb}GB.",
              file=sys.stderr)
        return 2

    from huggingface_hub import HfApi
    api = HfApi(token=token)
    print(f"Creating PRIVATE repo {args.push_to} (it already exists as private = fine)...")
    api.create_repo(repo_id=args.push_to, private=True, exist_ok=True)

    info: Any = api.repo_info(repo_id=args.push_to)
    if not getattr(info, "private", True):
        print(f"ERROR: {args.push_to} exists but is PUBLIC. Refusing to upload — "
              f"public weights hand the detector companies your model "
              f"(see MASTER_PLAN.md 'Private Model Moat').", file=sys.stderr)
        return 2

    print(f"Uploading {args.output} -> {args.push_to} (private)...")
    api.upload_folder(repo_id=args.push_to, folder_path=str(args.output))
    print(f"\nDone: https://huggingface.co/{args.push_to} (PRIVATE — keep it that way).")
    print("Next: deploy on Cerebellum Cloud, or ml/modal_vllm_fp8.py with "
          "MODAL_MODEL_ID=" + args.push_to)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
