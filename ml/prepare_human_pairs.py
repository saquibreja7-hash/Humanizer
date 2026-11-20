#!/usr/bin/env python3
"""Build reverse training pairs from genuine pre-2022 human writing.

Why this exists (plain English):
  Half of jamsaq-v2's training data must be 100% AUTHENTIC human text, so the
  model learns real human rhythm — not just what our teacher model imagines
  humans sound like. The trick is to run the pipeline BACKWARDS:

      real human text (written before ChatGPT existed, i.e. pre-2022)
          --(an ordinary chat LLM writes a stiff, robotic "AI draft" of it)-->
      AI draft
          --(we train on the pair: draft -> original human text)-->

  At inference time a customer's stiff AI draft maps straight onto natural
  human phrasing that a real person actually wrote.

IMPORTANT: the human side must be genuine pre-ChatGPT (before late-2022)
writing — public-domain books/essays, your own old blog posts, old forum or
newsletter writing you have the rights to use. Do NOT use ProseFlow customer
text (zero-retention promise!) or anything scraped behind a paywall.

How the AI counterpart is generated:
  Any OpenAI-compatible CHAT endpoint works (this call is allowed to be a chat
  model — it is only producing the "bad" draft, not doing the humanizing):
    1. --provider openai    : OPENAI_API_KEY     (api.openai.com/v1, gpt-4o-mini)
    2. --provider deepseek  : DEEPSEEK_API_KEY   (api.deepseek.com/v1, deepseek-chat)
  or set AIDRAFT_API_KEY / AIDRAFT_BASE_URL / AIDRAFT_MODEL for any other
  OpenAI-compatible provider.

Strict quality gates (a pair is kept only if):
  - length ratio (human target / AI draft) between 0.75 and 1.30
  - at least 80% of 4-word phrases rebuilt (the draft must be a genuine
    robot-voiced rewrite, not a near-copy — identity pairs teach nothing)
  - 100% of quoted material from the human text survives in the draft
  - at least 90% of the human text's numbers survive in the draft
  - ZERO numbers invented by the draft generator
  - no quotes invented by the draft generator

Input formats (--input repeatable; directory subfolder names become style tags:
academic/ blog/ casual/ business/):
  - directory of .txt / .jsonl files
  - a .txt file (whole file = one human text) or a .jsonl file
    (fields: "text"|"source"|"body", optional "style")

Output:
  {"source": <stiff AI draft>, "target": <real human text>, "style": <tag|null>}
  -> --output (default ml/data/human_reverse_pairs.jsonl)
  Rejected pairs land in <output>.rejected.jsonl with reasons.

Examples:
  # No network, no key: validate inputs, show chunk stats + call/cost estimate
  python ml/prepare_human_pairs.py --input ml/samples/human --dry-run

  # Real run with OpenAI writing the stiff drafts
  export OPENAI_API_KEY=<your OpenAI key>
  python ml/prepare_human_pairs.py --input ml/samples/human --provider openai

  # Any other OpenAI-compatible provider
  AIDRAFT_BASE_URL=https://api.deepseek.com/v1 AIDRAFT_API_KEY=... \
  AIDRAFT_MODEL=deepseek-chat python ml/prepare_human_pairs.py --input ml/samples/human
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
from typing import Any

ROOT = pathlib.Path(__file__).resolve().parent.parent

GATES = {
    "min_length_ratio": 0.75,
    "max_length_ratio": 1.30,
    "min_rebuilt_pct": 80.0,
    "min_number_retention": 0.90,
}

VALID_STYLES = ("academic", "blog", "casual", "business")

# Rough tokens-per-word estimate for cost previews only.
TOKENS_PER_WORD = 1.4
PROVIDER_PRICES = {  # USD per 1M in / out tokens — estimates for --dry-run only.
    "openai": (0.15, 0.60),    # gpt-4o-mini
    "deepseek": (0.27, 1.10),   # deepseek-chat
    "custom": (0.0, 0.0),
}

STIFFEN_PROMPT = """\
Rewrite the following text as a generic AI writing assistant would have written \
it: stiff, overly formal, evenly-paced, template-like prose. Rules:
- Keep the SAME facts, claims, numbers, and any quoted material (quotes verbatim).
- Do not add new information, statistics, or quotes.
- Keep roughly the same length (75%%-130%% of the original).
- Sound like a polished, soulless chatbot: smooth transitions, hedged verbs, \
no personal voice, mild corporate blandness.
Output ONLY the rewritten text, no preamble.

