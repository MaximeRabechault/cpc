import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  return NextResponse.json({
    ok: true,
    session_id: "test",
    rows_written: 0,
    tabs_updated: ["Saisie", "Synthese"],
    mode: "simulated",
    timestamp: new Date().toISOString(),
  });
}