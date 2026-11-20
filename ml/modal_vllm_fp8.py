#!/usr/bin/env python3
"""Deploy the merged `jamsaq-v2` model to Modal as a vLLM FP8 server.

What this does (plain English):
  Cerebellum Cloud is the Stage-1 inference provider ($0 idle, fast snapshots).
  When ProseFlow grows past ~500 paying users, this script is the Stage-2
  "own your GPU" path: it deploys the SAME merged model on Modal's serverless
  GPUs with vLLM, quantized to FP8.

  Why FP8: the 4-bit quantization test HURT detector scores, while 8-bit
  passed 100%. FP8 halves memory traffic vs bfloat16 (1.5-2x faster token
  generation, ~4x cheaper per token than Cerebellum at volume) while keeping
  near-lossless 8-bit quality — and like Cerebellum, Modal bills $0 when idle.

  The server speaks the OpenAI-compatible `/v1/completions` API — the RAW
  completions endpoint the SaaS engine already uses (never chat/completions),
  so switching ProseFlow over is a 2-line `.env.local` change:

      HIP_BACKEND_URL=https://<workspace>--proseflow-jamsaq-v2-server.modal.direct
      HIP_MODEL_NAME=jamsaq-v2

Configuration is via environment variables so `modal deploy` needs no args:
  MODAL_MODEL_ID            (required) HF repo of the merged model, e.g. you/jamsaq-v2
  MODAL_SERVED_MODEL_NAME   name clients pass as "model" (default: jamsaq-v2)
  MODAL_GPU                 GPU type: L40S (default) | L4 | A100 | H100
  MODAL_SCALEDOWN_WINDOW    idle seconds before the GPU stops (default 300 = $0 idle)
  MODAL_MAX_MODEL_LEN       context window (default 8192)
  MODAL_SECRET_NAME         Modal secret holding HF_TOKEN (default "huggingface";
                            set empty "" if the model repo is public)
  MODAL_UNAUTHENTICATED     "true" (default) = open URL (keep it secret);
                            "false" = require Modal proxy-auth tokens
  MODAL_VLLM_EXTRA_ARGS     extra flags appended to `vllm serve`

One-time setup:
  pip install modal
  modal setup                       # log in
  modal secret create huggingface HF_TOKEN=<your HF write token>  # for private repos

Deploy / use:
  python ml/modal_vllm_fp8.py --dry-run    # show the full plan (works without modal)
  python ml/modal_vllm_fp8.py --check      # verify deps + config
  MODAL_MODEL_ID=you/jamsaq-v2 python ml/modal_vllm_fp8.py --deploy
  # (equivalently: MODAL_MODEL_ID=you/jamsaq-v2 modal deploy ml/modal_vllm_fp8.py)

Note: this script intentionally imports `modal` lazily — --help / --dry-run /
py_compile all work on machines without Modal installed (like this Windows VM).
"""
from __future__ import annotations

import argparse
import os
import pathlib
import shutil
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent

# ---- Config from env (so `modal deploy` needs no CLI args) ------------------
MODEL_ID = os.environ.get("MODAL_MODEL_ID", "").strip()
SERVED_NAME = os.environ.get("MODAL_SERVED_MODEL_NAME", "jamsaq-v2").strip()
GPU = os.environ.get("MODAL_GPU", "L40S").strip()
SCALEDOWN_WINDOW = int(os.environ.get("MODAL_SCALEDOWN_WINDOW", "300"))
MAX_MODEL_LEN = int(os.environ.get("MODAL_MAX_MODEL_LEN", "8192"))
SECRET_NAME = os.environ.get("MODAL_SECRET_NAME", "huggingface").strip()
UNAUTHENTICATED = os.environ.get("MODAL_UNAUTHENTICATED", "true").strip().lower() == "true"
VLLM_EXTRA_ARGS = os.environ.get("MODAL_VLLM_EXTRA_ARGS", "").strip()

MINUTES = 60  # seconds
VLLM_PORT = 8000

