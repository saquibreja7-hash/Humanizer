import { describe, expect, it } from "vitest";
import { buildDocx, extractDocx, blocksToText } from "@/lib/docx-utils";

const BLOCKS = [
  { type: "heading" as const, level: 1, text: "Annual Impact Report" },
  { type: "paragraph" as const, text: "This year the team grew considerably and shipped several major projects." },
  { type: "heading" as const, level: 2, text: "Results" },
  { type: "paragraph" as const, text: "Revenue rose 42 percent while customer satisfaction stayed high across every region we operate in." },
  { type: "heading" as const, level: 3, text: "Next Steps" },
  { type: "paragraph" as const, text: "We plan to expand into two new markets and double the engineering team next year." },
];

describe(".docx round-trip", () => {
  it("builds a .docx and extracts the same structure back out", async () => {
    const buffer = await buildDocx(BLOCKS);
    expect(buffer.length).toBeGreaterThan(2000);
    expect(
      buffer.subarray(0, 2).equals(Buffer.from([0x50, 0x4b])), // "PK" zip magic
    ).toBe(true);

    const extracted = await extractDocx(buffer);
    expect(extracted).toHaveLength(BLOCKS.length);
    for (let i = 0; i < BLOCKS.length; i++) {
      expect(extracted[i].type).toBe(BLOCKS[i].type);
      if (BLOCKS[i].type === "heading") {
        expect(extracted[i].level).toBe(BLOCKS[i].level);
      }
      expect(extracted[i].text).toBe(BLOCKS[i].text);
    }
  });

  it("keeps text content intact through blocksToText", async () => {
    const buffer = await buildDocx(BLOCKS);
    const extracted = await extractDocx(buffer);
    const text = blocksToText(extracted);
    expect(text).toContain("Annual Impact Report");
    expect(text).toContain("Revenue rose 42 percent");
    expect(text).toContain("double the engineering team next year.");
  });

  it("rejects non-docx buffers with a clear error", async () => {
    await expect(extractDocx(Buffer.from("this is not a zip file at all"))).rejects.toThrow(
      /Not a valid \.docx/,
    );
  });

  it("renders an optional centered title", async () => {
    const buffer = await buildDocx(BLOCKS.slice(1), "ProseFlow Export");
    const extracted = await extractDocx(buffer);
    expect(extracted[0].text).toBe("ProseFlow Export");
    expect(extracted[0].type).toBe("heading");
  });
});
