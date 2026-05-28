// ─────────────────────────────────────────────────────────────
// CPC TYPES — Shared data contracts
// Used by: /api/analyze, /api/export, frontend components
// ─────────────────────────────────────────────────────────────

// ── Request ──────────────────────────────────────────────────

export interface AnalyzeRequest {
  decision: string;           // Decision under analysis
  verbatims: string[];        // Raw participant statements (1–10)
  participants?: number;      // Optional headcount
  context?: string;           // Optional session context
  session_id?: string;        // Optional — generated if absent
}

// ── GPT Output (mirrors the JSON schema in cpc-prompt.ts) ────

export type VulnerabilityLevel = "low" | "moderate" | "high" | "critical";
export type Severity = "moderate" | "high" | "critical";
export type Timeline = "immediate" | "short_term" | "medium_term";

export interface CPCMeta {
  cpc_version: string;
  pipeline_executed: string[];
  input_verbatim_count: number;
  processed_statement_count: number;
}

export interface CognitiveSummary {
  dominant_narrative: string;
  key_blind_spots: string[];
  decision_vulnerability_level: VulnerabilityLevel;
}

export interface CleanedStatement {
  id: number;
  original_verbatim_index: number;
  statement: string;
}

export interface DetectedBias {
  id: number;
  statement_id: number;
  statement: string;
  bias_detected: string;        // snake_case
  bias_label: string;           // Human-readable
  probability: 1 | 2 | 3 | 4;
  impact: 1 | 2 | 3 | 4;
  risk_score: number;           // probability × impact
  confidence: number;           // 0.0 – 1.0
  rationale: string;
}

export interface TopRisk {
  rank: number;
  bias_id: number;
  bias_label: string;
  risk_score: number;
  priority_rationale: string;
}

export interface AdversarialScenario {
  id: number;
  title: string;
  failure_mechanism: string;
  trigger_condition: string;
  affected_biases: string[];
  severity: Severity;
}

export interface TemporalSimulation {
  horizon: "T+3";
  unintended_consequences: string[];
  emergent_risks: string[];
  new_biases_introduced: string[];
  degradation_effects: string[];
}

export interface DecisionRecommendation {
  priority: 1 | 2 | 3;
  action: string;
  target_bias: string;
  timeline: Timeline;
}

export interface CPCOutput {
  meta: CPCMeta;
  cognitive_summary: CognitiveSummary;
  cleaned_statements: CleanedStatement[];
  biases: DetectedBias[];
  top_risks: TopRisk[];
  adversarial_scenarios: AdversarialScenario[];
  temporal_simulation: TemporalSimulation;
  decision_recommendations: DecisionRecommendation[];
}

// ── API Response ─────────────────────────────────────────────

export interface AnalyzeResponse {
  ok: true;
  session_id: string;
  timestamp: string;           // ISO 8601
  decision: string;
  result: CPCOutput;
}

export interface AnalyzeErrorResponse {
  ok: false;
  error: string;
  code: AnalyzeErrorCode;
  details?: string;
}

export type AnalyzeErrorCode =
  | "INVALID_INPUT"             // Missing required fields
  | "TOO_MANY_VERBATIMS"        // > 10 verbatims
  | "VERBATIM_TOO_LONG"         // Single verbatim > 500 chars
  | "OPENAI_ERROR"              // OpenAI API failure
  | "PARSE_ERROR"               // GPT returned invalid JSON
  | "PIPELINE_INCOMPLETE"       // GPT skipped layers
  | "INTERNAL_ERROR";           // Unexpected

// ── Sheets export contract ───────────────────────────────────
// Flat row format compatible with Saisie tab (B25:G34)

export interface SaisieRow {
  row_index: number;            // 1–10, maps to Excel rows 25–34
  cause_echec: string;          // Cleaned statement (col C in Synthèse)
  bias_detected: string;        // Bias label (col B in Saisie / col D in Synthèse)
  probability: number;          // 1–4 (col C in Saisie)
  impact: number;               // 1–4 (col D in Saisie)
  risk_score: number;           // Computed (col E in Synthèse)
  mitigation?: string;          // Manual — col G in Synthèse (left blank)
}

export interface SheetsExportPayload {
  session_id: string;
  decision: string;
  timestamp: string;
  rows: SaisieRow[];            // Max 10
}
