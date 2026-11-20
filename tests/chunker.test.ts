import { describe, expect, it } from "vitest";
import { splitIntoChunks, isHeadingOrShort, buildHipPrompt, cleanHipOutput } from "@/lib/hip-engine";

describe("chunker", () => {
  it("passes short standalone lines through untouched", () => {
    const text = "Introduction\n\n" + "A".repeat(0) + "This is a long body paragraph that certainly exceeds the twelve word threshold limit for headings." + "\n\nConclusion";
    const chunks = splitIntoChunks(text);
    const first = chunks[0];
    const last = chunks[chunks.length - 1];
    expect(first.passthrough).toBe(true);
    expect(first.text).toBe("Introduction");
    expect(last.passthrough).toBe(true);
    expect(last.text).toBe("Conclusion");
  });

  it("keeps headings that are <= 12 words without ending punctuation", () => {
    expect(isHeadingOrShort("The State of Modern Remote Work Culture")).toBe(true);
    // 12 words, no terminal punctuation → heading
    expect(isHeadingOrShort("one two three four five six seven eight nine ten eleven twelve")).toBe(true);
    // 13 words ending with a period → body text
    expect(isHeadingOrShort("This line has thirteen words in it and it ends with a period.")).toBe(false);
  });

  it("treats <= 6 word lines as headings even with punctuation", () => {
    expect(isHeadingOrShort("Done.")).toBe(true);
    expect(isHeadingOrShort("Chapter three starts here.")).toBe(true); // 4 words
  });

  it("groups adjacent short body paragraphs up to the target size", () => {
    const para = (n: number) => `Paragraph ${n} ` + "word ".repeat(80);
    const text = [para(1), para(2), para(3), para(4), para(5), para(6)].join("\n\n");
    const chunks = splitIntoChunks(text, 220, 320);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((c) => !c.passthrough)).toBe(true);
    for (const c of chunks) {
      expect(c.text.split(/\s+/).length).toBeLessThanOrEqual(320 + 80); // one paragraph overflow tolerated
    }
    // no paragraph lost or duplicated
    const joined = chunks.map((c) => c.text).join("\n\n");
    expect(joined).toContain("Paragraph 1");
    expect(joined).toContain("Paragraph 6");
  });

  it("splits a mega-paragraph at sentence boundaries", () => {
    const sentence = "This sentence has exactly ten words in it always.";
    const mega = Array.from({ length: 60 }, (_, i) => `(${i}) ${sentence}`).join(" ");
    const words = mega.split(/\s+/).length;
    expect(words).toBeGreaterThan(320);
    const chunks = splitIntoChunks(mega, 150, 320);
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) {
      expect(c.text.split(/\s+/).length).toBeLessThanOrEqual(320);
      expect(c.text).toMatch(/[.!?]$/); // chunks end cleanly at sentence boundaries
    }
    const reassembled = chunks.map((c) => c.text).join(" ");
    // no sentence content lost (modulo joining whitespace)
    expect(reassembled.replace(/\s+/g, " ")).toContain("This sentence has exactly ten words in it always.");
    expect(reassembled).toContain("(59)");
  });

  it("preserves chunk order and indices", () => {
    const text = "H1 Heading\n\n" + "Body one with plenty of words. ".repeat(30) + "\n\nH2 Subheading\n\n" + "Body two with plenty of words. ".repeat(30);
    const chunks = splitIntoChunks(text);
    chunks.forEach((c, i) => expect(c.index).toBe(i));
    const headingIdx = chunks.findIndex((c) => c.text === "H1 Heading");
    expect(headingIdx).toBe(0);
    expect(chunks[2].text).toBe("H2 Subheading");
  });
});

describe("hip prompt format", () => {
  it("wraps source text in the exact HIP tags", () => {
    const prompt = buildHipPrompt("hello world");
    expect(prompt).toBe("<source_text>\nhello world\n</source_text>\n\n<target_text>\n");
  });

  it("cleans model echoes and stop-tag bleed", () => {
    expect(cleanHipOutput("<target_text>\nGood text here.")).toBe("Good text here.");
    expect(cleanHipOutput("Nice output.</target_text>\n<source_text>\nbleed")).toBe("Nice output.");
    expect(cleanHipOutput("   \n")).toBe("");
  });
});
