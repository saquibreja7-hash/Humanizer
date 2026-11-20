#!/usr/bin/env python3
"""Phase 1 HIP Humanizer Engine (pure Python stdlib, zero external dependencies).

Uses a raw Base Model + HIP LoRA adapter with iterative paraphrasing rounds:
  <source_text>...</source_text> -> <target_text>...</target_text>

Works with either:
  - llama.cpp server (`HIP_BACKEND_MODE=llama`, POST /completion)
  - vLLM / Modal / RunPod OpenAI-compatible server (`HIP_BACKEND_MODE=openai`, POST /v1/completions)

CLI usage:
  python hip_app/engine.py samples/ai/conv03.txt -o out.txt --rounds 5
  python hip_app/engine.py paper.docx -o out.txt --rounds 5 --backend http://127.0.0.1:18082
"""
from __future__ import annotations

import argparse
import json
import os
import pathlib
import re
import sys
import time
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
import zipfile
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from typing import Callable

DEFAULT_BACKEND_URL = os.environ.get("HIP_BACKEND_URL", "http://127.0.0.1:18082")
DEFAULT_BACKEND_MODE = os.environ.get("HIP_BACKEND_MODE", "llama")  # "llama" or "openai"
DEFAULT_MODEL_NAME = os.environ.get("HIP_MODEL_NAME", "qwen3-4b-base-hip")
DEFAULT_API_KEY = os.environ.get("HIP_API_KEY", "")


# ---------------------------------------------------------------------------
# Document reading (.txt / .docx) & smart paragraph-preserving chunking
# ---------------------------------------------------------------------------

def read_input_text(path: pathlib.Path) -> str:
    if path.suffix.lower() == ".docx":
        ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
        with zipfile.ZipFile(path) as zf:
            root = ET.fromstring(zf.read("word/document.xml"))
        paras = []
        for p in root.findall(".//w:p", ns):
            txt = "".join(t.text or "" for t in p.findall(".//w:t", ns)).strip()
            if txt:
                paras.append(txt)
        return "\n\n".join(paras)
    return path.read_text(encoding="utf-8")


@dataclass
class Chunk:
    index: int
    text: str
    passthrough: bool = False  # True for headings / very short standalone lines


def is_heading_or_short(para: str) -> bool:
    """Keep short headings, titles, or bullet headers untouched."""
    words = para.split()
    if len(words) <= 12 and not para.endswith((".", "!", "?")):
        return True
    if len(words) <= 6:
        return True
    return False


def split_into_chunks(text: str, target_words: int = 220, max_words: int = 320) -> list[Chunk]:
    """Split text into paragraph-aligned chunks sized for HIP (150-320 words).

    - Headings / tiny lines are marked passthrough so formatting stays intact.
    - Very long paragraphs (> max_words) are split cleanly on sentence boundaries.
    - Short adjacent body paragraphs are grouped up to target_words so HIP has
      enough context to rewrite naturally without merging the whole document.
    """
    raw_paras = [p.strip() for p in re.split(r"\n\s*\n", text.strip()) if p.strip()]
    chunks: list[Chunk] = []
    buf: list[str] = []
    buf_words = 0

    def flush_buf() -> None:
        nonlocal buf, buf_words
        if buf:
            chunks.append(Chunk(index=len(chunks), text="\n\n".join(buf), passthrough=False))
            buf = []
            buf_words = 0

    for para in raw_paras:
        if is_heading_or_short(para):
            flush_buf()
            chunks.append(Chunk(index=len(chunks), text=para, passthrough=True))
            continue

        wc = len(para.split())
        if wc > max_words:
            flush_buf()
            # Split long paragraph cleanly at sentence boundaries
            sents = [s.strip() for s in re.split(r"(?<=[.!?])\s+", para) if s.strip()]
            cur: list[str] = []
            cur_w = 0
            for s in sents:
                sw = len(s.split())
                if cur and cur_w + sw > target_words:
                    chunks.append(Chunk(index=len(chunks), text=" ".join(cur), passthrough=False))
                    cur = [s]
                    cur_w = sw
                else:
                    cur.append(s)
                    cur_w += sw
            if cur:
                chunks.append(Chunk(index=len(chunks), text=" ".join(cur), passthrough=False))
            continue

        if buf and buf_words + wc > target_words:
            flush_buf()
        buf.append(para)
        buf_words += wc

    flush_buf()
    return chunks


# ---------------------------------------------------------------------------
# Quality & Fidelity checks (4-gram rebuild %, quote & number retention)
# ---------------------------------------------------------------------------

def _ngrams(text: str, n: int) -> set[tuple[str, ...]]:
    toks = re.findall(r"[a-z]+", text.lower())
    return {tuple(toks[i : i + n]) for i in range(max(0, len(toks) - n + 1))}


