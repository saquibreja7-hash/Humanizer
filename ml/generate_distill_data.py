#!/usr/bin/env python3
"""Generate 1-pass distillation training pairs with the proven 5-round HIP teacher.

What this does (plain English):
  You feed it AI-written drafts. For each draft it runs the SLOW but PROVEN
  teacher — the `jamsaq-v1` model on Cerebellum Cloud doing 5 sequential
  rewriting rounds — and records the FINAL output. Each (AI draft -> final clean
  rewrite) pair becomes one training example for `jamsaq-v2`, the private 1-pass
  student model that will produce the same quality in a single inference call
  (2-3 seconds instead of 15-20).

  Every pair must pass STRICT fidelity gates before it is written, so the
  student never learns from a rewrite that dropped a quote, changed a number,
  or hallucinated new facts:
    - length ratio (target words / source words) between 0.75 and 1.30
    - at least 80% of 4-word phrases rebuilt (i.e. genuinely rephrased)
    - 100% of quoted material retained
    - at least 90% of numbers retained
    - ZERO new numbers invented by the teacher
    - optional: LLM semantic-equivalence check (--semantic-check)

CRITICAL (same rule as the SaaS engine): the teacher is a RAW BASE model and
MUST be called via `POST {backend}/v1/completions` — NEVER `/v1/chat/completions`.
Chat templates destroy the base-model distribution.

Input formats (--input may be given multiple times):
  - a .jsonl file: one JSON object per line with the draft in a "text",
    "source", or "body" field (optional "style": academic|blog|casual|business)
  - a .txt file: the whole file is one draft
  - a directory: every *.txt / *.jsonl inside it is loaded (subdirectory name
    becomes the style tag, e.g. ml/data/ai_drafts/blog/x.txt -> style "blog")

Output:
  - clean pairs  -> --output (default ml/data/distill_train.jsonl):
        {"source": <AI draft chunk>, "target": <teacher rewrite>, "style": <tag|null>}
  - rejected pairs -> <output>.rejected.jsonl with a human-readable "reasons" list

Environment (loaded from .env.local / .env at repo root, real env always wins):
  CEREBELLUM_API_KEY   Bearer key for Cerebellum Cloud        (required, real runs)
  HIP_BACKEND_URL      default https://api.cerebellumlabs.ai
  HIP_MODEL_NAME       default jamsaq-v1 (the teacher)
  HIP_WORKERS          parallel teacher workers, default 6
  JUDGE_API_KEY / JUDGE_BASE_URL / JUDGE_MODEL   only for --semantic-check

Examples:
  # No network, no key: validate inputs, show chunking stats and cost estimate
  python ml/generate_distill_data.py --input ml/data/ai_drafts.jsonl --dry-run

  # Real run: 5-round teacher, 6 workers, strict gates
  python ml/generate_distill_data.py --input ml/data/ai_drafts.jsonl --output ml/data/distill_train.jsonl

  # Cheap smoke run: 1 round, first 3 drafts only (for --limit use files, not count)
  python ml/generate_distill_data.py --input ml/data/ai_drafts.jsonl --rounds 1 --limit 3
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
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from typing import Any

ROOT = pathlib.Path(__file__).resolve().parent.parent

# Pricing used only for cost ESTIMATES in --dry-run (USD per 1M tokens).
CEREBELLUM_PRICE_IN = 0.75
CEREBELLUM_PRICE_OUT = 2.25
# Rough tokens-per-word for English on the Qwen3 tokenizer (estimate only).
TOKENS_PER_WORD = 1.4

# Strict fidelity gates (Section 4.4 of SPEC.md).
GATES = {
    "min_length_ratio": 0.75,
    "max_length_ratio": 1.30,
    "min_rebuilt_pct": 80.0,
    "min_number_retention": 0.90,
    "min_quote_retention": 1.00,  # 100% of quotes must survive
    "max_added_numbers": 0,
}

VALID_STYLES = ("academic", "blog", "casual", "business")


# ---------------------------------------------------------------------------
# .env loading (never overrides variables that are already set)
# ---------------------------------------------------------------------------

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
            k = k.strip()
            v = v.strip().strip('"').strip("'")
            if k and k not in os.environ:
                os.environ[k] = v


def env(name: str, fallback: str = "") -> str:
    return os.environ.get(name, fallback).strip()


# ---------------------------------------------------------------------------
# Input loading: JSONL / TXT / directory of either
# ---------------------------------------------------------------------------

@dataclass
class DraftItem:
    text: str
    style: str | None = None


def _style_from_obj(obj: dict[str, Any]) -> str | None:
    s = str(obj.get("style") or "").strip().lower()
    return s if s in VALID_STYLES else None


def load_jsonl(path: pathlib.Path) -> list[DraftItem]:
    items: list[DraftItem] = []
    for ln, line in enumerate(path.read_text(encoding="utf-8", errors="ignore").splitlines(), 1):
        line = line.strip()
        if not line:
            continue
        try:
            obj = json.loads(line)
        except json.JSONDecodeError as e:
            raise ValueError(f"{path}:{ln}: not valid JSON ({e})") from e
        text = obj.get("text") or obj.get("source") or obj.get("body") or ""
        if not isinstance(text, str) or not text.strip():
            raise ValueError(f"{path}:{ln}: no non-empty 'text'/'source'/'body' field")
        items.append(DraftItem(text=text.strip(), style=_style_from_obj(obj)))
    return items


def load_input(path: pathlib.Path) -> list[DraftItem]:
    """Load drafts from a .jsonl, a .txt, or a directory (recursive)."""
    if path.is_dir():
        items: list[DraftItem] = []
        for p in sorted(path.rglob("*")):
            sub = p.parent.name.lower() if p.parent != path else None
            tag = sub if sub in VALID_STYLES else None
            if p.suffix.lower() == ".jsonl":
                for it in load_jsonl(p):
                    items.append(DraftItem(text=it.text, style=it.style or tag))
            elif p.suffix.lower() == ".txt":
                txt = p.read_text(encoding="utf-8", errors="ignore").strip()
                if txt:
                    items.append(DraftItem(text=txt, style=tag))
        return items
    if path.suffix.lower() == ".jsonl":
        return load_jsonl(path)
    if path.is_file():
        txt = path.read_text(encoding="utf-8", errors="ignore").strip()
        return [DraftItem(text=txt)] if txt else []
    raise FileNotFoundError(path)


# ---------------------------------------------------------------------------
# Chunking — same rules as the proven engine (reference/engine.py)
# ---------------------------------------------------------------------------

@dataclass
class Chunk:
    index: int
    text: str
    passthrough: bool = False


def is_heading_or_short(para: str) -> bool:
    words = para.split()
    if len(words) <= 12 and not para.endswith((".", "!", "?")):
        return True
    if len(words) <= 6:
        return True
    return False


def split_into_chunks(text: str, target_words: int = 220, max_words: int = 320) -> list[Chunk]:
    """Paragraph-aligned chunks; headings/short lines marked passthrough."""
    raw_paras = [p.strip() for p in re.split(r"\n\s*\n", text.strip()) if p.strip()]
    chunks: list[Chunk] = []
    buf: list[str] = []
    buf_words = 0

    def flush() -> None:
        nonlocal buf, buf_words
        if buf:
            chunks.append(Chunk(len(chunks), "\n\n".join(buf), passthrough=False))
            buf, buf_words = [], 0

    for para in raw_paras:
        if is_heading_or_short(para):
            flush()
            chunks.append(Chunk(len(chunks), para, passthrough=True))
            continue
        wc = len(para.split())
        if wc > max_words:
            flush()
            sents = [s.strip() for s in re.split(r"(?<=[.!?])\s+", para) if s.strip()]
            cur: list[str] = []
            cur_w = 0
            for s in sents:
                sw = len(s.split())
                if cur and cur_w + sw > target_words:
                    chunks.append(Chunk(len(chunks), " ".join(cur), passthrough=False))
                    cur, cur_w = [s], sw
                else:
                    cur.append(s)
                    cur_w += sw
            if cur:
                chunks.append(Chunk(len(chunks), " ".join(cur), passthrough=False))
            continue
        if buf and buf_words + wc > target_words:
            flush()
        buf.append(para)
        buf_words += wc
    flush()
    return chunks


# ---------------------------------------------------------------------------
# Fidelity math (identical to reference/engine.py + src/lib/fidelity.ts)
# ---------------------------------------------------------------------------

def _ngrams(text: str, n: int) -> set[tuple[str, ...]]:
    toks = re.findall(r"[a-z]+", text.lower())
    return {tuple(toks[i:i + n]) for i in range(max(0, len(toks) - n + 1))}


def _extract_quotes(text: str) -> list[str]:
    found = re.findall(r'["\u201c]([^"\u201d]{4,120})["\u201d]', text)
    return [q.strip().rstrip(".,;:") for q in found if len(q.split()) >= 2]


def _extract_numbers(text: str) -> set[str]:
    return set(re.findall(r"\b\d+(?:[.,]\d+)?%?\b", text))


def fidelity_report(original: str, rewritten: str) -> dict[str, Any]:
    orig4, rew4 = _ngrams(original, 4), _ngrams(rewritten, 4)
    kept = len(orig4 & rew4) / max(len(orig4), 1)
    ow, rw = len(original.split()), len(rewritten.split())
    oq, rn = _extract_quotes(original), rewritten.lower()
    missing_q = [q for q in oq if q.lower() not in rn]
    on, nn = _extract_numbers(original), _extract_numbers(rewritten)
    return {
        "original_words": ow,
        "rewritten_words": rw,
        "length_ratio": round(rw / max(ow, 1), 3),
        "phrases_rebuilt_pct": round((1.0 - kept) * 100.0, 1),
        "quotes_total": len(oq),
        "quotes_kept": len(oq) - len(missing_q),
        "numbers_total": len(on),
        "numbers_kept": len(on & nn),
        "missing_numbers": sorted(on - nn),
        "added_numbers": sorted(nn - on),
    }


def gate_failures(rep: dict[str, Any]) -> list[str]:
    """Apply the strict Section 4.4 gates. Empty list == pair accepted."""
    bad: list[str] = []
    if not (GATES["min_length_ratio"] <= rep["length_ratio"] <= GATES["max_length_ratio"]):
        bad.append(f"length_ratio {rep['length_ratio']} outside "
                   f"[{GATES['min_length_ratio']}, {GATES['max_length_ratio']}]")
    if rep["phrases_rebuilt_pct"] < GATES["min_rebuilt_pct"]:
        bad.append(f"only {rep['phrases_rebuilt_pct']}% of 4-word phrases rebuilt "
                    f"(< {GATES['min_rebuilt_pct']}%)")
    if rep["quotes_total"] and rep["quotes_kept"] < rep["quotes_total"]:
        bad.append("quote changed or dropped")
    if rep["numbers_total"]:
        retention = rep["numbers_kept"] / rep["numbers_total"]
        if retention < GATES["min_number_retention"]:
            bad.append(f"number retention {retention:.0%} < "
                       f"{GATES['min_number_retention']:.0%} (missing: "
                       f"{', '.join(rep['missing_numbers'][:5])})")
    if len(rep["added_numbers"]) > GATES["max_added_numbers"]:
        bad.append(f"teacher invented new number(s): {', '.join(rep['added_numbers'][:5])}")
    return bad


# ---------------------------------------------------------------------------
# Teacher client — raw /v1/completions against jamsaq-v1 (NEVER chat/completions)
# ---------------------------------------------------------------------------

def build_prompt(source_text: str) -> str:
    return ("<source_text>\n"
            f"{source_text.strip()}\n"
            "</source_text>\n\n"
            "<target_text>\n")


def clean_output(raw: str) -> str:
    text = (raw or "").strip()
    if text.startswith("<target_text>"):
        text = text[len("<target_text>"):].lstrip()
    for tag in ("</target_text>", "<source_text>"):
        if tag in text:
            text = text.split(tag, 1)[0].rstrip()
    return text.strip()


def complete_once(
    source_text: str,
    *,
    api_key: str,
    base_url: str,
    model: str,
    temperature: float,
    top_p: float,
    max_new_tokens: int,
    timeout: int = 600,
) -> str:
    prompt = build_prompt(source_text)
    url = f"{base_url.rstrip('/')}/v1/completions"
    payload = {
        "model": model,
        "prompt": prompt,
        "max_tokens": max_new_tokens,
        "temperature": temperature,
        "top_p": top_p,
        "stop": ["</target_text>", "<source_text>"],
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Cerebellum HTTP {e.code}: {detail}") from e

    if "choices" not in data or not data["choices"]:
        raise RuntimeError(f"unexpected completions response: {json.dumps(data)[:300]}")
    return clean_output(data["choices"][0].get("text", ""))


def teacher_rewrite(
    source: str,
    *,
    rounds: int,
    temperature: float,
    api_key: str,
    base_url: str,
    model: str,
) -> tuple[str, list[int]]:
    """Run N sequential HIP rounds over one chunk. Returns (final_text, per-round words)."""
    current = source.strip()
    words_per_round: list[int] = []
    est_tokens = max(384, min(1024, int(len(current.split()) * 2.2)))
    for _ in range(rounds):
        nxt = complete_once(
            current,
            api_key=api_key, base_url=base_url, model=model,
            temperature=temperature, top_p=0.95, max_new_tokens=est_tokens,
        )
        # Collapse guard: keep previous round if the model imploded (<45% of words).
        if len(nxt.split()) >= max(10, int(len(current.split()) * 0.45)):
            current = nxt
        words_per_round.append(len(current.split()))
    return current, words_per_round


# ---------------------------------------------------------------------------
# Optional LLM semantic-equivalence judge (off by default)
# ---------------------------------------------------------------------------

def semantic_check(source: str, target: str) -> tuple[bool, str]:
    """Ask an OpenAI-compatible chat model whether the rewrite kept the meaning.

    Returns (ok, answer). Uses JUDGE_API_KEY / JUDGE_BASE_URL / JUDGE_MODEL.
    """
    api_key = env("JUDGE_API_KEY")
    base_url = env("JUDGE_BASE_URL", "https://api.openai.com/v1")
    model = env("JUDGE_MODEL", "gpt-4o-mini")
    if not api_key:
        return True, "skipped (no JUDGE_API_KEY)"
    prompt = (
        "You are a strict fact-checking judge. Text A is an original draft and "
        "Text B is a rewritten version of it. Answer YES if Text B preserves "
        "every fact, claim, quote, and figure of Text A without inventing new "
        "information, otherwise answer NO. Reply with YES or NO only.\n\n"
        f"Text A:\n{source}\n\nText B:\n{target}\n\nAnswer (YES/NO):"
    )
    url = f"{base_url.rstrip('/')}/chat/completions"
    body = {"model": model, "temperature": 0.0, "max_tokens": 8,
            "messages": [{"role": "user", "content": prompt}]}
    req = urllib.request.Request(
        url, data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"},
        method="POST")
    with urllib.request.urlopen(req, timeout=120) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    answer = (data["choices"][0]["message"]["content"] or "").strip().upper()
    return answer.startswith("Y"), answer


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> int:
    load_env_files()
    ap = argparse.ArgumentParser(
        description="Generate 1-pass distillation pairs with the 5-round jamsaq-v1 teacher.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="See ml/README.md for the full walkthrough.")
    ap.add_argument("--input", action="append", type=pathlib.Path, default=None,
                    help="Draft source: .jsonl file, .txt file, or a directory "
                         "(repeatable; default: ml/data/ai_drafts/ then ml/data/ai_drafts.jsonl)")
    ap.add_argument("--output", type=pathlib.Path, default=pathlib.Path("ml/data/distill_train.jsonl"),
                    help="Clean training pairs JSONL (default: %(default)s)")
    ap.add_argument("--style", default=None, choices=VALID_STYLES,
                    help="Fallback style tag for inputs without one")
    ap.add_argument("--rounds", type=int, default=5,
                    help="Teacher rounds per chunk (default: 5 = the proven Standard mode)")
    ap.add_argument("--temperature", type=float, default=1.0,
                    help="Teacher sampling temperature (default 1.0 — the proven 0%%-AI setting)")
    ap.add_argument("--workers", type=int, default=int(env("HIP_WORKERS", "6")),
                    help="Parallel teacher workers (default: HIP_WORKERS or 6)")
    ap.add_argument("--limit", type=int, default=None,
                    help="Stop after N accepted pairs (cheap smoke runs)")
    ap.add_argument("--min-chunk-words", type=int, default=120,
                    help="Ignore body chunks shorter than this (tiny pairs teach badly)")
    ap.add_argument("--semantic-check", action="store_true",
                    help="Additionally ask an LLM judge to verify meaning preservation")
    ap.add_argument("--dry-run", action="store_true",
                    help="Validate inputs and print the plan + cost estimate; no network, no key needed")
    args = ap.parse_args()

    # ---- Resolve inputs ----------------------------------------------------
    input_paths = list(args.input) if args.input else []
    if not input_paths:
        for cand in (ROOT / "ml/data/ai_drafts", ROOT / "ml/data/ai_drafts.jsonl"):
            if cand.exists():
                input_paths.append(cand)
    if not input_paths:
        print("No --input given and no default found at ml/data/ai_drafts(.jsonl).")
        print("Create one first, e.g.:")
        print('  {"text": "Your stiff AI draft paragraph here...", "style": "blog"}   # ml/data/ai_drafts.jsonl')
        print("(this message is expected on a fresh checkout; re-run with --input <path>)")
        return 0

    items: list[DraftItem] = []
    for p in input_paths:
        try:
            loaded = load_input(p)
        except (FileNotFoundError, ValueError) as e:
            print(f"ERROR: {e}", file=sys.stderr)
            return 2
        items.extend(loaded)
    if args.style:
        s = args.style.lower()
        for it in items:
            it.style = it.style or s

    # ---- Chunk every draft; drop headings/passthrough ----------------------
    jobs: list[tuple[DraftItem, Chunk]] = []
    for it in items:
        for ch in split_into_chunks(it.text):
            if ch.passthrough:
                continue
            if len(ch.text.split()) < args.min_chunk_words:
                continue
            jobs.append((it, ch))

    total_words = sum(len(c.text.split()) for _, c in jobs)
    model = env("HIP_MODEL_NAME", "jamsaq-v1")
    base_url = env("HIP_BACKEND_URL", "https://api.cerebellumlabs.ai")
    api_key = env("CEREBELLUM_API_KEY")
    teacher_calls = len(jobs) * args.rounds
    # Rough token estimate: each round reads prompt+chunk and writes ~chunk.
    in_tok = int(total_words * TOKENS_PER_WORD * (1 + 0.2 * args.rounds))
    out_tok = int(total_words * TOKENS_PER_WORD * args.rounds)
    est_cost = in_tok / 1e6 * CEREBELLUM_PRICE_IN + out_tok / 1e6 * CEREBELLUM_PRICE_OUT

    style_counts: dict[str, int] = {}
    for it, _ in jobs:
        style_counts[it.style or "(none)"] = style_counts.get(it.style or "(none)", 0) + 1

    print(f"Loaded {len(items)} draft(s) -> {len(jobs)} rewriteable chunk(s) "
          f"({total_words:,} words, headings passed through and skipped)")
    print(f"Style tags: {json.dumps(style_counts, sort_keys=True)}")
    print(f"Teacher: {model} @ {base_url} | rounds={args.rounds} | "
          f"temperature={args.temperature} | workers={args.workers}")
    print(f"Teacher API calls: {teacher_calls:,} | est. tokens in={in_tok:,} out={out_tok:,} "
          f"| est. cost ~${est_cost:.2f}")

    if args.dry_run:
        print("\nDRY RUN — nothing was sent, no key used. Plan above is what would happen.")
        if not jobs:
            print("No usable body chunks found (all inputs too short/heading-like).")
        return 0

    if not api_key:
        print("ERROR: CEREBELLUM_API_KEY is not set (.env.local or environment).", file=sys.stderr)
        return 2

    # ---- Real run: parallel teacher over chunks -----------------------------
    args.output.parent.mkdir(parents=True, exist_ok=True)
    rejected_path = args.output.with_suffix(args.output.suffix + ".rejected.jsonl")

    accepted: list[dict[str, Any]] = []
    rejected: list[dict[str, Any]] = []
    t0 = time.time()
    done = 0

    def run_job(pair: tuple[DraftItem, Chunk]) -> dict[str, Any]:
        it, ch = pair
        final, per_round = teacher_rewrite(
            ch.text,
            rounds=args.rounds, temperature=args.temperature,
            api_key=api_key, base_url=base_url, model=model)
        rep = fidelity_report(ch.text, final)
        reasons = gate_failures(rep)
        if not reasons and args.semantic_check:
            ok, answer = semantic_check(ch.text, final)
            if not ok:
                reasons.append(f"semantic judge said {answer!r}")
        return {"source": ch.text, "target": final, "style": it.style,
                "reasons": reasons, "report": rep, "per_round": per_round}

    with ThreadPoolExecutor(max_workers=max(1, args.workers)) as pool:
        futures = {pool.submit(run_job, j): j for j in jobs}
        for fut in as_completed(futures):
            res = fut.result()  # worker errors bubble up and abort the run
            done += 1
            src_words = len(res["source"].split())
            tgt_words = len(res["target"].split())
            if res["reasons"]:
                rejected.append(res)
                print(f"[{done}/{len(jobs)}] REJECT ({src_words}w->{tgt_words}w): "
                      f"{'; '.join(res['reasons'])}", flush=True)
            else:
                accepted.append({"source": res["source"], "target": res["target"],
                                 "style": res["style"]})
                print(f"[{done}/{len(jobs)}] ACCEPT ({src_words}w->{tgt_words}w, "
                      f"{res['report']['phrases_rebuilt_pct']}% rebuilt)", flush=True)
            if args.limit and len(accepted) >= args.limit:
                for f in futures:
                    f.cancel()
                break

    with args.output.open("w", encoding="utf-8") as f:
        for row in accepted:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")
    with rejected_path.open("w", encoding="utf-8") as f:
        for row in rejected:
            f.write(json.dumps({"source": row["source"], "target": row["target"],
                                "style": row["style"], "reasons": row["reasons"],
                                "report": row["report"]}, ensure_ascii=False) + "\n")

    elapsed = time.time() - t0
    print(f"\nDone in {elapsed:.0f}s: {len(accepted)} accepted pairs -> {args.output}")
    print(f"{len(rejected)} rejected pairs -> {rejected_path}")
    if rejected:
        rate = len(accepted) / (len(accepted) + len(rejected))
        print(f"Acceptance rate: {rate:.0%} (expect 70-90% on 160-320-word chunks; "
              f"very short chunks and very high rates of rejection usually mean "
              f"chunk sizes under ~150 words or a wrong temperature — see the "
              f"reasons in the rejected file)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