# ---------------------------------------------------------------------------
# Modal application — only defined when the `modal` package is importable.
# Mirrors the current official Modal vLLM example: a subprocess running
# `vllm serve` inside the container, exposed with @app.server(...).
# ---------------------------------------------------------------------------

try:
    import modal  # noqa: E402
except ImportError:
    modal = None  # CLI-only usage (help/dry-run/check) keeps working

if modal is not None:
    vllm_image = (
        modal.Image.from_registry("nvidia/cuda:12.9.0-devel-ubuntu22.04", add_python="3.12")
        .entrypoint([])
        .uv_pip_install("vllm==0.21.0", "transformers==5.8.1")
        .env({"HF_XET_HIGH_PERFORMANCE": "1"})  # faster private-repo weight transfers
    )

    hf_cache_vol = modal.Volume.from_name("proseflow-hf-cache", create_if_missing=True)
    vllm_cache_vol = modal.Volume.from_name("proseflow-vllm-cache", create_if_missing=True)

    app = modal.App("proseflow-jamsaq-v2")

    secrets = [modal.Secret.from_name(SECRET_NAME)] if SECRET_NAME else []

    @app.server(
        image=vllm_image,
        gpu=GPU,
        scaledown_window=SCALEDOWN_WINDOW,   # idle -> GPU off -> $0 idle cost
        startup_timeout=10 * MINUTES,
        volumes={
            "/root/.cache/huggingface": hf_cache_vol,
            "/root/.cache/vllm": vllm_cache_vol,
        },
        port=VLLM_PORT,
        secrets=secrets,
        target_concurrency=32,               # vLLM continuous batching: plenty
        unauthenticated=UNAUTHENTICATED,     # keep the URL itself secret
    )
    class JamsaqV2Server:
        @modal.enter()
        def start(self):
            import subprocess as sp
            cmd = [
                "vllm",
                "serve",
                MODEL_ID,
                "--served-model-name",
                SERVED_NAME,
                "llm",
                "--quantization", "fp8",          # near-lossless 8-bit (4-bit hurt scores)
                "--max-model-len", str(MAX_MODEL_LEN),
                "--host", "0.0.0.0",
                "--port", str(VLLM_PORT),
                "--uvicorn-log-level", "info",
            ]
            if VLLM_EXTRA_ARGS:
                cmd.extend(VLLM_EXTRA_ARGS.split())
            print("Starting:", " ".join(cmd))
            self.process = sp.Popen(cmd)

        @modal.exit()
        def stop(self):
            self.process.terminate()

# `modal deploy` imports this file as a module; refuse a nonsense deployment
# when the model id was never configured.
if modal is not None and __name__ != "__main__" and not MODEL_ID:
    raise SystemExit(
        "MODAL_MODEL_ID is not set — nothing to deploy.\n"
        "Export it first, e.g.:\n"
        "  export MODAL_MODEL_ID=yourusername/jamsaq-v2\n"
        "Then re-run:  modal deploy ml/modal_vllm_fp8.py\n"
        "(Run `python ml/modal_vllm_fp8.py --check` for the full checklist.)"
    )


# ---------------------------------------------------------------------------
# Local CLI
# ---------------------------------------------------------------------------

def print_plan() -> None:
    print("Modal vLLM FP8 deployment plan for jamsaq-v2")
    print("  modal package : " + ("installed" if modal is not None else "NOT installed (fine for a dry-run)"))
    print(f"  model repo     : {MODEL_ID or '(NOT SET — export MODAL_MODEL_ID=you/jamsaq-v2)'}")
    print(f"  served as      : {SERVED_NAME}")
    print(f"  gpu            : {GPU}  (L40S/L4 = cheap FP8; A100/H100 for scale)")
    print(f"  scaledown      : {SCALEDOWN_WINDOW}s idle before the GPU stops ($0 idle)")
    print(f"  max model len  : {MAX_MODEL_LEN}")
    print(f"  hf secret      : {SECRET_NAME or '(none — public model repo only)'}")
    print(f"  unauthenticated: {UNAUTHENTICATED}  (keep the generated URL secret)")
    print("  image          : nvidia/cuda:12.9.0-devel-ubuntu22.04 + vllm==0.21.0 (FP8)")
    print("  endpoint       : OpenAI-compatible /v1/completions (raw — never chat)")


