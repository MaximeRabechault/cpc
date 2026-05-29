// ─────────────────────────────────────────────────────────────
// /api/export — Google Sheets Connector v2.0
// Writes to all 7 tabs of CPC_Template_v2.xlsx
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { buildAllWrites } from "@/lib/sheets-mapper";
import type { AnalyzeResponse } from "@/lib/types";

const SHEET_ID = process.env.GOOGLE_SHEET_ID ?? "";

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); }
  catch { return err(400, "INVALID_INPUT", "Body must be valid JSON"); }

  if (typeof body !== "object" || body === null || !(body as Record<string, unknown>).result) {
    return err(400, "INVALID_INPUT", "Expected AnalyzeResponse with result field");
  }

  const response = body as AnalyzeResponse;

  const sheetsConfigured =
    SHEET_ID && SHEET_ID !== "placeholder" &&
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON &&
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON !== "placeholder";

  if (!sheetsConfigured) {
    return NextResponse.json({
      ok: true,
      session_id: response.session_id,
      mode: "simulated",
      tabs_written: ["Saisie","Synthèse","Épistémique","Dynamiques","Fragilité","Simulation T+3"],
      ranges_written: 0,
      message: "Google Sheets non configuré — export simulé pour le prototype",
      timestamp: new Date().toISOString(),
    });
  }

  let writes: ReturnType<typeof buildAllWrites>;
  try { writes = buildAllWrites(response); }
  catch (e: unknown) {
    return err(500, "MAPPER_ERROR", e instanceof Error ? e.message : "Mapper error");
  }

  let google: typeof import("googleapis").google;
  try { const mod = await import("googleapis"); google = mod.google; }
  catch { return err(500, "DEPENDENCY_ERROR", "googleapis non disponible"); }

  let credentials: object;
  try { credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!); }
  catch { return err(500, "AUTH_ERROR", "GOOGLE_SERVICE_ACCOUNT_JSON invalide"); }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  let totalWritten = 0;

  try {
    for (let i = 0; i < writes.length; i += 50) {
      const batch = writes.slice(i, i + 50);
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: { valueInputOption: "USER_ENTERED", data: batch },
      });
      totalWritten += batch.length;
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Sheets write failed";
    console.error("[CPC] Sheets error:", msg);
    return err(502, "SHEETS_ERROR", msg);
  }

  return NextResponse.json({
    ok: true,
    session_id: response.session_id,
    mode: "live",
    tabs_written: ["Saisie","Synthèse","Épistémique","Dynamiques","Fragilité","Simulation T+3"],
    ranges_written: totalWritten,
    timestamp: new Date().toISOString(),
  });
}

function err(status: number, code: string, message: string) {
  return NextResponse.json({ ok: false, error: message, code }, { status });
}