TEXT:
{payload}"""


# ---------------------------------------------------------------------------
# .env loading + provider resolution
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
            k, v = k.strip(), v.strip().strip('"').strip("'")
            if k and k not in os.environ:
                os.environ[k] = v


def resolve_provider(provider: str) -> tuple[str, str, str, str]:
    """Return (api_key, base_url, model, provider_label)."""
    key = os.environ.get("AIDRAFT_API_KEY", "").strip()
    base = os.environ.get("AIDRAFT_BASE_URL", "").strip()
    model = os.environ.get("AIDRAFT_MODEL", "").strip()
    if key:
        return key, base or "https://api.openai.com/v1", model or "gpt-4o-mini", "custom"

    provider = provider.lower()
    if provider == "openai":
        key = os.environ.get("OPENAI_API_KEY", "").strip()
        return key, "https://api.openai.com/v1", model or "gpt-4o-mini", "openai"
    if provider == "deepseek":
        key = os.environ.get("DEEPSEEK_API_KEY", "").strip()
        return key, "https://api.deepseek.com/v1", model or "deepseek-chat", "deepseek"
    raise SystemExit(
        f"ERROR: no API key found for provider '{provider}'. Set OPENAI_API_KEY, "
        f"DEEPSEEK_API_KEY, or AIDRAFT_API_KEY (or use --dry-run).")


# ---------------------------------------------------------------------------
# Input loading + chunking (same rules as generate_distill_data.py)
# ---------------------------------------------------------------------------

def _norm_style(s: Any) -> str | None:
    t = str(s or "").strip().lower()
    return t if t in VALID_STYLES else None


def load_jsonl(path: pathlib.Path) -> list[tuple[str, str | None]]:
    out: list[tuple[str, str | None]] = []
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
        out.append((text.strip(), _norm_style(obj.get("style"))))
    return out


def load_input(path: pathlib.Path) -> list[tuple[str, str | None]]:
    if path.is_dir():
        out: list[tuple[str, str | None]] = []
        for p in sorted(path.rglob("*")):
            sub = p.parent.name.lower() if p.parent != path else None
            tag = sub if sub in VALID_STYLES else None
            if p.suffix.lower() == ".jsonl":
                for txt, st in load_jsonl(p):
                    out.append((txt, st or tag))
            elif p.suffix.lower() == ".txt":
                txt = p.read_text(encoding="utf-8", errors="ignore").strip()
                if txt:
                    out.append((txt, tag))
        return out
    if path.suffix.lower() == ".jsonl":
        return load_jsonl(path)
    if path.is_file():
        txt = path.read_text(encoding="utf-8", errors="ignore").strip()
        return [(txt, None)] if txt else []
    raise FileNotFoundError(path)


def is_heading_or_short(para: str) -> bool:
    words = para.split()
    if len(words) <= 12 and not para.endswith((".", "!", "?")):
        return True
    return len(words) <= 6


def split_into_chunks(text: str, target_words: int = 220, max_words: int = 320) -> list[str]:
    """Body-only paragraph-aligned chunks (headings are dropped, not pairs)."""
    chunks: list[str] = []
    buf: list[str] = []
    buf_words = 0

    def flush() -> None:
        nonlocal buf, buf_words
        if buf:
            chunks.append("\n\n".join(buf))
            buf, buf_words = [], 0

    for para in [p.strip() for p in re.split(r"\n\s*\n", text.strip()) if p.strip()]:
        if is_heading_or_short(para):
            continue
        wc = len(para.split())
        if wc > max_words:
            flush()
            cur: list[str] = []
            cur_w = 0
            for s in [s.strip() for s in re.split(r"(?<=[.!?])\s+", para) if s.strip()]:
                sw = len(s.split())
                if cur and cur_w + sw > target_words:
                    chunks.append(" ".join(cur))
                    cur, cur_w = [s], sw
                else:
                    cur.append(s)
                    cur_w += sw
            if cur:
                chunks.append(" ".join(cur))
            continue
        if buf and buf_words + wc > target_words:
            flush()
        buf.append(para)
        buf_words += wc
    flush()
    return chunks


# ---------------------------------------------------------------------------
# Fidelity gates for reverse pairs (source = AI draft, target = human original)
# ---------------------------------------------------------------------------

def _ngrams(text: str, n: int) -> set[tuple[str, ...]]:
    toks = re.findall(r"[a-z]+", text.lower())
    return {tuple(toks[i:i + n]) for i in range(max(0, len(toks) - n + 1))}


def _quotes(text: str) -> list[str]:
    found = re.findall(r'["\u201c]([^"\u201d]{4,120})["\u201d]', text)
    return [q.strip().rstrip(".,;:") for q in found if len(q.split()) >= 2]


def _numbers(text: str) -> set[str]:
    return set(re.findall(r"\b\d+(?:[.,]\d+)?%?\b", text))


def gate_pair(source: str, target: str) -> tuple[list[str], dict[str, Any]]:
    """Check the AI draft (source) faithfully represents the human text (target)."""
    sw, tw = len(source.split()), len(target.split())
    ratio = round(tw / max(sw, 1), 3)
    rebuilt = round((1.0 - len(_ngrams(source, 4) & _ngrams(target, 4)) / max(len(_ngrams(source, 4)), 1)) * 100.0, 1)

    t_quotes = _quotes(target)
    s_lower = source.lower()
    dropped_q = [q for q in t_quotes if q.lower() not in s_lower]
    invented_q = [q for q in _quotes(source) if q.lower() not in target.lower()]

    t_nums, s_nums = _numbers(target), _numbers(source)
    missing_n = sorted(t_nums - s_nums)
    added_n = sorted(s_nums - t_nums)
    retention = len(t_nums & s_nums) / len(t_nums) if t_nums else 1.0

    reasons: list[str] = []
    if not (GATES["min_length_ratio"] <= ratio <= GATES["max_length_ratio"]):
        reasons.append(f"length ratio target/source {ratio} outside [0.75, 1.30]")
    if rebuilt < GATES["min_rebuilt_pct"]:
        reasons.append(f"only {rebuilt}% of 4-word phrases rebuilt (draft too close to original)")
    if dropped_q:
        reasons.append(f"draft dropped quote: {dropped_q[0][:60]!r}")
    if invented_q:
        reasons.append(f"draft invented quote: {invented_q[0][:60]!r}")
    if retention < GATES["min_number_retention"]:
        reasons.append(f"number retention {retention:.0%} < 90% (missing: {', '.join(missing_n[:5])})")
    if added_n:
        reasons.append(f"draft invented number(s): {', '.join(added_n[:5])}")

    report = {"source_words": sw, "target_words": tw, "length_ratio": ratio,
              "phrases_rebuilt_pct": rebuilt, "quotes_total": len(t_quotes),
              "quotes_kept": len(t_quotes) - len(dropped_q),
              "numbers_total": len(t_nums), "numbers_kept": len(t_nums & s_nums),
              "added_numbers": added_n, "missing_numbers": missing_n}
    return reasons, report


# ---------------------------------------------------------------------------
# The AI-draft generator (OpenAI-compatible chat call)
# ---------------------------------------------------------------------------

def make_ai_draft(human_text: str, *, api_key: str, base_url: str, model: str,
                  temperature: float = 0.7) -> str:
    url = f"{base_url.rstrip('/')}/chat/completions"
    body = {
        "model": model,
        "temperature": temperature,
        "max_tokens": max(256, min(2048, int(len(human_text.split()) * 3))),
        "messages": [{"role": "user", "content": STIFFEN_PROMPT.format(payload=human_text)}],
    }
    req = urllib.request.Request(
        url, data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"},
        method="POST")
    try:
        with urllib.request.urlopen(req, timeout=300) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"draft-generator HTTP {e.code}: {detail}") from e
    draft = (data["choices"][0]["message"]["content"] or "").strip()
    # Strip common "Here is the rewritten text:" preambles.
    draft = re.sub(r"^(here( is|'s)[^\n]*:\s*)\n?", "", draft, flags=re.IGNORECASE)
    return draft.strip()


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> int:
    load_env_files()
    ap = argparse.ArgumentParser(
        description="Build reverse pairs (stiff AI draft -> real pre-2022 human text).",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="See ml/README.md for the full walkthrough.")
    ap.add_argument("--input", action="append", type=pathlib.Path, default=None,
                    help="Human texts: .jsonl, .txt, or directory (repeatable; "
                         "default: ml/samples/human/)")
    ap.add_argument("--output", type=pathlib.Path,
                    default=pathlib.Path("ml/data/human_reverse_pairs.jsonl"),
                    help="Output pairs JSONL (default: %(default)s)")
    ap.add_argument("--style", default=None, choices=VALID_STYLES,
                    help="Fallback style tag for inputs without one")
    ap.add_argument("--provider", default="openai", choices=["openai", "deepseek"],
                    help="Which chat provider writes the stiff drafts when "
                         "AIDRAFT_* env vars are unset (default: %(default)s)")
    ap.add_argument("--workers", type=int, default=6,
                    help="Parallel draft-generation calls (default: 6)")
    ap.add_argument("--limit", type=int, default=None,
                    help="Stop after N accepted pairs (cheap smoke runs)")
    ap.add_argument("--min-chunk-words", type=int, default=120,
                    help="Ignore body chunks shorter than this")
    ap.add_argument("--dry-run", action="store_true",
                    help="Validate inputs and print the plan + cost estimate; no network, no key needed")
    args = ap.parse_args()

    # ---- Resolve inputs ----------------------------------------------------
    input_paths = list(args.input) if args.input else []
    if not input_paths:
        default_dir = ROOT / "ml/samples/human"
        if default_dir.exists():
            input_paths.append(default_dir)
    if not input_paths:
        print("No --input given and ml/samples/human/ does not exist.")
        print("Create it first: put genuine pre-2022 human .txt files there, e.g.")
        print("  ml/samples/human/blog/old_blog_post_2019.txt")
        print("  ml/samples/human/academic/old_essay_2016.txt")
        print("(this message is expected on a fresh checkout; re-run with --input <path>)")
        return 0

    texts: list[tuple[str, str | None]] = []
    for p in input_paths:
        try:
            texts.extend(load_input(p))
        except (FileNotFoundError, ValueError) as e:
            print(f"ERROR: {e}", file=sys.stderr)
            return 2
    if args.style:
        texts = [(t, s or args.style) for t, s in texts]

    # ---- Chunk the human texts ----------------------------------------------
    jobs: list[tuple[str, str | None]] = []
    for text, style in texts:
        for ch in split_into_chunks(text):
            if len(ch.split()) >= args.min_chunk_words:
                jobs.append((ch, style))

    total_words = sum(len(c.split()) for c, _ in jobs)
    style_counts: dict[str, int] = {}
    for _, s in jobs:
        style_counts[s or "(none)"] = style_counts.get(s or "(none)", 0) + 1

    print(f"Loaded {len(texts)} human text(s) -> {len(jobs)} usable chunk(s) "
          f"({total_words:,} words)")
    print(f"Style tags: {json.dumps(style_counts, sort_keys=True)}")

    if args.dry_run:
        try:
            _, base_url, model, label = resolve_provider(args.provider)
            price_in, price_out = PROVIDER_PRICES.get(label, (0.0, 0.0))
        except SystemExit as e:
            print(f"(provider not configured yet: {e})")
            base_url, model, label, price_in, price_out = "?", "?", "?", 0.0, 0.0
        in_tok = int(total_words * (TOKENS_PER_WORD + 1.2))  # text + stiffen prompt
        out_tok = int(total_words * TOKENS_PER_WORD)
        cost = in_tok / 1e6 * price_in + out_tok / 1e6 * price_out
        print(f"Draft generator: {label} ({model} @ {base_url}) | workers={args.workers}")
        print(f"Chat API calls: {len(jobs)} | est. tokens in={in_tok:,} out={out_tok:,}"
              + (f" | est. cost ~${cost:.2f}" if price_in else ""))
        print("\nDRY RUN — nothing was sent. Plan above is what would happen.")
        if not jobs:
            print("No usable body chunks found (all inputs too short/heading-like).")
        return 0

    # ---- Real run ------------------------------------------------------------
    api_key, base_url, model, label = resolve_provider(args.provider)
    print(f"Draft generator: {label} ({model} @ {base_url}) | workers={args.workers}")

    args.output.parent.mkdir(parents=True, exist_ok=True)
    rejected_path = args.output.with_suffix(args.output.suffix + ".rejected.jsonl")

    accepted: list[dict[str, Any]] = []
    rejected: list[dict[str, Any]] = []
    t0 = time.time()
    done = 0

    def run_job(job: tuple[str, str | None]) -> dict[str, Any]:
        human_text, style = job
        draft = make_ai_draft(human_text, api_key=api_key, base_url=base_url, model=model)
        reasons, report = gate_pair(draft, human_text)
        return {"source": draft, "target": human_text, "style": style,
                "reasons": reasons, "report": report}

    with ThreadPoolExecutor(max_workers=max(1, args.workers)) as pool:
        futures = {pool.submit(run_job, j): j for j in jobs}
        for fut in as_completed(futures):
            res = fut.result()
            done += 1
            if res["reasons"]:
                rejected.append(res)
                print(f"[{done}/{len(jobs)}] REJECT: {'; '.join(res['reasons'])}", flush=True)
            else:
                accepted.append({"source": res["source"], "target": res["target"],
                                 "style": res["style"]})
                print(f"[{done}/{len(jobs)}] ACCEPT "
                      f"({res['report']['source_words']}w draft -> {res['report']['target_words']}w human, "
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

    print(f"\nDone in {time.time() - t0:.0f}s: {len(accepted)} accepted pairs -> {args.output}")
    print(f"{len(rejected)} rejected pairs -> {rejected_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
