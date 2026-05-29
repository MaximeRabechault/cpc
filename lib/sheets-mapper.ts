// ─────────────────────────────────────────────────────────────
// lib/sheets-mapper.ts v2.0
//
// Maps CPCOutput → Google Sheets ranges for all 7 tabs:
//   Saisie · Heatmap (auto) · Synthèse · Épistémique ·
//   Dynamiques · Fragilité · Simulation T+3
//
// Row/col positions match CPC_Template_v2.xlsx exactly.
// ─────────────────────────────────────────────────────────────

import type {
  AnalyzeResponse,
  SheetsExportPayload,
  SaisieRow,
  DetectedBias,
  CPCOutput,
} from "./types";

// ── Sheet range type ──────────────────────────────────────────

export interface SheetRange {
  range: string;
  values: (string | number | null)[][];
}

// ─────────────────────────────────────────────────────────────
// MAIN ENTRY POINT
// ─────────────────────────────────────────────────────────────

export function buildAllWrites(response: AnalyzeResponse): SheetRange[] {
  const { decision, result } = response;
  const writes: SheetRange[] = [];

  writes.push(...writeSaisie(decision, result));
  writes.push(...writeSynthese(result));
  writes.push(...writeEpistemique(result));
  writes.push(...writeDynamiques(result));
  writes.push(...writeFragilite(result));
  writes.push(...writeSimulation(result));

  return writes;
}

// Legacy export — kept for backward compatibility with /api/export
export function buildSheetsPayload(response: AnalyzeResponse): SheetsExportPayload {
  const { session_id, timestamp, decision, result } = response;
  const sorted = [...result.biases].sort((a, b) => b.risk_score - a.risk_score);
  const rows: SaisieRow[] = sorted.slice(0, 10).map((bias, i) => ({
    row_index: i + 1,
    cause_echec: truncate(bias.statement, 120),
    bias_detected: bias.bias_label,
    probability: clampScore(bias.probability),
    impact: clampScore(bias.impact),
    risk_score: bias.risk_score,
    mitigation: undefined,
  }));
  return { session_id, decision, timestamp, rows };
}

// ─────────────────────────────────────────────────────────────
// SHEET 1: SAISIE
// Structure:
//   C9  = decision
//   C11 = participants, F11 = horizon
//   C13 = context
//   B26:G35 = biases (name, category, P, I, score formula, notes)
//   B40:B49 = verbatims (raw text)
// ─────────────────────────────────────────────────────────────

function writeSaisie(decision: string, result: CPCOutput): SheetRange[] {
  const writes: SheetRange[] = [];
  const sorted = [...result.biases].sort((a, b) => b.risk_score - a.risk_score).slice(0, 10);

  // Session info
  writes.push(range("Saisie!C9", [[decision]]));

  // Bias rows B26:G35
  const biasRows: (string | number | null)[][] = Array.from(
    { length: 10 }, () => [null, null, null, null, null, null]
  );
  sorted.forEach((bias, i) => {
    biasRows[i] = [
      bias.bias_label,
      bias.bias_category,
      clampScore(bias.probability),
      clampScore(bias.impact),
      bias.risk_score,
      bias.rationale,
    ];
  });
  writes.push(range("Saisie!B26:G35", biasRows));

  // Verbatim rows B40:B49
  const verbatimRows: (string | null)[][] = Array.from({ length: 10 }, () => [null]);
  result.cleaned_statements.slice(0, 10).forEach((s, i) => {
    verbatimRows[i] = [s.statement];
  });
  writes.push(range("Saisie!B40:B49", verbatimRows));

  return writes;
}

// ─────────────────────────────────────────────────────────────
// SHEET 3: SYNTHÈSE
// Structure:
//   C7:H16 = cause_echec (C), bias (D=formula), P (E=formula),
//             I (F=formula), score (G=formula), mitigation (H)
//   Only C (cause) and H (mitigation) need writing — rest are formulas.
// ─────────────────────────────────────────────────────────────

function writeSynthese(result: CPCOutput): SheetRange[] {
  const sorted = [...result.biases].sort((a, b) => b.risk_score - a.risk_score).slice(0, 10);

  const causeRows: (string | null)[][] = Array.from({ length: 10 }, () => [null]);
  sorted.forEach((bias, i) => {
    causeRows[i] = [truncate(bias.statement, 150)];
  });

  return [range("Synthèse!C7:C16", causeRows)];
}

// ─────────────────────────────────────────────────────────────
// SHEET 4: ÉPISTÉMIQUE
// Structure:
//   C17:F26 = statement (C), epistemic_type (D), confidence (E), rationale (F)
// ─────────────────────────────────────────────────────────────

