/**
 * Fidelity Shield — 4-gram rebuild %, quote retention, number retention,
 * and drift warnings. Direct port of the proven checks from
 * reference/engine.py.
 */

export interface FidelityReport {
  original_words: number;
  rewritten_words: number;
  length_ratio: number;
  phrases_rebuilt_pct: number;
  quotes_total: number;
  quotes_kept: number;
  missing_quotes: string[];
  numbers_total: number;
  numbers_kept: number;
  missing_numbers: string[];
  added_numbers: string[];
  warnings: string[];
}

function ngrams(text: string, n: number): Set<string> {
  const toks = text.toLowerCase().match(/[a-z]+/g) ?? [];
  const set = new Set<string>();
  for (let i = 0; i + n <= toks.length; i++) {
    set.add(toks.slice(i, i + n).join(" "));
  }
  return set;
}

export function extractQuotes(text: string): string[] {
  const found = text.match(/["\u201c]([^"\u201d]{4,120})["\u201d]/g) ?? [];
  return found
    .map((q) => q.replace(/^["\u201c]|["\u201d]$/g, "").trim().replace(/[.,;:]$/, ""))
    .filter((q) => q.split(/\s+/).length >= 2);
}

export function extractNumbers(text: string): Set<string> {
  return new Set(text.match(/\b\d+(?:[.,]\d+)?%?\b/g) ?? []);
}

export function computeFidelityReport(original: string, rewritten: string): FidelityReport {
  const orig4 = ngrams(original, 4);
  const rew4 = ngrams(rewritten, 4);
  const kept4 = [...orig4].filter((g) => rew4.has(g)).length;
  const rebuilt4Pct = Math.round((1 - kept4 / Math.max(orig4.size, 1)) * 1000) / 10;

  const origWords = original.split(/\s+/).filter(Boolean).length;
  const rewWords = rewritten.split(/\s+/).filter(Boolean).length;

  const origQuotes = extractQuotes(original);
  const rewLower = rewritten.toLowerCase();
  const missingQuotes = origQuotes.filter((q) => !rewLower.includes(q.toLowerCase()));

  const origNums = extractNumbers(original);
  const rewNums = extractNumbers(rewritten);
  const missingNums = [...origNums].filter((n) => !rewNums.has(n)).sort();
  const addedNums = [...rewNums].filter((n) => !origNums.has(n)).sort();

  const warnings: string[] = [];
  if (missingQuotes.length > 0) {
    warnings.push(`Quote changed/missing: ${missingQuotes.slice(0, 3).join(", ")}`);
  }
  if (missingNums.length > 0) {
    warnings.push(`Numbers dropped: ${missingNums.slice(0, 5).join(", ")}`);
  }
  if (addedNums.length > 0) {
    warnings.push(`New numbers appeared (check for drift): ${addedNums.slice(0, 5).join(", ")}`);
  }
  if (rebuilt4Pct < 70.0) {
    warnings.push(`Only ${rebuilt4Pct}% of 4-word phrases rebuilt (try more rounds).`);
  }

  return {
    original_words: origWords,
    rewritten_words: rewWords,
    length_ratio: Math.round((rewWords / Math.max(origWords, 1)) * 100) / 100,
    phrases_rebuilt_pct: rebuilt4Pct,
    quotes_total: origQuotes.length,
    quotes_kept: origQuotes.length - missingQuotes.length,
    missing_quotes: missingQuotes,
    numbers_total: origNums.size,
    numbers_kept: origNums.size - missingNums.length,
    missing_numbers: missingNums,
    added_numbers: addedNums,
    warnings,
  };
}