def _extract_quotes(text: str) -> list[str]:
    found = re.findall(r'["\u201c]([^"\u201d]{4,120})["\u201d]', text)
    return [q.strip().rstrip(".,;:") for q in found if len(q.split()) >= 2]


def _extract_numbers(text: str) -> set[str]:
    return set(re.findall(r"\b\d+(?:[.,]\d+)?%?\b", text))


def compute_fidelity_report(original: str, rewritten: str) -> dict:
    orig_4 = _ngrams(original, 4)
    rew_4 = _ngrams(rewritten, 4)
    kept_4 = len(orig_4 & rew_4) / max(len(orig_4), 1)
    rebuilt_4_pct = round((1.0 - kept_4) * 100.0, 1)

    orig_words = len(original.split())
    rew_words = len(rewritten.split())

    orig_quotes = _extract_quotes(original)
    rew_lower = rewritten.lower()
    missing_quotes = [q for q in orig_quotes if q.lower() not in rew_lower]

    orig_nums = _extract_numbers(original)
    rew_nums = _extract_numbers(rewritten)
    missing_nums = sorted(orig_nums - rew_nums)
    added_nums = sorted(rew_nums - orig_nums)

    warnings: list[str] = []
    if missing_quotes:
        warnings.append(f"Quote changed/missing: {', '.join(missing_quotes[:3])}")
    if missing_nums:
        warnings.append(f"Numbers dropped: {', '.join(missing_nums[:5])}")
    if added_nums:
        warnings.append(f"New numbers appeared (check for drift): {', '.join(added_nums[:5])}")
    if rebuilt_4_pct < 70.0:
        warnings.append(f"Only {rebuilt_4_pct}% of 4-word phrases rebuilt (try more rounds).")

    return {
        "original_words": orig_words,
        "rewritten_words": rew_words,
        "length_ratio": round(rew_words / max(orig_words, 1), 2),
        "phrases_rebuilt_pct": rebuilt_4_pct,
        "quotes_total": len(orig_quotes),
        "quotes_kept": len(orig_quotes) - len(missing_quotes),
        "missing_quotes": missing_quotes,
        "numbers_total": len(orig_nums),
        "numbers_kept": len(orig_nums) - len(missing_nums),
        "missing_numbers": missing_nums,
        "added_numbers": added_nums,
        "warnings": warnings,
    }


# ---------------------------------------------------------------------------
# Backend client (llama.cpp /completion OR vLLM OpenAI /v1/completions)
# ---------------------------------------------------------------------------

def build_hip_prompt(source_text: str) -> str:
    return (
        "<source_text>\n"
        f"{source_text.strip()}\n"
        "</source_text>\n\n"
        "<target_text>\n"
    )


def clean_hip_output(raw: str) -> str:
    text = (raw or "").strip()
    if text.startswith("<target_text>"):
        text = text[len("<target_text>"):].lstrip()
    for tag in ("</target_text>", "<source_text>"):
        if tag in text:
            text = text.split(tag, 1)[0].rstrip()
    return text.strip()


