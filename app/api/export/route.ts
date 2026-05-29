import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    session_id: "demo",
    mode: "simulated",
    tabs_written: ["Saisie", "Synthèse"],
    timestamp: new Date().toISOString(),
  });
}