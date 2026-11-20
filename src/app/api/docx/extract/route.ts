/**
 * POST /api/docx/extract — multipart .docx upload → structured blocks.
 * Starter plan and above. The file is parsed in memory and never stored.
 */
import { NextResponse } from "next/server";
import { requireAuth, authErrorResponse } from "@/lib/api-helpers";
import { extractDocx, blocksToText, type DocxBlock } from "@/lib/docx-utils";
import { countWords } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_DOCX_BYTES = 8 * 1024 * 1024;

export async function POST(request: Request) {
  const ctx = requireAuth(request);
  if (!ctx) return authErrorResponse();

  if (!ctx.plan.docxSupport) {
    return NextResponse.json(
      { error: "plan_limit", error_message: "Word (.docx) upload is available on Starter and above." },
      { status: 403 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "invalid_form", error_message: "Send the file as multipart/form-data." },
      { status: 400 },
    );
  }
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "missing_file", error_message: "Attach a .docx file in the 'file' field." },
      { status: 400 },
    );
  }
  if (!file.name.toLowerCase().endsWith(".docx")) {
    return NextResponse.json(
      { error: "bad_extension", error_message: "Only .docx files are supported." },
      { status: 400 },
    );
  }
  if (file.size > MAX_DOCX_BYTES) {
    return NextResponse.json(
      { error: "too_large", error_message: "Files up to 8 MB are supported." },
      { status: 413 },
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());
  try {
    const blocks: DocxBlock[] = await extractDocx(buf);
    const words = countWords(blocksToText(blocks));
    if (words > ctx.plan.maxWordsPerRequest) {
      return NextResponse.json(
        {
          error: "too_many_words",
          error_message: `This document has ${words.toLocaleString()} words; your plan allows up to ${ctx.plan.maxWordsPerRequest.toLocaleString()} per request.`,
        },
        { status: 413 },
      );
    }
    return NextResponse.json(
      { blocks, words },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    return NextResponse.json(
      {
        error: "docx_parse_failed",
        error_message: err instanceof Error ? err.message : "Could not read this .docx file.",
      },
      { status: 422 },
    );
  }
}
