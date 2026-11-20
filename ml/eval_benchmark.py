#!/usr/bin/env python3
"""Weekly detector + fidelity regression benchmark for ProseFlow models.

Upgrade of reference/eval_benchmark.py, adapted for the weekly jamsaq alarm
described in MASTER_PLAN.md section 3: run it once a week; if Pangram or GPTZero
update their detectors and ProseFlow scores creep up, you find out BEFORE
customers complain — and you know a 2-hour LoRA retrain is needed.

What it can do, in one run:
  1. GENERATE (optional): take AI source texts from --inputs, rewrite them with
     any model on Cerebellum Cloud (jamsaq-v1 with --rounds 5, or the new 1-pass
     jamsaq-v2 with --rounds 1) using the exact proven HIP pipeline
     (raw /v1/completions, chunked, parallel workers).
     Or skip generation: pass --candidates <dir> of existing .txt outputs.
  2. SCORE: send outputs to the Pangram (async task API) and GPTZero v2
     detectors — cached by text SHA-256, so re-runs are free.
  3. FIDELITY: per output vs its source — 4-gram phrases rebuilt %, quotes
     kept, numbers kept, length ratio (same math as the training gates).
  4. CORRELATE: a free local "stiffness" proxy score (sentence-length
     burstiness, AI-cliche density, self-repetition) vs the paid detectors,
     Spearman rank correlation — so you can catch regressions on days you
     don't want to pay for API calls.
  5. ALARM: every candidate must pass strict thresholds; exit code 1 if any
     fail (cron-friendly), 0 when everything is clean.

Environment (loaded from .env.local / .env at repo root):
  CEREBELLUM_API_KEY   required for generation / health of the teacher
  PANGRAM_API_KEY      required for pangram scoring
  GPTZERO_API_KEY      required for gptzero scoring
  HIP_BACKEND_URL      default https://api.cerebellumlabs.ai
  HIP_WORKERS          default 6

Examples:
  # Free, no network: see what would be generated/scored and the cost estimate
  python ml/eval_benchmark.py --dry-run

  # Weekly full run for jamsaq-v1 (5-round Standard teacher)
  python ml/eval_benchmark.py --detectors pangram gptzero

  # After jamsaq-v2 is trained — the 1-PASS speed claim under test:
  python ml/eval_benchmark.py --model jamsaq-v2 --rounds 1 --detectors pangram gptzero

  # Score existing outputs only (no model calls), skip generation
  python ml/eval_benchmark.py --candidates ml/eval/outputs/jamsaq-v1-r5 \
      --detectors pangram gptzero

  # Windows Task Scheduler / cron: non-zero exit = regression -> alert
  python ml/eval_benchmark.py --detectors pangram gptzero --report
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import pathlib
import re
import statistics
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from typing import Any

# Shared proven engine code: same prompt, same chunker, same fidelity math as
# the distillation gates (keeps train/eval honest — one source of truth).
from generate_distill_data import (
    CEREBELLUM_PRICE_IN,
    CEREBELLUM_PRICE_OUT,
    TOKENS_PER_WORD,
    load_env_files,
    split_into_chunks,
    fidelity_report,
    teacher_rewrite,
)

ROOT = pathlib.Path(__file__).resolve().parent.parent
PANGRAM_TASK_URL = "https://text.external-api.pangram.com/task"
GPTZERO_TEXT_URL = "https://api.gptzero.me/v2/predict/text"

DEFAULT_INPUTS = ROOT / "ml/samples/ai"
DEFAULT_OUT_ROOT = ROOT / "ml/eval/outputs"
DEFAULT_CACHE = ROOT / "ml/eval/.cache"
DEFAULT_REPORTS = ROOT / "ml/eval/reports"

# Pass thresholds — strict enough to avoid "mixed"/"AI-assisted" detector flags
# (threshold set inherited from reference/eval_benchmark.py) plus the SPEC 4.4
# fidelity gates for generated candidates.
THRESHOLDS = {
    "pangram_max_ai_combined": 0.10,      # fraction_ai + fraction_ai_assisted <= 0.10
    "gptzero_max_doc_ai": 0.15,           # completely_generated_prob <= 0.15
    "gptzero_max_flagged_sent_frac": 0.15,
    "min_length_ratio": 0.70,
    "max_length_ratio": 1.35,
    "min_number_retention": 0.85,
    "min_rebuilt_pct": 80.0,               # 4-word phrases rebuilt vs the AI source
}

AI_CLICHES = [
    "it is important to note", "it's important to note", "it is worth noting",
    "in today's fast-paced", "in the ever-evolving", "delve into", "delves into",
    "moreover", "furthermore", "in conclusion", "a rich tapestry", "navigating the",
    "landscape of", "underscores", "pivotal", "foster", "leverage", "robust",
    "seamless", "holistic", "unlock", "harness", "elevate", "testament to",
]


# ---------------------------------------------------------------------------
# HTTP + text helpers
# ---------------------------------------------------------------------------

def http_json(url: str, method: str = "GET", body: dict | None = None,
              headers: dict[str, str] | None = None, timeout: int = 60) -> dict[str, Any]:
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req_headers = {"Accept": "application/json", **(headers or {})}
    if data is not None:
        req_headers.setdefault("Content-Type", "application/json")
    req = urllib.request.Request(url, data=data, headers=req_headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {e.code} from {url}: {detail}") from e


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def split_sentences(text: str) -> list[str]:
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+", text.strip()) if s.strip()]


# ---------------------------------------------------------------------------
# Local "stiffness" proxy (free AI-likeness estimate, 0..100)
# ---------------------------------------------------------------------------

def stiffness_proxy(text: str) -> float:
    """Heuristic AI-likeness score: robotic pacing + cliche density + repetition.

    Higher = more machine-like. Free, no API — the Spearman correlation section
    shows how well it tracks the paid detectors so it can be used between
    weekly paid runs.
    """
    sents = split_sentences(text)
    lens = [len(s.split()) for s in sents] or [0]
    mean_len = statistics.mean(lens)
    cv = statistics.pstdev(lens) / mean_len if mean_len else 0.0
    burst_component = max(0.0, 1.0 - cv / 0.6)            # uniform pacing -> 1.0

    words = len(text.split())
    lower = text.lower()
    cliche_hits = sum(lower.count(c) for c in AI_CLICHES)
    cliche_component = min(1.0, cliche_hits / max(words / 100.0, 1e-9) / 4.0)

    fourgrams = [tuple(text.lower().split()[i:i + 4]) for i in range(max(0, words - 3))]
    if fourgrams:
        seen: set[tuple[str, ...]] = set()
        repeats = 0
        for g in fourgrams:
            if g in seen:
                repeats += 1
            seen.add(g)
        repeat_component = min(1.0, repeats / max(len(fourgrams) * 0.08, 1e-9))
    else:
        repeat_component = 0.0

    return round(100 * (0.5 * burst_component + 0.3 * cliche_component
                        + 0.2 * repeat_component), 1)


# ---------------------------------------------------------------------------
# Detector clients (proven implementations from reference/eval_benchmark.py)
# ---------------------------------------------------------------------------

def score_pangram(text: str, api_key: str, model: str = "pangram-4",
                  poll_interval: float = 1.5, max_wait_s: float = 120.0) -> dict[str, Any]:
    headers = {"x-api-key": api_key}
    created = http_json(PANGRAM_TASK_URL, method="POST",
                        body={"text": text, "model": model, "public_dashboard_link": False},
                        headers=headers)
    task_id = created.get("task_id")
    if not task_id:
        raise RuntimeError(f"Pangram did not return task_id: {created}")
    deadline = time.time() + max_wait_s
    result: dict[str, Any] = created
    while time.time() < deadline:
        result = http_json(f"{PANGRAM_TASK_URL}/{task_id}", method="GET", headers=headers)
        stage = result.get("stage", "")
        if stage == "STAGE_SUCCESS":
            break
        if stage in ("STAGE_FAILED", "STAGE_ERROR"):
            raise RuntimeError(f"Pangram task {task_id} failed: {result}")
        time.sleep(poll_interval)
    else:
        raise TimeoutError(f"Pangram task {task_id} timed out after {max_wait_s}s")

    frac_ai = float(result.get("fraction_ai", 0.0) or 0.0)
    frac_as = float(result.get("fraction_ai_assisted", 0.0) or 0.0)
    windows = result.get("windows") or []
    flagged = [w for w in windows
               if str(w.get("label", "")).lower() not in ("human", "human written", "human_written")]
    return {
        "detector": "pangram", "model": model,
        "fraction_ai": round(frac_ai, 4),
        "fraction_ai_assisted": round(frac_as, 4),
        "fraction_ai_combined": round(frac_ai + frac_as, 4),
        "flagged_window_fraction": round(len(flagged) / max(len(windows), 1), 4),
    }


def score_gptzero(text: str, api_key: str, model_version: str | None = None) -> dict[str, Any]:
    payload: dict[str, Any] = {"document": text}
    if model_version:
        payload["modelVersion"] = model_version
    result = http_json(GPTZERO_TEXT_URL, method="POST", body=payload,
                       headers={"x-api-key": api_key})
    docs = result.get("documents") or []
    if not docs:
        raise RuntimeError(f"GPTZero returned empty documents list: {result}")
    doc = docs[0]
    sentences = [s for s in (doc.get("sentences") or []) if not s.get("should_mask")]
    flagged = [s for s in sentences if s.get("highlight_sentence_for_ai")]
    return {
        "detector": "gptzero", "version": result.get("version") or model_version,
        "document_classification": doc.get("document_classification"),
        "completely_generated_prob": round(float(doc.get("completely_generated_prob", 0.0) or 0.0), 4),
        "prob_human": round(float((doc.get("class_probabilities") or {}).get("human", 0.0) or 0.0), 4),
        "flagged_sentence_fraction": round(len(flagged) / max(len(sentences), 1), 4),
    }


# ---------------------------------------------------------------------------
# Spearman rank correlation (stdlib only)
# ---------------------------------------------------------------------------

def _avg_ranks(values: list[float]) -> list[float]:
    indexed = sorted(enumerate(values), key=lambda x: x[1])
    ranks = [0.0] * len(values)
    i = 0
    while i < len(indexed):
        j = i
        while j + 1 < len(indexed) and indexed[j + 1][1] == indexed[i][1]:
            j += 1
        avg = (i + j) / 2.0 + 1.0
        for k in range(i, j + 1):
            ranks[indexed[k][0]] = avg
        i = j + 1
    return ranks


def spearman(xs: list[float], ys: list[float]) -> float | None:
    if len(xs) != len(ys) or len(xs) < 3:
        return None
    rx, ry = _avg_ranks(xs), _avg_ranks(ys)
    mx, my = statistics.mean(rx), statistics.mean(ry)
    num = sum((a - mx) * (b - my) for a, b in zip(rx, ry))
    dx = sum((a - mx) ** 2 for a in rx) ** 0.5
    dy = sum((b - my) ** 2 for b in ry) ** 0.5
    if dx == 0 or dy == 0:
        return None
    return round(num / (dx * dy), 4)


# ---------------------------------------------------------------------------
# Generation + evaluation pipeline
# ---------------------------------------------------------------------------

def generate_outputs(inputs_dir: pathlib.Path, out_dir: pathlib.Path, *,
                     model: str, rounds: int, temperature: float, workers: int,
                     api_key: str, base_url: str) -> list[dict[str, Any]]:
    """Run the proven HIP pipeline over every input .txt -> out_dir/<stem>.txt."""
    out_dir.mkdir(parents=True, exist_ok=True)
    jobs = []
    for p in sorted(inputs_dir.glob("*.txt")):
        out_path = out_dir / p.name
        if out_path.is_file() and out_path.stat().st_size > 0:
            continue  # cached from a previous run
        jobs.append((p, out_path))

    def run(job: tuple[pathlib.Path, pathlib.Path]) -> tuple[pathlib.Path, pathlib.Path, float]:
        src_path, out_path = job
        text = src_path.read_text(encoding="utf-8", errors="ignore").strip()
        chunks = split_into_chunks(text)
        active = [c for c in chunks if not c.passthrough]

        def do_chunk(c) -> str:
            final, _ = teacher_rewrite(
                c.text, rounds=rounds, temperature=temperature,
                api_key=api_key, base_url=base_url, model=model)
            return final

        with ThreadPoolExecutor(max_workers=max(1, workers)) as pool:
            rewritten = list(pool.map(do_chunk, active))
        result_parts: list[str] = []
        ri = 0
        for c in chunks:
            result_parts.append(c.text if c.passthrough else rewritten[ri])
            ri += 0 if c.passthrough else 1
        result_text = "\n\n".join(result_parts)
        out_path.write_text(result_text, encoding="utf-8")
        return src_path, out_path, time.time()

    for job in jobs:
        run(job)
        print(f"    generated {job[1].name}", flush=True)

    # Return ALL pairs (cached + fresh) for scoring.
    pairs = []
    for p in sorted(inputs_dir.glob("*.txt")):
        out_path = out_dir / p.name
        if out_path.is_file():
            pairs.append({"id": p.stem, "source_path": p, "output_path": out_path})
    return pairs


def evaluate_pass(rec: dict[str, Any]) -> dict[str, bool]:
    checks: dict[str, bool] = {}
    pg = rec.get("pangram")
    if pg:
        checks["pangram_pass"] = pg["fraction_ai_combined"] <= THRESHOLDS["pangram_max_ai_combined"]
    gz = rec.get("gptzero")
    if gz:
        checks["gptzero_doc_pass"] = gz["completely_generated_prob"] <= THRESHOLDS["gptzero_max_doc_ai"]
        checks["gptzero_sent_pass"] = gz["flagged_sentence_fraction"] <= THRESHOLDS["gptzero_max_flagged_sent_frac"]
        checks["gptzero_pass"] = checks["gptzero_doc_pass"] and checks["gptzero_sent_pass"]
    fid = rec.get("fidelity")
    if fid:
        checks["fidelity_pass"] = (
            THRESHOLDS["min_length_ratio"] <= fid["length_ratio"] <= THRESHOLDS["max_length_ratio"]
            and (fid["numbers_total"] == 0
                 or fid["numbers_kept"] / fid["numbers_total"] >= THRESHOLDS["min_number_retention"])
            and fid["phrases_rebuilt_pct"] >= THRESHOLDS["min_rebuilt_pct"]
        )
    detector_keys = [k for k in ("pangram_pass", "gptzero_pass") if k in checks]
    if detector_keys:
        checks["overall_pass"] = all(checks[k] for k in detector_keys) and checks.get("fidelity_pass", True)
    return checks


def print_summary(records: list[dict[str, Any]]) -> None:
    by_split: dict[str, list[dict[str, Any]]] = {}
    for r in records:
        by_split.setdefault(r["split"], []).append(r)

    print("\n=== Benchmark Summary ===")
    header = (f"{'Split':<16} {'N':>3} {'Words':>7} {'PangramAI%':>11} "
              f"{'GPTZeroAI%':>11} {'GZSent%':>8} {'Rebuilt%':>9} {'Pass':>6} {'Proxy':>6}")
    print(header)
    print("-" * len(header))
    for split, rows in by_split.items():
        words = sum(r["words"] for r in rows)
        pg = [r["pangram"]["fraction_ai_combined"] for r in rows if "pangram" in r]
        gz = [r["gptzero"]["completely_generated_prob"] for r in rows if "gptzero" in r]
        sf = [r["gptzero"]["flagged_sentence_fraction"] for r in rows if "gptzero" in r]
        rb = [r["fidelity"]["phrases_rebuilt_pct"] for r in rows if "fidelity" in r]
        passes = [r["checks"]["overall_pass"] for r in rows if "overall_pass" in r["checks"]]
        px = [r["proxy"] for r in rows]
        fmt_pct = lambda vals: f"{statistics.mean(vals) * 100:.1f}" if vals else None
        print(f"{split:<16} {len(rows):>3} {words:>7} "
              f"{(fmt_pct(pg) or '-'):>11} "
              f"{(fmt_pct(gz) or '-'):>11} "
              f"{(fmt_pct(sf) or '-'):>8} "
              f"{(f'{statistics.mean(rb):.0f}' if rb else '-'):>9} "
              f"{(f'{sum(passes)}/{len(passes)}' if passes else '-'):>6} "
              f"{(f'{statistics.mean(px):.0f}' if px else '-'):>6}")

    # Spearman: free local proxy vs paid detectors (candidate split)
    cands = [r for r in records if r["split"] == "candidate" and "pangram" in r]
    if len(cands) >= 3:
        rho = spearman([r["proxy"] for r in cands],
                       [r["pangram"]["fraction_ai_combined"] for r in cands])
        print(f"\nLocal stiffness-proxy vs Pangram Spearman rho (n={len(cands)}): {rho}")
        print("  (|rho| >= 0.6 means the free proxy is a usable canary between paid runs)")
    cands_gz = [r for r in records if r["split"] == "candidate" and "gptzero" in r]
    if len(cands_gz) >= 3:
        rho = spearman([r["proxy"] for r in cands_gz],
                       [r["gptzero"]["completely_generated_prob"] for r in cands_gz])
        print(f"Local stiffness-proxy vs GPTZero Spearman rho (n={len(cands_gz)}): {rho}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> int:
    load_env_files()
    ap = argparse.ArgumentParser(
        description="Weekly Pangram + GPTZero + fidelity regression benchmark.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="See ml/README.md for scheduling guidance.")
    ap.add_argument("--inputs", type=pathlib.Path, default=DEFAULT_INPUTS,
                    help=f"Directory of AI source .txt files (default: {DEFAULT_INPUTS})")
    ap.add_argument("--candidates", type=pathlib.Path, default=None,
                    help="Skip generation: score these existing .txt outputs directly")
    ap.add_argument("--model", default=os.environ.get("HIP_MODEL_NAME", "jamsaq-v1"),
                    help="Model to rewrite with (default: %(default)s)")
    ap.add_argument("--rounds", type=int, default=5,
                    help="HIP rounds for generation (use 1 to test jamsaq-v2 1-pass)")
    ap.add_argument("--temperature", type=float, default=1.0)
    ap.add_argument("--workers", type=int, default=int(os.environ.get("HIP_WORKERS", "6")))
    ap.add_argument("--out-dir", type=pathlib.Path, default=None,
                    help="Where generated outputs go (default: ml/eval/outputs/<model>-r<rounds>)")
    ap.add_argument("--detectors", nargs="+", choices=["pangram", "gptzero"],
                    default=["pangram", "gptzero"])
    ap.add_argument("--pangram-model", default=os.environ.get("PANGRAM_MODEL", "pangram-4"))
    ap.add_argument("--gptzero-model-version", default=os.environ.get("GPTZERO_MODEL_VERSION"))
    ap.add_argument("--include-controls", action="store_true",
                    help="Also score ml/samples/human and ml/samples/ai baselines")
    ap.add_argument("--limit", type=int, help="Max files per split (cheap smoke runs)")
    ap.add_argument("--cache-dir", type=pathlib.Path, default=DEFAULT_CACHE)
    ap.add_argument("--no-cache", action="store_true")
    ap.add_argument("--report", action="store_true", help="Write a JSON report under ml/eval/reports/")
    ap.add_argument("--no-strict", action="store_true",
                    help="Always exit 0 (don't alarm cron) even if thresholds fail")
    ap.add_argument("--dry-run", action="store_true",
                    help="Show the plan + cost estimate; no network, no keys needed")
    args = ap.parse_args()

    base_url = os.environ.get("HIP_BACKEND_URL", "https://api.cerebellumlabs.ai").strip()
    api_key = os.environ.get("CEREBELLUM_API_KEY", "").strip()
    pg_key = os.environ.get("PANGRAM_API_KEY", "").strip()
    gz_key = os.environ.get("GPTZERO_API_KEY", "").strip()

    # ---- Resolve what to score ------------------------------------------------
    generate = args.candidates is None
    inputs_dir = args.inputs
    if generate and not inputs_dir.is_dir():
        print(f"No inputs directory at {inputs_dir} and no --candidates given.")
        print("Create it first — drop a few AI-written .txt source documents there, e.g.")
        print("  ml/samples/ai/marketing_draft.txt")
        print("(this message is expected on a fresh checkout; re-run with --inputs <dir>)")
        return 0

    out_dir = args.out_dir or (DEFAULT_OUT_ROOT / f"{args.model}-r{args.rounds}")

    items: list[dict[str, Any]] = []
    if generate:
        for p in sorted(inputs_dir.glob("*.txt")):
            items.append({"id": p.stem, "split": "candidate",
                         "source_path": p, "output_path": out_dir / p.name})
    else:
        if not args.candidates.is_dir():
            print(f"ERROR: --candidates directory not found: {args.candidates}", file=sys.stderr)
            return 2
        for p in sorted(args.candidates.glob("*.txt")):
            src = inputs_dir / p.name
            items.append({"id": p.stem, "split": "candidate",
                          "source_path": src if src.is_file() else None,
                          "output_path": p})
    if args.include_controls:
        for split, d in (("control_human", ROOT / "ml/samples/human"),
                        ("control_ai", inputs_dir)):
            if d.is_dir():
                for p in sorted(d.glob("*.txt")):
                    items.append({"id": f"{split}/{p.stem}", "split": split,
                                  "source_path": None, "output_path": p,
                                  "control_text": p.read_text(encoding="utf-8", errors="ignore")})
    if args.limit:
        per_split: dict[str, list[dict[str, Any]]] = {}
        for it in items:
            per_split.setdefault(it["split"], []).append(it)
        items = [x for rows in per_split.values() for x in rows[:args.limit]]

    if not items:
        print("Nothing to evaluate (no .txt files found).", file=sys.stderr)
        return 0 if args.dry_run else 1

    # ---- Cost estimate / dry-run ----------------------------------------------
    cand_words = 0
    for it in items:
        if it["split"] != "candidate":
            continue
        text = it.get("control_text")
        if text is None:
            src = it.get("source_path")
            if generate or (src is not None and pathlib.Path(src).is_file()):
                reader = pathlib.Path(src) if (src is not None and pathlib.Path(src).is_file()) else it["output_path"]
                text = reader.read_text(encoding="utf-8", errors="ignore")
            else:
                text = it["output_path"].read_text(encoding="utf-8", errors="ignore")
        cand_words += len(text.split())
    gen_words = cand_words if generate else 0
    in_tok = int(gen_words * TOKENS_PER_WORD * (1 + 0.2 * args.rounds))
    out_tok = int(gen_words * TOKENS_PER_WORD * args.rounds)
    est_cost = in_tok / 1e6 * CEREBELLUM_PRICE_IN + out_tok / 1e6 * CEREBELLUM_PRICE_OUT

    print(f"Model under test : {args.model} @ {base_url} (rounds={args.rounds}, "
          f"temp={args.temperature}, workers={args.workers})" if generate else
          f"Scoring existing candidates in {args.candidates} (no generation)")
    print(f"Candidates       : {sum(1 for i in items if i['split'] == 'candidate')} | "
          f"controls: {sum(1 for i in items if i['split'].startswith('control'))}")
    if generate:
        print(f"Generation       : {gen_words:,} words -> ~{in_tok:,} in / ~{out_tok:,} out tokens "
              f"-> est. Cerebellum cost ~${est_cost:.2f}")
    print(f"Detectors        : {', '.join(args.detectors)} "
          f"(pangram key: {'present' if pg_key else 'MISSING'}, "
          f"gptzero key: {'present' if gz_key else 'MISSING'})")

    if args.dry_run:
        uncached = 0
        for it in items:
            if it.get("control_text"):
                text = it["control_text"]
            elif it["output_path"].is_file():
                text = it["output_path"].read_text(encoding="utf-8", errors="ignore")
            else:
                uncached += 1  # output not generated yet -> will need scoring
                continue
            h = sha256_text(text)
            hits = 0
            for d in args.detectors:
                v = args.pangram_model if d == "pangram" else (args.gptzero_model_version or "latest")
                if not args.no_cache and (args.cache_dir / d / v / f"{h}.json").is_file():
                    hits += 1
            if hits < len(args.detectors):
                uncached += 1
        print(f"Detector calls   : ~{uncached} uncached texts "
              f"x {len(args.detectors)} detector(s) (cache: {args.cache_dir})")
        print("\nDRY RUN — nothing was sent. Plan above is what would happen.")
        return 0

    # ---- Key validation ---------------------------------------------------------
    if generate and not api_key:
        print("ERROR: CEREBELLUM_API_KEY is not set (needed for generation).", file=sys.stderr)
        return 2
    if "pangram" in args.detectors and not pg_key:
        print("ERROR: PANGRAM_API_KEY is not set (use --detectors gptzero to skip).", file=sys.stderr)
        return 2
    if "gptzero" in args.detectors and not gz_key:
        print("ERROR: GPTZERO_API_KEY is not set (use --detectors pangram to skip).", file=sys.stderr)
        return 2

    # ---- Generation --------------------------------------------------------------
    if generate:
        print("\nStep 1: generating candidate outputs via the HIP pipeline...")
        generate_outputs(inputs_dir, out_dir, model=args.model, rounds=args.rounds,
                         temperature=args.temperature, workers=args.workers,
                         api_key=api_key, base_url=base_url)
    else:
        print("\nStep 1: skipped (--candidates given)")

    # ---- Scoring -------------------------------------------------------------------
    records: list[dict[str, Any]] = []
    print("\nStep 2: scoring (cached by text SHA-256 — re-runs are free)...")
    for it in items:
        text = it.get("control_text") or it["output_path"].read_text(encoding="utf-8", errors="ignore")
        rec: dict[str, Any] = {
            "id": it["id"], "split": it["split"], "words": len(text.split()),
            "sha256": sha256_text(text)[:12], "text": text,
            "proxy": stiffness_proxy(text),
        }
        if it.get("source_path") and it["source_path"].is_file():
            src = it["source_path"].read_text(encoding="utf-8", errors="ignore")
            rec["fidelity"] = fidelity_report(src, text)

        if "pangram" in args.detectors:
            h = sha256_text(text)
            cpath = args.cache_dir / "pangram" / args.pangram_model / f"{h}.json"
            if not args.no_cache and cpath.is_file():
                rec["pangram"] = json.loads(cpath.read_text(encoding="utf-8"))
            else:
                print(f"  [pangram] {it['id']} ({rec['words']} words)...", flush=True)
                rec["pangram"] = score_pangram(text, pg_key, args.pangram_model)
                cpath.parent.mkdir(parents=True, exist_ok=True)
                cpath.write_text(json.dumps(rec["pangram"], indent=2), encoding="utf-8")
        if "gptzero" in args.detectors:
            h = sha256_text(text)
            v = args.gptzero_model_version or "latest"
            cpath = args.cache_dir / "gptzero" / v / f"{h}.json"
            if not args.no_cache and cpath.is_file():
                rec["gptzero"] = json.loads(cpath.read_text(encoding="utf-8"))
            else:
                print(f"  [gptzero] {it['id']} ({rec['words']} words)...", flush=True)
                rec["gptzero"] = score_gptzero(text, gz_key, args.gptzero_model_version)
                cpath.parent.mkdir(parents=True, exist_ok=True)
                cpath.write_text(json.dumps(rec["gptzero"], indent=2), encoding="utf-8")

        rec["checks"] = evaluate_pass(rec)
        records.append(rec)

    # ---- Report + alarm ---------------------------------------------------------
    print_summary(records)

    failures = [r for r in records if "overall_pass" in r["checks"] and not r["checks"]["overall_pass"]]
    if args.report:
        DEFAULT_REPORTS.mkdir(parents=True, exist_ok=True)
        rp = DEFAULT_REPORTS / f"bench-{int(time.time())}.json"
        slim = [{k: v for k, v in r.items() if k != "text"} for r in records]
        rp.write_text(json.dumps({"model": args.model, "rounds": args.rounds,
                                  "thresholds": THRESHOLDS, "records": slim},
                                 indent=2), encoding="utf-8")
        print(f"\nFull JSON report: {rp}")

    if failures:
        print(f"\nALARM: {len(failures)} candidate(s) FAILED thresholds:")
        for r in failures:
            failed = [k for k, ok in r["checks"].items() if not ok]
            print(f"  - {r['id']}: failed {', '.join(failed)}")
        if args.no_strict:
            print("(--no-strict: exiting 0 anyway)")
            return 0
        print("\nA detector may have updated. Retrain jamsaq-v2 (see ml/README.md "
              "section 'Weekly alarm') — then re-run this benchmark.")
        return 1

    print("\nALL CHECKS PASSED — no detector regression detected.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
