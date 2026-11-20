import { describe, expect, it } from "vitest";
import { computeFidelityReport, extractQuotes, extractNumbers } from "@/lib/fidelity";

describe("fidelity shield", () => {
  it("reports 0% rebuilt for identical text and warns", () => {
    const text = "the quick brown fox jumps over the lazy dog again and again here";
    const r = computeFidelityReport(text, text);
    expect(r.phrases_rebuilt_pct).toBe(0);
    expect(r.warnings.some((w) => w.includes("Only 0%"))).toBe(true);
  });

  it("reports ~100% rebuilt for completely different text", () => {
    const r = computeFidelityReport(
      "the quick brown fox jumps over the lazy dog under the bright morning sun",
      "entirely different words populate this sentence with no overlap at all whatsoever",
    );
    expect(r.phrases_rebuilt_pct).toBeGreaterThan(80);
  });

  it("extracts quotes with straight and curly quotation marks", () => {
    const q = extractQuotes('She said "hello there friend" loudly. He wrote \u201Cgood morning team\u201D.');
    expect(q).toContain("hello there friend");
    expect(q).toContain("good morning team");
    expect(q.length).toBe(2);
  });

  it("tracks quote retention", () => {
    const original = 'The sign read "Smash Patriarchy Now" and people noticed.';
    const kept = 'The sign said "Smash Patriarchy Now" and everyone noticed it.';
    const dropped = 'Nobody remembers what the sign said at all that day.';
    expect(computeFidelityReport(original, kept).quotes_kept).toBe(1);
    expect(computeFidelityReport(original, dropped).quotes_kept).toBe(0);
    const r = computeFidelityReport(original, dropped);
    expect(r.warnings.some((w) => w.includes("Quote changed/missing"))).toBe(true);
  });

  it("extracts numbers including decimals", () => {
    const nums = extractNumbers("Revenue grew 42% to $3.14 million, up from 2.5 million.");
    // NOTE: identical to engine.py's regex — the trailing \b makes "42%"
    // backtrack to "42".
    expect([...nums]).toEqual(expect.arrayContaining(["42", "3.14", "2.5"]));
    expect([...nums]).toHaveLength(3);
  });

  it("tracks number retention and flags invented numbers", () => {
    const original = "The project took 12 weeks and cost 50000 dollars.";
    const kept = "It needed 12 weeks and a budget of 50000 dollars.";
    const rKept = computeFidelityReport(original, kept);
    expect(rKept.numbers_kept).toBe(2);
    expect(rKept.warnings.length).toBe(0);

    const drifted = "The project took 13 weeks and cost 60000 dollars.";
    const rDrift = computeFidelityReport(original, drifted);
    expect(rDrift.numbers_kept).toBe(0);
    expect(rDrift.missing_numbers).toContain("12");
    expect(rDrift.warnings.some((w) => w.includes("Numbers dropped"))).toBe(true);
  });

  it("flags invented numbers even when originals are kept", () => {
    const r = computeFidelityReport(
      "We served 100 customers.",
      "We served 100 customers and hired 9 people.",
    );
    expect(r.added_numbers).toContain("9");
    expect(r.warnings.some((w) => w.includes("New numbers appeared"))).toBe(true);
  });

  it("computes length ratio", () => {
    const r = computeFidelityReport("one two three four", "one two three four five six");
    expect(r.length_ratio).toBe(1.5);
    expect(r.original_words).toBe(4);
    expect(r.rewritten_words).toBe(6);
  });
});
