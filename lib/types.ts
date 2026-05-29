// ─────────────────────────────────────────────────────────────
// CPC TYPES v2.0 — Shared data contracts
// ─────────────────────────────────────────────────────────────

// ── Request ──────────────────────────────────────────────────

export interface AnalyzeRequest {
  decision: string;
  verbatims: string[];
  participants?: number;
  context?: string;
  session_id?: string;
}

// ── Enums ─────────────────────────────────────────────────────

export type VulnerabilityLevel = "low" | "moderate" | "high" | "critical";
export type Severity = "moderate" | "high" | "critical";
export type Timeline = "immediate" | "short_term" | "medium_term";
export type ResilienceLevel = "very_low" | "low" | "moderate" | "high";
export type DegradationTrajectory = "stable" | "degrading" | "accelerating_collapse";
export type BiasCategory = "cognitive" | "group" | "organizational";
export type ContradictionType = "resource" | "temporal" | "epistemic" | "structural" | "political";
export type SourceLayer = "bias" | "social_dynamic" | "blindspot" | "contradiction";

export type EpistemicType =
  | "observed_fact"
  | "interpretation"
  | "assumption"
  | "prediction"
  | "emotional_signal"
  | "political_signal"
  | "social_dynamic"
  | "inferred_causality"
  | "uncertainty"
  | "unknown";

// ── Meta ──────────────────────────────────────────────────────

export interface CPCMeta {
  cpc_version: string;
  pipeline_executed: string[];
  input_verbatim_count: number;
  processed_statement_count: number;
}

// ── Cognitive Summary ─────────────────────────────────────────

export interface CognitiveSummary {
  dominant_narrative: string;
  key_blind_spots: string[];
  decision_vulnerability_level: VulnerabilityLevel;
  group_epistemic_profile: string;
}

// ── Cleaned Statements (now with epistemic classification) ────

export interface CleanedStatement {
  id: number;
  original_verbatim_index: number;
  statement: string;
  epistemic_type: EpistemicType;
  epistemic_confidence: number;
}

// ── Biases (now with category) ────────────────────────────────

export interface DetectedBias {
  id: number;
  statement_id: number;
  statement: string;
  bias_detected: string;
  bias_label: string;
  bias_category: BiasCategory;
  probability: 1 | 2 | 3 | 4;
  impact: 1 | 2 | 3 | 4;
  risk_score: number;
  confidence: number;
  rationale: string;
}

// ── Social Dynamics (new) ─────────────────────────────────────

export interface SocialDynamic {
  dynamic: string;
  severity: 1 | 2 | 3 | 4 | 5;
  evidence: string[];
}

// ── Unknowns & Blindspots (new) ───────────────────────────────

export interface UnknownsAndBlindspots {
  unknown_unknowns: string[];
  invisible_dependencies: string[];
  missing_stakeholders: string[];
  unchallenged_assumptions: string[];
  absent_information: string[];
  silent_failure_paths: string[];
}

// ── Top Risks ─────────────────────────────────────────────────

export interface TopRisk {
  rank: number;
  bias_id: number;
  bias_label: string;
  risk_score: number;
  priority_rationale: string;
}

// ── Contradictions (new) ──────────────────────────────────────

export interface Contradiction {
  id: number;
  statement_a: string;
  statement_b: string;
  contradiction_type: ContradictionType;
  severity: Severity;
  implication: string;
}

// ── Decision Fragility (new) ──────────────────────────────────

export interface DecisionFragility {
  score: number;                        // 0.0–10.0
  primary_failure_mode: string;
  dominant_bias_cluster: string[];
  resilience_level: ResilienceLevel;
  fragility_rationale: string;
}

// ── Adversarial Scenarios (enhanced) ─────────────────────────

export interface AdversarialScenario {
  id: number;
  title: string;
  failure_mechanism: string;
  trigger_condition: string;
  affected_biases: string[];
  severity: Severity;
  source_layer: SourceLayer;
}

// ── Temporal Simulation (second-order) ───────────────────────

export interface TemporalSimulation {
  horizon: "T+3";
  first_order: {
    unintended_consequences: string[];
    emergent_risks: string[];
  };
  second_order: {
    actor_adaptations: string[];
    defensive_behaviors: string[];
    organizational_drift: string[];
    cognitive_debt: string[];
    decisional_fatigue_signals: string[];
  };
  new_biases_introduced: string[];
  system_degradation_trajectory: DegradationTrajectory;
}

// ── Decision Recommendations (enhanced) ──────────────────────

export interface DecisionRecommendation {
  priority: 1 | 2 | 3;
  action: string;
  target_bias: string;
  timeline: Timeline;
  source_layer: SourceLayer;
}

// ── Full CPC Output ───────────────────────────────────────────

export interface CPCOutput {
  meta: CPCMeta;
  cognitive_summary: CognitiveSummary;
  cleaned_statements: CleanedStatement[];
  biases: DetectedBias[];
  social_dynamics: SocialDynamic[];
  unknowns_and_blindspots: UnknownsAndBlindspots;
  top_risks: TopRisk[];
  contradictions: Contradiction[];
  decision_fragility: DecisionFragility;
  adversarial_scenarios: AdversarialScenario[];
  temporal_simulation: TemporalSimulation;
  decision_recommendations: DecisionRecommendation[];
}

// ── API Response ──────────────────────────────────────────────

export interface AnalyzeResponse {
  ok: true;
  session_id: string;
  timestamp: string;
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
  | "INVALID_INPUT"
  | "TOO_MANY_VERBATIMS"
  | "VERBATIM_TOO_LONG"
  | "OPENAI_ERROR"
  | "PARSE_ERROR"
  | "PIPELINE_INCOMPLETE"
  | "INTERNAL_ERROR";

// ── Sheets Export (unchanged) ─────────────────────────────────

export interface SaisieRow {
  row_index: number;
  cause_echec: string;
  bias_detected: string;
  probability: number;
  impact: number;
  risk_score: number;
  mitigation?: string;
}

export interface SheetsExportPayload {
  session_id: string;
  decision: string;
  timestamp: string;
  rows: SaisieRow[];
}