function writeEpistemique(result: CPCOutput): SheetRange[] {
  const rows: (string | number | null)[][] = Array.from(
    { length: 10 }, () => [null, null, null, null]
  );
  result.cleaned_statements.slice(0, 10).forEach((s, i) => {
    rows[i] = [
      s.statement,
      s.epistemic_type.replace(/_/g, " "),
      pct(s.epistemic_confidence),
      `Confiance : ${pct(s.epistemic_confidence)}`,
    ];
  });
  return [range("'Épistémique'!C17:F26", rows)];
}

// ─────────────────────────────────────────────────────────────
// SHEET 5: DYNAMIQUES
// Structure:
//   B6:D13  = social dynamics (name, severity, evidence joined)
//   Blindspots sections (sub-headers at rows 16,19,22,25,28,31):
//     unknown_unknowns    → B17:B18
//     invisible_deps      → B20:B21
//     unchallenged_assump → B23:B24
//     silent_failure_paths→ B26:B27
//     missing_stakeholders→ B29:B30
//     absent_information  → B32:B33
// ─────────────────────────────────────────────────────────────

function writeDynamiques(result: CPCOutput): SheetRange[] {
  const writes: SheetRange[] = [];

  // Social dynamics B6:D13
  const dynRows: (string | number | null)[][] = Array.from(
    { length: 8 }, () => [null, null, null]
  );
  result.social_dynamics.slice(0, 8).forEach((d, i) => {
    dynRows[i] = [
      d.dynamic.replace(/_/g, " "),
      d.severity,
      d.evidence.slice(0, 3).join(" · "),
    ];
  });
  writes.push(range("Dynamiques!B6:D13", dynRows));

  // Blindspot sections
  const bs = result.unknowns_and_blindspots;
  const blindspotMap: { items: string[]; startRow: number }[] = [
    { items: bs.unknown_unknowns,         startRow: 17 },
    { items: bs.invisible_dependencies,   startRow: 20 },
    { items: bs.unchallenged_assumptions, startRow: 23 },
    { items: bs.silent_failure_paths,     startRow: 26 },
    { items: bs.missing_stakeholders,     startRow: 29 },
    { items: bs.absent_information,       startRow: 32 },
  ];

  for (const { items, startRow } of blindspotMap) {
    const rows: (string | null)[][] = [[null], [null]];
    items.slice(0, 2).forEach((item, i) => { rows[i] = [item]; });
    writes.push(range(`Dynamiques!B${startRow}:B${startRow + 1}`, rows));
  }

  return writes;
}

// ─────────────────────────────────────────────────────────────
// SHEET 6: FRAGILITÉ
// Structure:
//   C6  = score
//   C7  = resilience_level
//   C8  = primary_failure_mode
//   C9  = dominant_bias_cluster (joined)
//   C10 = fragility_rationale
//   B14:F18 = contradictions (stmt_a, stmt_b, type, severity, implication)
//   B22:C26 = top 5 risks (bias, score — score is formula already)
// ─────────────────────────────────────────────────────────────

function writeFragilite(result: CPCOutput): SheetRange[] {
  const writes: SheetRange[] = [];
  const f = result.decision_fragility;

  // Fragility fields C6:C10
  writes.push(range("Fragilité!C6:C10", [
    [f.score.toFixed(1)],
    [f.resilience_level.replace(/_/g, " ").toUpperCase()],
    [f.primary_failure_mode],
    [f.dominant_bias_cluster.map(b => b.replace(/_/g, " ")).join(" · ")],
    [f.fragility_rationale],
  ]));

  // Contradictions B14:F18
  const contrRows: (string | null)[][] = Array.from(
    { length: 5 }, () => [null, null, null, null, null]
  );
  result.contradictions.slice(0, 5).forEach((c, i) => {
    contrRows[i] = [
      truncate(c.statement_a, 80),
      truncate(c.statement_b, 80),
      c.contradiction_type,
      c.severity.toUpperCase(),
      truncate(c.implication, 120),
    ];
  });
  writes.push(range("Fragilité!B14:F18", contrRows));

  // Top risks bias names B22:B26 (scores already formula)
  const topRiskNames: (string | null)[][] = Array.from({ length: 5 }, () => [null]);
  result.top_risks.slice(0, 5).forEach((r, i) => {
    topRiskNames[i] = [r.bias_label];
  });
  writes.push(range("Fragilité!C22:C26", topRiskNames));

  // Top risks rationale F22:F26
  const topRiskRationale: (string | null)[][] = Array.from({ length: 5 }, () => [null]);
  result.top_risks.slice(0, 5).forEach((r, i) => {
    topRiskRationale[i] = [r.priority_rationale];
  });
  writes.push(range("Fragilité!F22:F26", topRiskRationale));

  return writes;
}