def check_backend_health(backend_url: str, mode: str = "llama", api_key: str = "") -> tuple[bool, str]:
    base = backend_url.rstrip("/")
    url = f"{base}/health" if mode == "llama" else f"{base}/v1/models"
    headers = {"Accept": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    try:
        req = urllib.request.Request(url, headers=headers, method="GET")
        with urllib.request.urlopen(req, timeout=5) as resp:
            return (resp.status == 200), f"OK ({resp.status})"
    except Exception as e:
        return False, str(e)


def complete_hip_once(
    source_text: str,
    *,
    backend_url: str = DEFAULT_BACKEND_URL,
    mode: str = DEFAULT_BACKEND_MODE,
    model_name: str = DEFAULT_MODEL_NAME,
    api_key: str = DEFAULT_API_KEY,
    temperature: float = 1.0,
    top_p: float = 0.95,
    max_new_tokens: int = 512,
    timeout: int = 600,
) -> str:
    prompt = build_hip_prompt(source_text)
    base = backend_url.rstrip("/")
    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    if mode == "openai":
        url = f"{base}/v1/completions"
        payload = {
            "model": model_name,
            "prompt": prompt,
            "max_tokens": max_new_tokens,
            "temperature": temperature,
            "top_p": top_p,
            "stop": ["</target_text>", "<source_text>"],
        }
    else:
        url = f"{base}/completion"
        payload = {
            "prompt": prompt,
            "n_predict": max_new_tokens,
            "temperature": temperature,
            "top_p": top_p,
            "stop": ["</target_text>", "<source_text>"],
        }

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Backend HTTP {e.code}: {detail}") from e

    if mode == "openai":
        raw = data["choices"][0]["text"]
    else:
        raw = data.get("content", "")
    cleaned = clean_hip_output(raw)
    return cleaned or source_text.strip()


# ---------------------------------------------------------------------------
# Full document pipeline (iterative rounds + optional parallel chunking)
# ---------------------------------------------------------------------------

@dataclass
class HumanizeConfig:
    rounds: int = 5
    temperature: float = 1.0
    top_p: float = 0.95
    target_chunk_words: int = 220
    max_chunk_words: int = 320
    max_workers: int = 1  # Set 4-8 when running on GPU / vLLM
    backend_url: str = field(default_factory=lambda: DEFAULT_BACKEND_URL)
    backend_mode: str = field(default_factory=lambda: DEFAULT_BACKEND_MODE)
    model_name: str = field(default_factory=lambda: DEFAULT_MODEL_NAME)
    api_key: str = field(default_factory=lambda: DEFAULT_API_KEY)


def humanize_document(
    text: str,
    cfg: HumanizeConfig | None = None,
    progress_cb: Callable[[str], None] | None = None,
) -> dict:
    cfg = cfg or HumanizeConfig()
    log = progress_cb or (lambda _msg: None)
    t_start = time.time()

    chunks = split_into_chunks(text, target_words=cfg.target_chunk_words, max_words=cfg.max_chunk_words)
    active_count = sum(1 for c in chunks if not c.passthrough)
    log(f"Split document into {len(chunks)} blocks ({active_count} to rewrite, {len(chunks) - active_count} headings kept as-is).")

    def process_chunk(chunk: Chunk) -> str:
        if chunk.passthrough:
            return chunk.text
        current = chunk.text
        # Size max_new_tokens proportionally so long chunks never get cut off
        est_tokens = max(384, min(1024, int(len(chunk.text.split()) * 2.2)))
        for r in range(1, cfg.rounds + 1):
            t0 = time.time()
            nxt = complete_hip_once(
                current,
                backend_url=cfg.backend_url,
                mode=cfg.backend_mode,
                model_name=cfg.model_name,
                api_key=cfg.api_key,
                temperature=cfg.temperature,
                top_p=cfg.top_p,
                max_new_tokens=est_tokens,
            )
            elapsed = round(time.time() - t0, 1)
            # Guard against empty/collapsed rewrite
            if len(nxt.split()) >= max(10, int(len(chunk.text.split()) * 0.45)):
                current = nxt
            log(f"Block {chunk.index + 1}/{len(chunks)} | Round {r}/{cfg.rounds} done in {elapsed}s ({len(current.split())} words)")
        return current

    if cfg.max_workers > 1 and active_count > 1:
        with ThreadPoolExecutor(max_workers=cfg.max_workers) as pool:
            rewritten_blocks = list(pool.map(process_chunk, chunks))
    else:
        rewritten_blocks = [process_chunk(c) for c in chunks]

    result_text = "\n\n".join(rewritten_blocks)
    report = compute_fidelity_report(text, result_text)
    report["rounds"] = cfg.rounds
    report["blocks"] = len(chunks)
    report["elapsed_s"] = round(time.time() - t_start, 1)
    log(
        f"Finished in {report['elapsed_s']}s | "
        f"4-word phrases rebuilt: {report['phrases_rebuilt_pct']}% | "
        f"Words: {report['original_words']} -> {report['rewritten_words']}"
    )
    return {"text": result_text, "report": report}


def main() -> int:
    ap = argparse.ArgumentParser(description="HIP Humanizer CLI (Phase 1)")
    ap.add_argument("input", type=pathlib.Path, help="Input .txt or .docx file")
    ap.add_argument("-o", "--output", type=pathlib.Path, help="Output .txt path (default: print to stdout)")
    ap.add_argument("--rounds", type=int, default=5, help="Iterative HIP rounds (default: 5)")
    ap.add_argument("--temperature", type=float, default=1.0)
    ap.add_argument("--top-p", type=float, default=0.95)
    ap.add_argument("--backend", default=DEFAULT_BACKEND_URL, help="Backend URL (llama-server or vLLM)")
    ap.add_argument("--mode", choices=["llama", "openai"], default=DEFAULT_BACKEND_MODE)
    ap.add_argument("--model", default=DEFAULT_MODEL_NAME)
    ap.add_argument("--workers", type=int, default=1, help="Parallel chunk workers (use 4-8 on GPU)")
    args = ap.parse_args()

    text = read_input_text(args.input)
    cfg = HumanizeConfig(
        rounds=args.rounds,
        temperature=args.temperature,
        top_p=args.top_p,
        max_workers=args.workers,
        backend_url=args.backend,
        backend_mode=args.mode,
        model_name=args.model,
    )
    res = humanize_document(text, cfg, progress_cb=lambda m: print(m, file=sys.stderr, flush=True))

    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(res["text"], encoding="utf-8")
        args.output.with_suffix(args.output.suffix + ".report.json").write_text(
            json.dumps(res["report"], indent=2), encoding="utf-8"
        )
        print(f"Saved to {args.output}", file=sys.stderr)
    else:
        print(res["text"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
