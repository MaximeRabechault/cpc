// ─────────────────────────────────────────────────────────────
// lib/sheets-mapper.ts
//
// Converts AnalyzeResponse → SheetsExportPayload
// This is the single source of truth for the JSON → Excel mapping.
//
// Target tabs (existing template):
//   Saisie   B25:E34 — bias_detected, probability, impact, risk_score
//   Synthese C6:F15  — cause_echec, bias_detected, probability, impact
//   Heatmap          — auto-recalculates from Saisie (no writes needed)
// ─────────────────────────────────────────────────────────────

import type {
  AnalyzeResponse,
  SheetsExportPayload,
  SaisieRow,
  DetectedBias,
} from "./types";

// ─────────────────────────────────────────────────────────────

export function buildSheetsPayload(response: AnalyzeResponse): SheetsExportPayload {
  const { session_id, timestamp, decision, result } = response;

  // Sort biases by risk_score descending — highest risks fill top rows
  const sorted = [...result.biases].sort((a, b) => b.risk_score - a.risk_score);

  // Cap at 10 rows (Excel template limit)
  const capped = sorted.slice(0, 10);

  const rows: SaisieRow[] = capped.map((bias, i) => mapBiasRow(bias, i + 1));

  return {
    session_id,
    decision,
    timestamp,
    rows,
  };
}

// ── Row mapper ────────────────────────────────────────────────

function mapBiasRow(bias: DetectedBias, index: number): SaisieRow {
  return {
    row_index: index,

    // cause_echec = cleaned statement (col C in Synthèse)
    // Truncate at 120 chars for cell readability
    cause_echec: truncate(bias.statement, 120),

    // bias_detected = human-readable label (col B in Saisie, col D in Synthèse)
    bias_detected: bias.bias_label,

    // Scores
    probability: clampScore(bias.probability),
    impact: clampScore(bias.impact),
    risk_score: bias.risk_score,

    // mitigation — intentionally left undefined
    // Col G in Synthèse stays manual (governance principle)
    mitigation: undefined,
  };
}

// ── Helpers ───────────────────────────────────────────────────

function clampScore(val: number): 1 | 2 | 3 | 4 {
  const n = Math.round(val);
  if (n <= 1) return 1;
  if (n >= 4) return 4;
  return n as 1 | 2 | 3 | 4;
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 1) + "…";
}

// ─────────────────────────────────────────────────────────────
// Column mapping reference (read-only — do not modify)
// ─────────────────────────────────────────────────────────────
//
// SAISIE TAB
// ┌─────┬──────────────────────┬──────────┬────────┬───────────┐
// │ Row │ B                    │ C        │ D      │ E         │
// ├─────┼──────────────────────┼──────────┼────────┼───────────┤
// │  25 │ bias_detected (label)│ prob (P) │ imp (I)│ risk_score│
// │  26 │ …                    │ …        │ …      │ …         │
// │  34 │ (row 10)             │          │        │           │
// └─────┴──────────────────────┴──────────┴────────┴───────────┘
// Note: Heatmap reads C and D to auto-place biases in grid cells
//
// SYNTHESE TAB
// ┌─────┬───┬──────────────────────┬──────────────────────┬──────────┬────────┬──────────────────┐
// │ Row │ B │ C                    │ D                    │ E        │ F      │ G                │
// ├─────┼───┼──────────────────────┼──────────────────────┼──────────┼────────┼──────────────────┤
// │   6 │ 1 │ cause_echec          │ bias_detected        │ prob     │ impact │ mitigation (manual)│
// │   7 │ 2 │ …                    │ …                    │ …        │ …      │ …                │
// │  15 │ 10│                      │                      │          │        │                  │
// └─────┴───┴──────────────────────┴──────────────────────┴──────────┴────────┴──────────────────┘
//
// HEATMAP TAB — no direct writes
// All cells are IF() formulas reading Saisie C25:D34
// Writing B25:D34 in Saisie is sufficient to trigger full recalculation
