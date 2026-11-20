/**
 * .docx paragraph/heading extraction & formatted .docx export.
 *
 * Extraction mirrors reference/engine.py: walk word/document.xml paragraphs,
 * join runs, and detect heading styles. Export rebuilds a clean Word document
 * with real Heading 1/2/3 styles so structure survives the round-trip.
 */
import JSZip from "jszip";
import { XMLParser } from "fast-xml-parser";
import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
} from "docx";

export interface DocxBlock {
  type: "heading" | "paragraph";
  level?: number; // heading level 1-3
  text: string;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  removeNSPrefix: true,
  isArray: (name: string) => name === "p" || name === "t" || name === "br" || name === "r",
});

function textOfP(p: unknown): string {
  if (p === null || typeof p !== "object") return "";
  const node = p as Record<string, unknown>;
  const parts: string[] = [];
  const walk = (n: unknown): void => {
    if (n === null || n === undefined) return;
    if (Array.isArray(n)) {
      n.forEach(walk);
      return;
    }
    if (typeof n === "object") {
      const o = n as Record<string, unknown>;
      if ("#text" in o) walk(o["#text"]);
      // Don't descend into nested properties, tables, or sectPr — only runs.
      for (const key of ["r", "t", "hyperlink", "br"]) {
        if (key in o) walk(o[key]);
      }
      return;
    }
    if (typeof n === "string") parts.push(n);
  };
  walk(node.r);
  walk(node["#text"]);
  return parts.join("").replace(/\s+/g, " ").trim();
}

function headingLevelOf(p: unknown): number | null {
  if (p === null || typeof p !== "object") return null;
  const pPr = (p as Record<string, unknown>).pPr;
  if (!pPr || typeof pPr !== "object") return null;
  let style: unknown = (pPr as Record<string, unknown>).pStyle;
  if (style && typeof style === "object") {
    style = (style as Record<string, unknown>)["@_val"] ?? (style as Record<string, unknown>)["#text"];
  }
  if (typeof style !== "string") return null;
  const m = style.match(/^(?:Heading|heading|Head)(\d)$/);
  if (m) return Math.min(3, Math.max(1, Number(m[1])));
  if (/^(Title|titre)$/i.test(style)) return 1;
  return null;
}

export async function extractDocx(buffer: Buffer | Uint8Array): Promise<DocxBlock[]> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(buffer);
  } catch {
    throw new Error("Not a valid .docx file (corrupted, or not a Word document).");
  }
  const entry = zip.file("word/document.xml");
  if (!entry) throw new Error("Not a valid .docx file (missing word/document.xml).");
  const xml = await entry.async("string");
  const doc = parser.parse(xml);
  const body = doc?.document?.body;
  if (!body) throw new Error("Not a valid .docx file (no document body).");
  const paras: unknown[] = Array.isArray(body.p) ? body.p : [body.p].filter(Boolean);

  const blocks: DocxBlock[] = [];
  for (const p of paras) {
    const text = textOfP(p);
    if (!text) continue;
    const level = headingLevelOf(p);
    blocks.push(level ? { type: "heading", level, text } : { type: "paragraph", text });
  }
  if (blocks.length === 0) throw new Error("The .docx file contains no readable text.");
  return blocks;
}

export function blocksToText(blocks: DocxBlock[]): string {
  return blocks
    .map((b) => b.text)
    .join("\n\n")
    .trim();
}

const HEADING_MAP: Record<number, (typeof HeadingLevel)[keyof typeof HeadingLevel]> = {
  1: HeadingLevel.HEADING_1,
  2: HeadingLevel.HEADING_2,
  3: HeadingLevel.HEADING_3,
};

export async function buildDocx(blocks: DocxBlock[], title?: string): Promise<Buffer> {
  const children: Paragraph[] = [];
  if (title) {
    children.push(
      new Paragraph({
        text: title,
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
      }),
    );
  }
  for (const b of blocks) {
    if (b.type === "heading" && b.level && HEADING_MAP[b.level]) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: b.text, bold: true })],
          heading: HEADING_MAP[b.level],
        }),
      );
    } else {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: b.text })],
          spacing: { after: 200, line: 360 },
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
    }
  }
  const doc = new Document({
    creator: "ProseFlow",
    description: "Exported with ProseFlow",
    sections: [{ properties: {}, children }],
  });
  const buf = await Packer.toBuffer(doc);
  return Buffer.from(buf);
}
