import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { checkModelHealth } from "@/lib/hip-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();
  let dbOk = false;
  try {
    getDb().prepare("SELECT 1").get();
    dbOk = true;
  } catch {
    dbOk = false;
  }
  const model = await checkModelHealth();
  return NextResponse.json(
    {
      status: dbOk ? "ok" : "degraded",
      service: "proseflow",
      db: dbOk,
      model: {
        reachable: model.ok,
        detail: model.detail,
      },
      elapsed_ms: Date.now() - started,
      time: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
