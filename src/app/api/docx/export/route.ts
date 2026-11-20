/**
 * POST /api/docx/export — rewritten blocks → styled .docx download.
 * Headings are preserved as real Word heading styles. Starter plan and above.
 */
import { NextResponse } from "next/server";
import { requireAuth, authErrorResponse } from "@/lib/api-helpers";
import { buildDocx, type DocxBlock } from "@/lib/docx-utils";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const ctx = requireAuth(request);
  if (!ctx) return authErrorResponse();

  if (!ctx.plan.docxSupport) {
    return NextResponse.json(
      { error: "plan_limit", error_message: "Word (.docx) export is available on Starter and above." },
      { status: 403 },
    );
  }

  let body: { blocks?: DocxBlock[]; text?: string; title?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { error: "invalid_json", error_message: "Invalid JSON body." },
      { status: 400 },
    );
  }

  let blocks: DocxBlock[];
  if (Array.isArray(body.blocks) && body.blocks.length > 0) {
    blocks = body.blocks
      .filter(
        (b) =>
          b &&
          typeof b.text === "string" &&
          (b.type === "heading" ? typeof b.level === "number" : b.type === "paragraph"),
      )
      .map((b): DocxBlock => ({
        type: b.type === "heading" ? "heading" : "paragraph",
        level: b.type === "heading" ? Math.min(3, Math.max(1, Number(b.level) || 1)) : undefined,
        text: String(b.text).trim(),
      }))
      .filter((b) => b.text.length > 0);
  } else if (typeof body.text === "string" && body.text.trim()) {
    // Plain text: split on blank lines; first short line becomes the title.
    blocks = body.text
      .trim()
      .split(/\n\s*\n+/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => ({ type: "paragraph" as const, text: p }));
  } else {
    return NextResponse.json(
      { error: "empty_input", error_message: "Provide 'blocks' or 'text' to export." },
      { status: 400 },
    );
  }

  if (blocks.length === 0) {
    return NextResponse.json(
      { error: "empty_input", error_message: "Nothing to export." },
      { status: 400 },
    );
  }

  try {
    const buffer = await buildDocx(blocks, body.title?.trim() || undefined);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": 'attachment; filename="proseflow-export.docx"',
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "docx_build_failed",
        error_message: err instanceof Error ? err.message : "Could not build the .docx file.",
      },
      { status: 500 },
    );
  }
}
