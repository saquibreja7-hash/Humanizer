#!/usr/bin/env python3
"""Evaluation pipeline tailored for Pangram and GPTZero detection mechanisms.

Why this exists:
  Earlier runs optimized against SlopTotal, which did not correlate with GPTZero 5.0b.
  This harness evaluates candidates directly against Pangram (sliding-window AI &
  AI-assisted fractions) and GPTZero v2 (document class probabilities + sentence-level
  perplexity and flagged sentences), alongside human/AI control baselines, basic
  preservation diagnostics, and Spearman correlation against local proxy scores.

Usage examples:
  # 1. Estimate word counts & verify dataset pairing without calling APIs:
  python eval/benchmark.py --candidates outputs/cf-fast --dry-run

  # 2. Run against Pangram and GPTZero APIs (cached by text SHA-256):
  #    Requires PANGRAM_API_KEY and/or GPTZERO_API_KEY in env (or .env)
  python eval/benchmark.py --candidates outputs/cf-fast --detectors pangram gptzero --include-controls

  # 3. Export a blind-coded manual test pack + score sheet (for web tiers / ZeroGPT):
  python eval/benchmark.py --candidates outputs/cf-fast --export-manual eval/manual-batch

  # 4. Score & report from a filled manual CSV:
  python eval/benchmark.py --import-manual eval/manual-batch/scores.csv
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import math
import os
import pathlib
import re
import statistics
import sys
import time
import urllib.error
import urllib.request
from typing import Any

ROOT = pathlib.Path(__file__).resolve().parent.parent
DEFAULT_CACHE_DIR = ROOT / "eval" / ".cache"
DEFAULT_REPORT_DIR = ROOT / "eval" / "reports"

PANGRAM_TASK_URL = "https://text.external-api.pangram.com/task"
GPTZERO_TEXT_URL = "https://api.gptzero.me/v2/predict/text"

# Default pass thresholds (strict enough to avoid "mixed" / "AI-assisted" flags)
DEFAULT_THRESHOLDS = {
    "pangram_max_ai_combined": 0.10,      # fraction_ai + fraction_ai_assisted <= 0.10
    "gptzero_max_doc_ai": 0.15,           # completely_generated_prob <= 0.15
    "gptzero_max_flagged_sent_frac": 0.15,  # highlighted AI sentences <= 15%
    "min_length_ratio": 0.70,
    "max_length_ratio": 1.35,
    "min_number_retention": 0.85,
}


# ---------------------------------------------------------------------------
# Helpers: env, cache, HTTP, text diagnostics
# ---------------------------------------------------------------------------

def load_dotenv_files() -> None:
    """Load key=value pairs from ~/.humanizer.env and workspace .env if unset."""
    for env_path in (pathlib.Path.home() / ".humanizer.env", ROOT / ".env"):
        if not env_path.is_file():
            continue
        for raw in env_path.read_text(encoding="utf-8", errors="ignore").splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            k = k.strip()
            v = v.strip().strip('"').strip("'")
            if k and k not in os.environ:
                os.environ[k] = v


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def cache_path(cache_dir: pathlib.Path, detector: str, version: str, text_hash: str) -> pathlib.Path:
    safe_ver = re.sub(r"[^a-zA-Z0-9._-]+", "_", version or "default")
    return cache_dir / detector / safe_ver / f"{text_hash}.json"


def load_cache(cache_dir: pathlib.Path, detector: str, version: str, text_hash: str) -> dict | None:
    p = cache_path(cache_dir, detector, version, text_hash)
    if p.is_file():
        return json.loads(p.read_text(encoding="utf-8"))
    return None


def save_cache(cache_dir: pathlib.Path, detector: str, version: str, text_hash: str, payload: dict) -> None:
    p = cache_path(cache_dir, detector, version, text_hash)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def http_json(
    url: str,
    method: str = "GET",
    body: dict | None = None,
    headers: dict[str, str] | None = None,
    timeout: int = 60,
) -> dict[str, Any]:
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


def split_sentences(text: str) -> list[str]:
    parts = re.split(r"(?<=[.!?])\s+", text.strip())
    return [s.strip() for s in parts if s.strip()]


def extract_numbers(text: str) -> set[str]:
    return set(re.findall(r"\b\d+(?:[.,]\d+)?%?\b", text))


def text_diagnostics(candidate: str, reference: str | None = None) -> dict[str, Any]:
    words = candidate.split()
    sents = split_sentences(candidate)
    sent_lens = [len(s.split()) for s in sents] or [0]
    mean_len = statistics.mean(sent_lens)
    std_len = statistics.pstdev(sent_lens) if len(sent_lens) > 1 else 0.0
    diag: dict[str, Any] = {
        "words": len(words),
        "chars": len(candidate),
        "sentences": len(sents),
        "sent_len_mean": round(mean_len, 2),
        "sent_len_std": round(std_len, 2),
        "sent_len_cv": round(std_len / mean_len, 3) if mean_len > 0 else 0.0,
    }
    if reference is not None:
        ref_words = reference.split()
        diag["length_ratio"] = round(len(words) / max(len(ref_words), 1), 3)
        ref_nums = extract_numbers(reference)
        if ref_nums:
            cand_nums = extract_numbers(candidate)
            diag["number_retention"] = round(len(ref_nums & cand_nums) / len(ref_nums), 3)
        else:
            diag["number_retention"] = 1.0
    return diag


# ---------------------------------------------------------------------------
# Detector Clients: Pangram & GPTZero
# ---------------------------------------------------------------------------

def score_pangram(
    text: str,
    api_key: str,
    model: str = "pangram-4",
    public_dashboard_link: bool = False,
    poll_interval: float = 1.5,
    max_wait_s: float = 120.0,
) -> dict[str, Any]:
    """Run Pangram async task API and normalize window + document metrics."""
    headers = {"x-api-key": api_key, "Content-Type": "application/json"}
    created = http_json(
        PANGRAM_TASK_URL,
        method="POST",
        body={
            "text": text,
            "model": model,
            "public_dashboard_link": public_dashboard_link,
        },
        headers=headers,
    )
    task_id = created.get("task_id")
    if not task_id:
        raise RuntimeError(f"Pangram did not return task_id: {created}")

    deadline = time.time() + max_wait_s
    result: dict[str, Any] = created
    while time.time() < deadline:
        result = http_json(f"{PANGRAM_TASK_URL}/{task_id}", method="GET", headers={"x-api-key": api_key})
        stage = result.get("stage", "")
        if stage == "STAGE_SUCCESS":
            break
        if stage in ("STAGE_FAILED", "STAGE_ERROR"):
            raise RuntimeError(f"Pangram task {task_id} failed: {result}")
        time.sleep(poll_interval)
    else:
        raise TimeoutError(f"Pangram task {task_id} timed out after {max_wait_s}s")

    frac_ai = float(result.get("fraction_ai", 0.0) or 0.0)
    frac_assisted = float(result.get("fraction_ai_assisted", 0.0) or 0.0)
    frac_human = float(result.get("fraction_human", 0.0) or 0.0)
    windows = result.get("windows") or []
    flagged_windows = [
        w for w in windows
        if str(w.get("label", "")).lower() not in ("human", "human written", "human_written")
    ]
    return {
        "detector": "pangram",
        "model": model,
        "version": result.get("version"),
        "headline": result.get("headline"),
        "prediction_short": result.get("prediction_short"),
        "fraction_ai": round(frac_ai, 4),
        "fraction_ai_assisted": round(frac_assisted, 4),
        "fraction_ai_combined": round(frac_ai + frac_assisted, 4),
        "fraction_human": round(frac_human, 4),
        "window_count": len(windows),
        "flagged_window_count": len(flagged_windows),
        "flagged_window_fraction": round(len(flagged_windows) / max(len(windows), 1), 4),
        "dashboard_link": result.get("dashboard_link"),
        "raw": result,
    }


def score_gptzero(
    text: str,
    api_key: str,
    model_version: str | None = None,
    multilingual: bool = False,
) -> dict[str, Any]:
    """Run GPTZero v2 predict/text API and normalize doc + sentence metrics."""
    payload: dict[str, Any] = {"document": text, "multilingual": multilingual}
    if model_version:
        payload["modelVersion"] = model_version

    result = http_json(
        GPTZERO_TEXT_URL,
        method="POST",
        body=payload,
        headers={"x-api-key": api_key},
    )
    docs = result.get("documents") or []
    if not docs:
        raise RuntimeError(f"GPTZero returned empty documents list: {result}")
    doc = docs[0]
    probs = doc.get("class_probabilities") or {}
    sentences = [s for s in (doc.get("sentences") or []) if not s.get("should_mask")]
    sent_probs = [float(s.get("generated_prob", 0.0) or 0.0) for s in sentences]
    perplexities = [float(s["perplexity"]) for s in sentences if s.get("perplexity") is not None]
    flagged = [s for s in sentences if s.get("highlight_sentence_for_ai")]

    return {
        "detector": "gptzero",
        "version": result.get("version") or model_version,
        "document_classification": doc.get("document_classification"),
        "predicted_class": doc.get("predicted_class"),
        "confidence_category": doc.get("confidence_category"),
        "completely_generated_prob": round(float(doc.get("completely_generated_prob", 0.0) or 0.0), 4),
        "average_generated_prob": round(float(doc.get("average_generated_prob", 0.0) or 0.0), 4),
        "prob_human": round(float(probs.get("human", 0.0) or 0.0), 4),
        "prob_ai": round(float(probs.get("ai", 0.0) or 0.0), 4),
        "prob_mixed": round(float(probs.get("mixed", 0.0) or 0.0), 4),
        "sentence_count": len(sentences),
        "flagged_sentence_count": len(flagged),
        "flagged_sentence_fraction": round(len(flagged) / max(len(sentences), 1), 4),
        "max_sentence_prob": round(max(sent_probs), 4) if sent_probs else 0.0,
        "median_sentence_perplexity": round(statistics.median(perplexities), 2) if perplexities else None,
        "std_sentence_perplexity": round(statistics.pstdev(perplexities), 2) if len(perplexities) > 1 else None,
        "raw": result,
    }


# ---------------------------------------------------------------------------
# Correlation (Spearman rank correlation without scipy)
# ---------------------------------------------------------------------------

def _average_ranks(values: list[float]) -> list[float]:
    indexed = sorted(enumerate(values), key=lambda x: x[1])
    ranks = [0.0] * len(values)
    i = 0
    while i < len(indexed):
        j = i
        while j + 1 < len(indexed) and indexed[j + 1][1] == indexed[i][1]:
            j += 1
        avg_rank = (i + j) / 2.0 + 1.0
        for k in range(i, j + 1):
            ranks[indexed[k][0]] = avg_rank
        i = j + 1
    return ranks


def spearman_corr(xs: list[float], ys: list[float]) -> float | None:
    if len(xs) != len(ys) or len(xs) < 3:
        return None
    rx = _average_ranks(xs)
    ry = _average_ranks(ys)
    mx, my = statistics.mean(rx), statistics.mean(ry)
    num = sum((a - mx) * (b - my) for a, b in zip(rx, ry))
    den_x = math.sqrt(sum((a - mx) ** 2 for a in rx))
    den_y = math.sqrt(sum((b - my) ** 2 for b in ry))
    if den_x == 0 or den_y == 0:
        return None
    return round(num / (den_x * den_y), 4)


# ---------------------------------------------------------------------------
# Dataset assembly
# ---------------------------------------------------------------------------

def collect_items(
    candidates_dir: pathlib.Path | None,
    include_controls: bool,
    limit: int | None = None,
) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    ai_dir = ROOT / "samples" / "ai"
    human_dir = ROOT / "samples" / "human"

    # Load existing SlopTotal exact scores if available (for proxy correlation check)
    proxy_lookup: dict[tuple[str, str], float] = {}
    exact_scores_file = ROOT / "samples" / "exact_scores.json"
    if exact_scores_file.is_file():
        for entry in json.loads(exact_scores_file.read_text(encoding="utf-8")):
            proxy_lookup[(entry["set"], entry["file"])] = float(entry["score"])

    if include_controls:
        for p in sorted(human_dir.glob("*.txt")):
            items.append({
                "id": f"human/{p.stem}",
                "split": "control_human",
                "path": str(p),
                "ref_path": None,
                "proxy_score": proxy_lookup.get(("human", p.name)),
            })
        for p in sorted(ai_dir.glob("*.txt")):
            items.append({
                "id": f"ai/{p.stem}",
                "split": "control_ai",
                "path": str(p),
                "ref_path": None,
                "proxy_score": proxy_lookup.get(("ai", p.name)),
            })

    if candidates_dir is not None:
        if not candidates_dir.is_dir():
            raise FileNotFoundError(f"Candidates directory not found: {candidates_dir}")
        for p in sorted(candidates_dir.glob("*.txt")):
            ref = ai_dir / p.name
            # Also check sidecar JSON (like outputs/cf-fast/conv01.txt.json) for proxy score
            proxy_score = None
            sidecar = p.with_name(p.name + ".json")
            if sidecar.is_file():
                try:
                    sc = json.loads(sidecar.read_text(encoding="utf-8"))
                    for k in ("final_score", "end_score", "score", "exact_score"):
                        if isinstance(sc.get(k), (int, float)):
                            proxy_score = float(sc[k])
                            break
                except Exception:
                    pass
            items.append({
                "id": f"cand/{p.stem}",
                "split": "candidate",
                "path": str(p),
                "ref_path": str(ref) if ref.is_file() else None,
                "proxy_score": proxy_score,
            })

    if limit is not None:
        # Apply limit per split so controls & candidates stay balanced
        grouped: dict[str, list[dict[str, Any]]] = {}
        for it in items:
            grouped.setdefault(it["split"], []).append(it)
        items = []
        for split_items in grouped.values():
            items.extend(split_items[:limit])

    return items


# ---------------------------------------------------------------------------
# Manual web-tier export / import
# ---------------------------------------------------------------------------

def export_manual_batch(items: list[dict[str, Any]], out_dir: pathlib.Path) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    manifest_rows = []
    for idx, it in enumerate(items, start=1):
        code = f"{idx:02d}-{it['split']}-{pathlib.Path(it['path']).stem}.txt"
        text = pathlib.Path(it["path"]).read_text(encoding="utf-8")
        (out_dir / code).write_text(text, encoding="utf-8")
        manifest_rows.append({
            "file": code,
            "id": it["id"],
            "split": it["split"],
            "words": len(text.split()),
            "proxy_score": it.get("proxy_score") if it.get("proxy_score") is not None else "",
            "pangram_ai_pct": "",
            "pangram_assisted_pct": "",
            "gptzero_ai_pct": "",
            "gptzero_class": "",
            "zerogpt_ai_pct": "",
            "notes": "",
        })
    csv_path = out_dir / "scores.csv"
    with csv_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(manifest_rows[0].keys()))
        writer.writeheader()
        writer.writerows(manifest_rows)
    print(f"Exported {len(manifest_rows)} files to {out_dir}")
    print(f"Record web detector scores in {csv_path}, then run:")
    print(f"  python eval/benchmark.py --import-manual {csv_path}")


def import_manual_csv(csv_path: pathlib.Path) -> None:
    rows = list(csv.DictReader(csv_path.open(encoding="utf-8")))
    by_split: dict[str, list[dict[str, str]]] = {}
    for r in rows:
        by_split.setdefault(r["split"], []).append(r)

    def _floats(split_rows: list[dict[str, str]], col: str) -> list[float]:
        out = []
        for r in split_rows:
            v = (r.get(col) or "").strip().rstrip("%")
            if v:
                out.append(float(v))
        return out

    print(f"\nManual Benchmark Summary ({csv_path}):")
    print(f"{'Split':<16} {'N':>3} {'Pangram AI+Asst%':>18} {'GPTZero AI%':>13} {'ZeroGPT AI%':>13}")
    print("-" * 68)
    for split, srows in by_split.items():
        pg_ai = _floats(srows, "pangram_ai_pct")
        pg_as = _floats(srows, "pangram_assisted_pct")
        pg_comb = [a + (pg_as[i] if i < len(pg_as) else 0.0) for i, a in enumerate(pg_ai)]
        gz = _floats(srows, "gptzero_ai_pct")
        zg = _floats(srows, "zerogpt_ai_pct")
        fmt = lambda vals: f"{statistics.mean(vals):.1f}%" if vals else "-"
        print(f"{split:<16} {len(srows):>3} {fmt(pg_comb):>18} {fmt(gz):>13} {fmt(zg):>13}")


# ---------------------------------------------------------------------------
# Evaluation runner & reporting
# ---------------------------------------------------------------------------

def evaluate_pass(record: dict[str, Any], thresholds: dict[str, float]) -> dict[str, bool]:
    checks: dict[str, bool] = {}
    pg = record.get("pangram")
    if pg:
        checks["pangram_pass"] = pg["fraction_ai_combined"] <= thresholds["pangram_max_ai_combined"]
    gz = record.get("gptzero")
    if gz:
        checks["gptzero_doc_pass"] = gz["completely_generated_prob"] <= thresholds["gptzero_max_doc_ai"]
        checks["gptzero_sent_pass"] = gz["flagged_sentence_fraction"] <= thresholds["gptzero_max_flagged_sent_frac"]
        checks["gptzero_pass"] = checks["gptzero_doc_pass"] and checks["gptzero_sent_pass"]
    diag = record.get("diagnostics", {})
    if "length_ratio" in diag:
        checks["preservation_pass"] = (
            thresholds["min_length_ratio"] <= diag["length_ratio"] <= thresholds["max_length_ratio"]
            and diag.get("number_retention", 1.0) >= thresholds["min_number_retention"]
        )
    detector_keys = [k for k in ("pangram_pass", "gptzero_pass") if k in checks]
    if detector_keys:
        checks["overall_pass"] = all(checks[k] for k in detector_keys) and checks.get("preservation_pass", True)
    return checks


def print_summary(records: list[dict[str, Any]], report_path: pathlib.Path | None) -> None:
    by_split: dict[str, list[dict[str, Any]]] = {}
    for r in records:
        by_split.setdefault(r["split"], []).append(r)

    print("\n=== Benchmark Summary ===")
    header = f"{'Split':<15} {'N':>3} {'Words':>7} {'Pangram(AI+Asst)':>17} {'GPTZero(Doc)':>14} {'GZ FlagSent':>12} {'Pass':>8}"
    print(header)
    print("-" * len(header))

    for split, srows in by_split.items():
        words = sum(r["diagnostics"]["words"] for r in srows)
        pg_vals = [r["pangram"]["fraction_ai_combined"] for r in srows if "pangram" in r]
        gz_vals = [r["gptzero"]["completely_generated_prob"] for r in srows if "gptzero" in r]
        gz_sf = [r["gptzero"]["flagged_sentence_fraction"] for r in srows if "gptzero" in r]
        passes = [r["checks"]["overall_pass"] for r in srows if "overall_pass" in r.get("checks", {})]

        pg_s = f"{statistics.mean(pg_vals) * 100:.1f}%" if pg_vals else "-"
        gz_s = f"{statistics.mean(gz_vals) * 100:.1f}%" if gz_vals else "-"
        sf_s = f"{statistics.mean(gz_sf) * 100:.1f}%" if gz_sf else "-"
        pass_s = f"{sum(passes)}/{len(passes)}" if passes else "-"
        print(f"{split:<15} {len(srows):>3} {words:>7} {pg_s:>17} {gz_s:>14} {sf_s:>12} {pass_s:>8}")

    # Local proxy vs commercial detector correlation check
    for det_name, extractor in (
        ("Pangram (AI+Asst)", lambda r: r["pangram"]["fraction_ai_combined"] if "pangram" in r else None),
        ("GPTZero (Doc AI)", lambda r: r["gptzero"]["completely_generated_prob"] if "gptzero" in r else None),
    ):
        pairs = [
            (r["proxy_score"], extractor(r))
            for r in records
            if r.get("proxy_score") is not None and extractor(r) is not None
        ]
        if len(pairs) >= 3:
            rho = spearman_corr([p[0] for p in pairs], [p[1] for p in pairs])
            print(f"Proxy vs {det_name} Spearman rho (n={len(pairs)}): {rho}")

    if report_path:
        print(f"\nSaved full JSON report to: {report_path}")


def main() -> int:
    load_dotenv_files()
    ap = argparse.ArgumentParser(description="Benchmark texts against Pangram and GPTZero.")
    ap.add_argument("--candidates", type=pathlib.Path, help="Directory of candidate .txt outputs to evaluate.")
    ap.add_argument("--include-controls", action="store_true", help="Include samples/human and samples/ai baselines.")
    ap.add_argument("--detectors", nargs="+", choices=["pangram", "gptzero"], default=["pangram", "gptzero"])
    ap.add_argument("--pangram-model", default=os.environ.get("PANGRAM_MODEL", "pangram-4"))
    ap.add_argument("--gptzero-model-version", default=os.environ.get("GPTZERO_MODEL_VERSION"))
    ap.add_argument("--limit", type=int, help="Max files per split (useful for cheap smoke tests).")
    ap.add_argument("--cache-dir", type=pathlib.Path, default=DEFAULT_CACHE_DIR)
    ap.add_argument("--no-cache", action="store_true")
    ap.add_argument("--dry-run", action="store_true", help="List items, word counts, and cache hits without calling APIs.")
    ap.add_argument("--export-manual", type=pathlib.Path, help="Export blind batch + CSV for manual web-tier scoring.")
    ap.add_argument("--import-manual", type=pathlib.Path, help="Summarize a completed manual scores.csv.")
    ap.add_argument("--out", type=pathlib.Path, help="Path to write JSON report.")
    args = ap.parse_args()

    if args.import_manual:
        import_manual_csv(args.import_manual)
        return 0

    if not args.candidates and not args.include_controls:
        ap.error("Specify --candidates <dir> and/or --include-controls (or --import-manual <csv>).")

    items = collect_items(args.candidates, args.include_controls, limit=args.limit)
    if not items:
        print("No .txt files found to evaluate.", file=sys.stderr)
        return 1

    if args.export_manual:
        export_manual_batch(items, args.export_manual)
        return 0

    pg_key = os.environ.get("PANGRAM_API_KEY", "")
    gz_key = os.environ.get("GPTZERO_API_KEY", "")

    if not args.dry_run:
        if "pangram" in args.detectors and not pg_key:
            print("Missing PANGRAM_API_KEY in environment or .env (use --dry-run or --detectors gptzero).", file=sys.stderr)
            return 2
        if "gptzero" in args.detectors and not gz_key:
            print("Missing GPTZERO_API_KEY in environment or .env (use --dry-run or --detectors pangram).", file=sys.stderr)
            return 2

    records: list[dict[str, Any]] = []
    uncached_calls = {d: 0 for d in args.detectors}
    uncached_words = {d: 0 for d in args.detectors}

    for it in items:
        text = pathlib.Path(it["path"]).read_text(encoding="utf-8")
        ref_text = pathlib.Path(it["ref_path"]).read_text(encoding="utf-8") if it["ref_path"] else None
        text_hash = sha256_text(text)
        diag = text_diagnostics(text, ref_text)
        rec: dict[str, Any] = {
            "id": it["id"],
            "split": it["split"],
            "path": it["path"],
            "sha256": text_hash[:12],
            "proxy_score": it["proxy_score"],
            "diagnostics": diag,
        }

        if "pangram" in args.detectors:
            cached = None if args.no_cache else load_cache(args.cache_dir, "pangram", args.pangram_model, text_hash)
            if cached is not None:
                rec["pangram"] = cached
            elif args.dry_run:
                uncached_calls["pangram"] += 1
                uncached_words["pangram"] += diag["words"]
            else:
                print(f"[pangram] scoring {it['id']} ({diag['words']} words)...", flush=True)
                res = score_pangram(text, api_key=pg_key, model=args.pangram_model)
                save_cache(args.cache_dir, "pangram", args.pangram_model, text_hash, res)
                rec["pangram"] = res

        if "gptzero" in args.detectors:
            gz_ver = args.gptzero_model_version or "latest"
            cached = None if args.no_cache else load_cache(args.cache_dir, "gptzero", gz_ver, text_hash)
            if cached is not None:
                rec["gptzero"] = cached
            elif args.dry_run:
                uncached_calls["gptzero"] += 1
                uncached_words["gptzero"] += diag["words"]
            else:
                print(f"[gptzero] scoring {it['id']} ({diag['words']} words)...", flush=True)
                res = score_gptzero(text, api_key=gz_key, model_version=args.gptzero_model_version)
                save_cache(args.cache_dir, "gptzero", gz_ver, text_hash, res)
                rec["gptzero"] = res

        rec["checks"] = evaluate_pass(rec, DEFAULT_THRESHOLDS)
        records.append(rec)

    if args.dry_run:
        print(f"Dry run complete: {len(records)} texts ready.")
        for d in args.detectors:
            print(f"  {d}: {uncached_calls[d]} uncached API calls (~{uncached_words[d]:,} words)")
        print_summary(records, None)
        return 0

    DEFAULT_REPORT_DIR.mkdir(parents=True, exist_ok=True)
    report_path = args.out or (DEFAULT_REPORT_DIR / f"bench-{time.strftime('%Y%m%d-%H%M%S')}.json")
    report_path.parent.mkdir(parents=True, exist_ok=True)
    # Strip bulky raw API payloads from the top-level summary report? Keep them in cache, store concise metrics in report.
    compact_records = []
    for r in records:
        cr = dict(r)
        for d in ("pangram", "gptzero"):
            if d in cr:
                cr[d] = {k: v for k, v in cr[d].items() if k != "raw"}
        compact_records.append(cr)

    report_path.write_text(
        json.dumps({"thresholds": DEFAULT_THRESHOLDS, "records": compact_records}, indent=2),
        encoding="utf-8",
    )
    print_summary(records, report_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