def main() -> int:
    ap = argparse.ArgumentParser(
        description="Deploy merged jamsaq-v2 to Modal as a vLLM FP8 server.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="See the module docstring / ml/README.md for the full walkthrough.")
    ap.add_argument("--dry-run", action="store_true",
                    help="Print the deployment plan; no Modal needed, no network")
    ap.add_argument("--check", action="store_true",
                    help="Verify modal + config are ready to deploy (exit 0 = ready)")
    ap.add_argument("--deploy", action="store_true",
                    help="Run `modal deploy` on this file (needs the Modal CLI)")
    args = ap.parse_args()

    if args.deploy:
        if modal is None:
            print("ERROR: the `modal` package is not installed on this machine.\n"
                  "  pip install modal && modal setup", file=sys.stderr)
            return 2
        if not MODEL_ID:
            print("ERROR: MODAL_MODEL_ID is not set (e.g. export MODAL_MODEL_ID=you/jamsaq-v2).",
                  file=sys.stderr)
            return 2
        if not shutil.which("modal"):
            print("ERROR: `modal` CLI not found on PATH (pip install modal).", file=sys.stderr)
            return 2
        print("Deploying via Modal CLI...")
        result = subprocess.run(["modal", "deploy", str(pathlib.Path(__file__).resolve())])
        if result.returncode == 0:
            print("\nDeployed. Copy the printed *.modal.direct URL, then point the SaaS at it:")
            print("  HIP_BACKEND_URL=<that url>   # in .env.local")
            print(f"  HIP_MODEL_NAME={SERVED_NAME}   # in .env.local")
            print("Test it:")
            print(f"  curl <url>/v1/completions -H 'Content-Type: application/json' \\")
            print(f"       -d '{{\"model\": \"{SERVED_NAME}\", \"prompt\": \"<source_text>\\nHello\\n</source_text>\\n\\n<target_text>\\n\", "
                  f"\"max_tokens\": 64, \"stop\": [\"</target_text>\"]}}'")
        return result.returncode

    if args.check:
        ok = True
        print("Deployment readiness check:")
        print(f"  [{'OK' if modal is not None else '!!'}] modal python package "
              f"{'installed' if modal is not None else 'MISSING -> pip install modal'}")
        have_cli = shutil.which("modal") is not None
        print(f"  [{'OK' if have_cli else '!!'}] modal CLI {'found' if have_cli else 'MISSING -> pip install modal'}")
        if not have_cli or modal is None:
            ok = False
        print(f"  [{'OK' if MODEL_ID else '!!'}] MODAL_MODEL_ID "
              f"{'= ' + MODEL_ID if MODEL_ID else 'not set (export MODAL_MODEL_ID=you/jamsaq-v2)'}")
        if not MODEL_ID:
            ok = False
        if SECRET_NAME:
            print(f"  [--] MODAL_SECRET_NAME={SECRET_NAME} — create it once with:")
            print(f"        modal secret create {SECRET_NAME} HF_TOKEN=<your HF write token>")
        else:
            print("  [--] no HF secret configured (public model repo only)")
        print(f"  [--] GPU={GPU}, scaledown={SCALEDOWN_WINDOW}s, max_len={MAX_MODEL_LEN}")
        print("READY" if ok else "NOT READY — fix the !! items above")
        return 0 if ok else 1

    # default / --dry-run
    print_plan()
    print("\nDRY RUN — nothing was deployed. To actually deploy:")
    print("  1) pip install modal && modal setup")
    print("  2) modal secret create huggingface HF_TOKEN=<your HF write token>  (once; private repos)")
    print("  3) export MODAL_MODEL_ID=yourusername/jamsaq-v2")
    print("  4) modal deploy ml/modal_vllm_fp8.py    (or: python ml/modal_vllm_fp8.py --deploy)")
    if not MODEL_ID:
        print("\n(reminder: MODAL_MODEL_ID is currently unset)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