// ─────────────────────────────────────────────────────────────
// SHEET 7: SIMULATION T+3
// Structure:
//   C5       = system_degradation_trajectory
//   B9:C12   = first_order (unintended | emergent) — 4 rows each
//   Second order sections (header + 3 data rows, 1 spacer each):
//     actor_adaptations    → B17:B19
//     defensive_behaviors  → B22:B24
//     organizational_drift → B27:B29
//     cognitive_debt       → B32:B34
//     decisional_fatigue   → B37:B39
//   New biases:
//     B42:B44
// ─────────────────────────────────────────────────────────────

function writeSimulation(result: CPCOutput): SheetRange[] {
  const writes: SheetRange[] = [];
  const t = result.temporal_simulation;

  // Trajectory C5
  writes.push(range("'Simulation T+3'!C5", [
    [t.system_degradation_trajectory.replace(/_/g, " ").toUpperCase()]
  ]));

  // First order B9:C12
  const fo = t.first_order;
  const foRows: (string | null)[][] = Array.from({ length: 4 }, () => [null, null]);
  for (let i = 0; i < 4; i++) {
    foRows[i] = [
      fo.unintended_consequences[i] ?? null,
      fo.emergent_risks[i] ?? null,
    ];
  }
  writes.push(range("'Simulation T+3'!B9:C12", foRows));

  // Second order — each section 3 data rows
  const so = t.second_order;
  const secondOrder: { items: string[]; startRow: number }[] = [
    { items: so.actor_adaptations,          startRow: 17 },
    { items: so.defensive_behaviors,        startRow: 22 },
    { items: so.organizational_drift,       startRow: 27 },
    { items: so.cognitive_debt,             startRow: 32 },
    { items: so.decisional_fatigue_signals, startRow: 37 },
  ];

  for (const { items, startRow } of secondOrder) {
    const rows: (string | null)[][] = [[null], [null], [null]];
    items.slice(0, 3).forEach((item, i) => { rows[i] = [item]; });
    writes.push(range(`'Simulation T+3'!B${startRow}:B${startRow + 2}`, rows));
  }

  // New biases B42:B44
  const newBiasRows: (string | null)[][] = [[null], [null], [null]];
  t.new_biases_introduced.slice(0, 3).forEach((b, i) => {
    newBiasRows[i] = [b.replace(/_/g, " ")];
  });
  writes.push(range("'Simulation T+3'!B42:B44", newBiasRows));

  return writes;
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function range(rangeStr: string, values: (string | number | null)[][]): SheetRange {
  return { range: rangeStr, values };
}

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

function pct(val: number): string {
  return `${Math.round(val * 100)}%`;
}

// ─────────────────────────────────────────────────────────────
// COLUMN MAPPING REFERENCE (read-only)
// ─────────────────────────────────────────────────────────────
//
// SAISIE
//   C9       decision
//   B26:G35  bias_label | category | P | I | score(formula) | rationale
//   B40:B49  cleaned_statement
//
// SYNTHÈSE
//   C7:C16   cause_echec  (D-G are formulas from Saisie)
//   H7:H16   mitigation (left manual)
//
// ÉPISTÉMIQUE
//   C17:F26  statement | epistemic_type | confidence | rationale
//
// DYNAMIQUES
//   B6:D13   dynamic_name | severity | evidence
//   B17:B18  unknown_unknowns (2 rows)
//   B20:B21  invisible_dependencies
//   B23:B24  unchallenged_assumptions
//   B26:B27  silent_failure_paths
//   B29:B30  missing_stakeholders
//   B32:B33  absent_information
//
// FRAGILITÉ
//   C6       score
//   C7       resilience_level
//   C8       primary_failure_mode
//   C9       dominant_bias_cluster
//   C10      fragility_rationale
//   B14:F18  contradictions
//   C22:C26  top risk names (D formula)
//   F22:F26  top risk rationales
//
// SIMULATION T+3
//   C5       degradation_trajectory
//   B9:C12   first_order (unintended | emergent)
//   B17:B19  actor_adaptations
//   B22:B24  defensive_behaviors
//   B27:B29  organizational_drift
//   B32:B34  cognitive_debt
//   B37:B39  decisional_fatigue_signals
//   B42:B44  new_biases_introduced
