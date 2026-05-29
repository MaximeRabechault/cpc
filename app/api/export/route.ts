// ─────────────────────────────────────────────────────────────
// /api/export — Google Sheets Connector
// Dégrade proprement si les credentials ne sont pas configurés
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { buildSheetsPayload } from "@/lib/sheets-mapper";
import type { AnalyzeResponse, SheetsExportPayload } from "@/lib/types";

const SHEET_ID = process.env.GOOGLE_SHEET_ID ?? "";
const SAISIE_START = 25;
const SYNTHESE_START = 6;
const MAX_ROWS = 10;

export async function POST(req: NextRequest) {
  // 1. Parse body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return err(400, "INVALID_INPUT", "Body must be valid JSON");
  }

  // 2. Normalize payload
  let payload: SheetsExportPayload;
  try {
    payload = normalizePayload(body);
  } catch (e) {
    return err(400, "INVALID_INPUT", e instanceof Error ? e.message : "Invalid payload");
  }

  // 3. Check credentials — si pas configurés, retour succès sans écriture
  const sheetsConfigured =
    SHEET_ID &&
    SHEET_ID !== "placeholder" &&
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON &&
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON !== "placeholder";

  if (!sheetsConfigured) {
    // Mode prototype : export simulé
    return NextResponse.json({
      ok: true,
      session_id: payload.session_id,
      rows_written: payload.rows.length,
      tabs_updated: ["Saisie", "Synthese"],
      mode: "simulated",
      message: "Google Sheets non configuré — export simulé pour le prototype",
      timestamp: new Date().toISOString(),
    });
  }

  // 4. Import googleapis dynamiquement (évite l'erreur si non installé)
  let google: typeof import("googleapis").google;
  try {
    const mod = await import("googleapis");
    google = mod.google;
  } catch {
    return err(500, "DEPENDENCY_ERROR", "googleapis non disponible");
  }

  // 5. Auth
  let credentials: object;
  try {
    credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!);
  } catch {
    return err(500, "AUTH_ERROR", "GOOGLE_SERVICE_ACCOUNT_JSON invalide");
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  // 6. Write to Sheets
  try {
    const sheets = google.sheets({ version: "v4", auth });
    const writes = buildSheetWrites(payload);

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        valueInputOption: "USER_ENTERED",
        data: writes,
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Sheets write failed";
    console.error("[CPC] Sheets error:", msg);
    return err(502, "SHEETS_ERROR", msg);
  }

  return NextResponse.json({
    ok: true,
    session_id: payload.session_id,
    rows_written: payload.rows.length,
    tabs_updated: ["Saisie", "Synthese"],
    mode: "live",
    timestamp: new Date().toISOString(),
  });
}

// ── Payload normalization ─────────────────────────────────────

function normalizePayload(body: unknown): SheetsExportPayload {
  if (typeof body !== "object" || body === null) {
    throw new Error("Body must be an object");
  }
  const b = body as Record<string, unknown>;

  if (b.ok === true && b.result) {
    return buildSheetsPayload(body as AnalyzeResponse);
  }
  if (b.session_id && Array.isArray(b.rows)) {
    return b as unknown as SheetsExportPayload;
  }
  throw new Error("Format de payload non reconnu");
}

// ── Sheet writes ──────────────────────────────────────────────

function buildSheetWrites(payload: SheetsExportPayload) {
  const rows = payload.rows.slice(0, MAX_ROWS);

  const saisieValues: (string | number | null)[][] = Array.from(
    { length: MAX_ROWS }, () => [null, null, null, null]
  );
  rows.forEach((row, i) => {
    saisieValues[i] = [row.bias_detected, row.probability, row.impact, row.risk_score];
  });

  const syntheseValues: (string | number | null)[][] = Array.from(
    { length: MAX_ROWS }, () => [null, null, null, null]
  );
  rows.forEach((row, i) => {
    syntheseValues[i] = [row.cause_echec, row.bias_detected, row.probability, row.impact];
  });

  return [
    {
      range: `Saisie!B${SAISIE_START}:E${SAISIE_START + MAX_ROWS - 1}`,
      values: saisieValues,
    },
    {
      range: "Saisie!B20",
      values: [[payload.decision]],
    },
    {
      range: `Synthese!C${SYNTHESE_START}:F${SYNTHESE_START + MAX_ROWS - 1}`,
      values: syntheseValues,
    },
    {
      range: "Synthese!B2:B3",
      values: [
        [payload.session_id],
        [new Date(payload.timestamp).toLocaleString("fr-FR")],
      ],
    },
  ];
}

// ── Error helper ──────────────────────────────────────────────

function err(status: number, code: string, message: string) {
  return NextResponse.json({ ok: false, error: message, code }, { status });
}
