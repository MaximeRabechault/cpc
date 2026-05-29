"use client";

import type {
  CPCOutput, DetectedBias, AdversarialScenario,
  SocialDynamic, Contradiction, CleanedStatement,
} from "@/lib/types";

// ── Helpers ───────────────────────────────────────────────────

function riskClass(score: number) {
  if (score >= 12) return "risk-critical";
  if (score >= 8)  return "risk-high";
  if (score >= 4)  return "risk-moderate";
  return "risk-low";
}
function riskLabel(score: number) {
  if (score >= 12) return "CRITIQUE";
  if (score >= 8)  return "ÉLEVÉ";
  if (score >= 4)  return "MODÉRÉ";
  return "FAIBLE";
}
function vulnClass(level: string) {
  return { critical:"risk-critical", high:"risk-high", moderate:"risk-moderate", low:"risk-low" }[level] ?? "risk-low";
}
function severityClass(s: string) {
  return { critical:"risk-critical", high:"risk-high", moderate:"risk-moderate" }[s] ?? "risk-moderate";
}
function epistemicColor(type: string): string {
  const map: Record<string, string> = {
    observed_fact: "#2A7A52", interpretation: "#2A5A9A", assumption: "#EB642A",
    prediction: "#6A4A9A", emotional_signal: "#C83232", political_signal: "#C04828",
    social_dynamic: "#8A6A2A", inferred_causality: "#2A8A7A",
    uncertainty: "#8A9AA6", unknown: "#4A5A66",
  };
  return map[type] ?? "#8A9AA6";
}

// ── Sub-components ────────────────────────────────────────────

function BiasRow({ bias, rank }: { bias: DetectedBias; rank?: number }) {
  return (
    <tr className="cpc-table-row">
      <td className="cpc-td cpc-td-index">{rank ?? bias.id}</td>
      <td className="cpc-td">
        <span className="cpc-bias-label">{bias.bias_label}</span>
        <span className="cpc-bias-statement">{bias.statement}</span>
        <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginTop: 2, display: "block" }}>
          {bias.bias_category}
        </span>
      </td>
      <td className="cpc-td cpc-td-center"><span className="cpc-score-cell">{bias.probability}</span></td>
      <td className="cpc-td cpc-td-center"><span className="cpc-score-cell">{bias.impact}</span></td>
      <td className="cpc-td cpc-td-center">
        <span className={`cpc-risk-badge ${riskClass(bias.risk_score)}`}>
          {bias.risk_score} — {riskLabel(bias.risk_score)}
        </span>
      </td>
      <td className="cpc-td cpc-td-muted">{Math.round(bias.confidence * 100)}%</td>
    </tr>
  );
}

function AdversarialCard({ scenario }: { scenario: AdversarialScenario }) {
  return (
    <div className="cpc-adversarial-card">
      <div className="cpc-adversarial-header">
        <span className="cpc-adversarial-id">{String(scenario.id).padStart(2, "0")}</span>
        <div style={{ display: "flex", gap: 6 }}>
          <span className={`cpc-risk-badge ${severityClass(scenario.severity)}`}>{scenario.severity.toUpperCase()}</span>
          <span className="cpc-tag">{scenario.source_layer.replace(/_/g, " ")}</span>
        </div>
      </div>
      <h3 className="cpc-adversarial-title">{scenario.title}</h3>
      <div className="cpc-adversarial-body">
        <div className="cpc-adv-field">
          <span className="cpc-adv-key">Mécanisme de défaillance</span>
          <span className="cpc-adv-val">{scenario.failure_mechanism}</span>
        </div>
        <div className="cpc-adv-field">
          <span className="cpc-adv-key">Condition déclenchante</span>
          <span className="cpc-adv-val">{scenario.trigger_condition}</span>
        </div>
        {scenario.affected_biases.length > 0 && (
          <div className="cpc-adv-field">
            <span className="cpc-adv-key">Biais impliqués</span>
            <div className="cpc-tag-list">
              {scenario.affected_biases.map((b) => (
                <span key={b} className="cpc-tag">{b.replace(/_/g, " ")}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

export function CPCResults({ result }: { result: CPCOutput }) {
  const {
    cognitive_summary, cleaned_statements, biases, social_dynamics,
    unknowns_and_blindspots, top_risks, contradictions, decision_fragility,
    adversarial_scenarios, temporal_simulation, decision_recommendations, meta,
  } = result;

  const sortedBiases = [...biases].sort((a, b) => b.risk_score - a.risk_score);

  return (
    <div className="cpc-results">

      {/* ── 1. Cognitive Summary ─────────────────────────── */}
      <div className="cpc-section">
        <div className="cpc-section-header">
          <span className="cpc-section-num">1</span>
          <h2 className="cpc-section-title">Résumé cognitif</h2>
          <span className={`cpc-risk-badge ${vulnClass(cognitive_summary.decision_vulnerability_level)}`}>
            Vulnérabilité : {cognitive_summary.decision_vulnerability_level.toUpperCase()}
          </span>
        </div>
        <div className="cpc-summary-grid">
          <div className="cpc-summary-card">
            <span className="cpc-summary-key">Narrative dominante</span>
            <span className="cpc-summary-val">{cognitive_summary.dominant_narrative}</span>
          </div>
          <div className="cpc-summary-card">
            <span className="cpc-summary-key">Profil épistémique du groupe</span>
            <span className="cpc-summary-val">{cognitive_summary.group_epistemic_profile}</span>
          </div>
        </div>
        {cognitive_summary.key_blind_spots.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <span className="cpc-summary-key" style={{ display: "block", marginBottom: 6 }}>Angles morts détectés</span>
            <ul className="cpc-blindspot-list">
              {cognitive_summary.key_blind_spots.map((b, i) => <li key={i}>{b}</li>)}
            </ul>
          </div>
        )}
      </div>

      {/* ── 2. Epistemic Map ──────────────────────────────── */}
      <div className="cpc-section">
        <div className="cpc-section-header">
          <span className="cpc-section-num">2</span>
          <h2 className="cpc-section-title">
            Classification épistémique
            <span className="cpc-count-badge">{cleaned_statements.length}</span>
          </h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {cleaned_statements.map((s) => (
            <div key={s.id} style={{
              display: "flex", alignItems: "flex-start", gap: 10,
              background: "var(--bg-surface)", borderRadius: 6, padding: "8px 12px"
            }}>
              <span style={{
                fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 500,
                color: epistemicColor(s.epistemic_type),
                background: epistemicColor(s.epistemic_type) + "18",
                border: `0.5px solid ${epistemicColor(s.epistemic_type)}`,
                borderRadius: 3, padding: "2px 6px", whiteSpace: "nowrap", flexShrink: 0,
                marginTop: 2
              }}>
                {s.epistemic_type.replace(/_/g, " ")}
              </span>
              <span style={{ fontSize: 13, color: "var(--text-primary)", flex: 1, lineHeight: 1.5 }}>
                {s.statement}
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)", flexShrink: 0 }}>
                {Math.round(s.epistemic_confidence * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3. Bias Map ───────────────────────────────────── */}
      <div className="cpc-section">
        <div className="cpc-section-header">
          <span className="cpc-section-num">3</span>
          <h2 className="cpc-section-title">
            Carte des biais
            <span className="cpc-count-badge">{biases.length}</span>
          </h2>
        </div>
        <div className="cpc-table-wrap">
          <table className="cpc-table">
            <thead>
              <tr>
                <th className="cpc-th">#</th>
                <th className="cpc-th">Biais / Source</th>
                <th className="cpc-th cpc-th-center">P</th>
                <th className="cpc-th cpc-th-center">I</th>
                <th className="cpc-th cpc-th-center">Score P×I</th>
                <th className="cpc-th">Conf.</th>
              </tr>
            </thead>
            <tbody>
              {sortedBiases.map((b, i) => <BiasRow key={b.id} bias={b} rank={i + 1} />)}
            </tbody>
          </table>
        </div>
        <p className="cpc-table-legend">P = Probabilité (1–4) · I = Impact (1–4) · Score = P × I</p>
      </div>

      {/* ── 4. Social Dynamics ────────────────────────────── */}
      {social_dynamics.length > 0 && (
        <div className="cpc-section">
          <div className="cpc-section-header">
            <span className="cpc-section-num">4</span>
            <h2 className="cpc-section-title">Dynamiques de groupe</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {social_dynamics.map((d, i) => (
              <div key={i} style={{
                background: "var(--bg-surface)", borderRadius: i === 0 ? "6px 6px 0 0" : i === social_dynamics.length - 1 ? "0 0 6px 6px" : 0,
                padding: "12px 16px", display: "flex", alignItems: "flex-start", gap: 12
              }}>
                <div style={{
                  fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 500,
                  color: d.severity >= 4 ? "var(--red)" : d.severity >= 3 ? "var(--amber)" : "var(--blue)",
                  minWidth: 20, paddingTop: 2
                }}>
                  {d.severity}/5
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", marginBottom: 4 }}>
                    {d.dynamic.replace(/_/g, " ")}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {d.evidence.map((e, j) => (
                      <span key={j} style={{
                        fontSize: 11, color: "var(--text-secondary)",
                        background: "var(--bg-hover)", borderRadius: 3, padding: "1px 6px",
                        border: "0.5px solid var(--border)"
                      }}>{e}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 5. Unknowns & Blindspots ──────────────────────── */}
      <div className="cpc-section">
        <div className="cpc-section-header">
          <span className="cpc-section-num">5</span>
          <h2 className="cpc-section-title">Angles morts & inconnues</h2>
        </div>
        <div className="cpc-temporal-grid">
          {[
            { key: "unknown_unknowns",        label: "Inconnues inconnues",          items: unknowns_and_blindspots.unknown_unknowns,        nth: 1 },
            { key: "invisible_dependencies",  label: "Dépendances invisibles",       items: unknowns_and_blindspots.invisible_dependencies,  nth: 2 },
            { key: "unchallenged_assumptions", label: "Hypothèses non challengées",  items: unknowns_and_blindspots.unchallenged_assumptions, nth: 3 },
            { key: "silent_failure_paths",    label: "Chemins d'échec silencieux",   items: unknowns_and_blindspots.silent_failure_paths,    nth: 4 },
          ].map(({ key, label, items }) => (
            <div key={key} className="cpc-temporal-card" style={{ background: "var(--bg-surface)" }}>
              <span className="cpc-temporal-label" style={{ color: "var(--amber)" }}>{label}</span>
              <ul className="cpc-temporal-list">
                {items.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
          ))}
        </div>
        {(unknowns_and_blindspots.missing_stakeholders.length > 0 || unknowns_and_blindspots.absent_information.length > 0) && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, marginTop: 1 }}>
            {[
              { label: "Parties prenantes absentes", items: unknowns_and_blindspots.missing_stakeholders },
              { label: "Informations manquantes",    items: unknowns_and_blindspots.absent_information },
            ].map(({ label, items }) => items.length > 0 && (
              <div key={label} style={{ background: "var(--bg-surface)", padding: "1rem 1.25rem", borderRadius: 6 }}>
                <span className="cpc-summary-key">{label}</span>
                <ul className="cpc-temporal-list" style={{ marginTop: 8 }}>
                  {items.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 6. Top Risks ──────────────────────────────────── */}
      <div className="cpc-section">
        <div className="cpc-section-header">
          <span className="cpc-section-num">6</span>
          <h2 className="cpc-section-title">Top risques</h2>
        </div>
        <div className="cpc-top-risks">
          {top_risks.map((r) => {
            const bias = biases.find((b) => b.id === r.bias_id);
            return (
              <div key={r.rank} className="cpc-top-risk-row">
                <span className="cpc-top-risk-rank">{r.rank}</span>
                <div className="cpc-top-risk-body">
                  <span className="cpc-top-risk-name">{r.bias_label}</span>
                  <span className="cpc-top-risk-rationale">{r.priority_rationale}</span>
                </div>
                <span className={`cpc-risk-badge ${riskClass(r.risk_score)}`}>{r.risk_score}</span>
                {bias && <span className="cpc-top-risk-confidence">{Math.round(bias.confidence * 100)}%</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 7. Contradictions ─────────────────────────────── */}
      {contradictions.length > 0 && (
        <div className="cpc-section">
          <div className="cpc-section-header">
            <span className="cpc-section-num">7</span>
            <h2 className="cpc-section-title">
              Contradictions structurelles
              <span className="cpc-count-badge">{contradictions.length}</span>
            </h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {contradictions.map((c) => (
              <div key={c.id} style={{
                background: "var(--bg-surface)", borderRadius: 6, padding: "14px 16px",
                borderLeft: `3px solid ${c.severity === "critical" ? "var(--red)" : c.severity === "high" ? "var(--amber)" : "var(--blue)"}`
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span className={`cpc-risk-badge ${severityClass(c.severity)}`}>{c.severity.toUpperCase()}</span>
                  <span className="cpc-tag">{c.contradiction_type}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: "var(--text-primary)", fontStyle: "italic" }}>"{c.statement_a}"</span>
                  <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>vs</span>
                  <span style={{ fontSize: 13, color: "var(--text-primary)", fontStyle: "italic" }}>"{c.statement_b}"</span>
                </div>
                <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>{c.implication}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 8. Decision Fragility ─────────────────────────── */}
      <div className="cpc-section">
        <div className="cpc-section-header">
          <span className="cpc-section-num">8</span>
          <h2 className="cpc-section-title">Fragilité décisionnelle</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 24, alignItems: "start" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{
              fontSize: 48, fontWeight: 700, fontFamily: "var(--font-mono)",
              color: decision_fragility.score >= 7 ? "var(--red)" : decision_fragility.score >= 5 ? "var(--amber)" : "var(--green)",
              lineHeight: 1
            }}>
              {decision_fragility.score.toFixed(1)}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>/ 10</div>
            <div style={{ marginTop: 8 }}>
              <span className={`cpc-risk-badge ${
                decision_fragility.resilience_level === "very_low" || decision_fragility.resilience_level === "low"
                  ? "risk-critical" : decision_fragility.resilience_level === "moderate" ? "risk-moderate" : "risk-low"
              }`}>
                {decision_fragility.resilience_level.replace("_", " ").toUpperCase()}
              </span>
            </div>
          </div>
          <div>
            <div style={{ marginBottom: 10 }}>
              <span className="cpc-summary-key">Mode de défaillance principal</span>
              <p style={{ fontSize: 14, color: "var(--text-primary)", marginTop: 4 }}>{decision_fragility.primary_failure_mode}</p>
            </div>
            <div style={{ marginBottom: 10 }}>
              <span className="cpc-summary-key">Cluster de biais dominant</span>
              <div className="cpc-tag-list" style={{ marginTop: 4 }}>
                {decision_fragility.dominant_bias_cluster.map((b) => (
                  <span key={b} className="cpc-tag">{b.replace(/_/g, " ")}</span>
                ))}
              </div>
            </div>
            <div>
              <span className="cpc-summary-key">Analyse</span>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4, lineHeight: 1.5 }}>
                {decision_fragility.fragility_rationale}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 9. Adversarial Scenarios ──────────────────────── */}
      <div className="cpc-section">
        <div className="cpc-section-header">
          <span className="cpc-section-num">9</span>
          <h2 className="cpc-section-title">Scénarios adversariaux</h2>
        </div>
        <div className="cpc-adversarial-grid">
          {adversarial_scenarios.map((s) => <AdversarialCard key={s.id} scenario={s} />)}
        </div>
      </div>

      {/* ── 10. Temporal Simulation ───────────────────────── */}
      <div className="cpc-section">
        <div className="cpc-section-header">
          <span className="cpc-section-num">10</span>
          <h2 className="cpc-section-title">
            Simulation temporelle
            <span className="cpc-horizon-badge">T+3 mois</span>
            <span className={`cpc-risk-badge ${
              temporal_simulation.system_degradation_trajectory === "accelerating_collapse" ? "risk-critical"
              : temporal_simulation.system_degradation_trajectory === "degrading" ? "risk-high" : "risk-low"
            }`}>
              {temporal_simulation.system_degradation_trajectory.replace(/_/g, " ")}
            </span>
          </h2>
        </div>

        <div style={{ marginBottom: 12 }}>
          <span className="cpc-summary-key" style={{ marginBottom: 8, display: "block" }}>Effets de premier ordre</span>
          <div className="cpc-temporal-grid">
            <div className="cpc-temporal-card" style={{ background: "#FEF9F0", borderRadius: "6px 0 0 6px" }}>
              <span className="cpc-temporal-label" style={{ color: "var(--amber)" }}>Conséquences non anticipées</span>
              <ul className="cpc-temporal-list">
                {temporal_simulation.first_order.unintended_consequences.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
            <div className="cpc-temporal-card" style={{ background: "var(--red-dim)", borderRadius: "0 6px 6px 0" }}>
              <span className="cpc-temporal-label" style={{ color: "var(--red)" }}>Risques émergents</span>
              <ul className="cpc-temporal-list">
                {temporal_simulation.first_order.emergent_risks.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
          </div>
        </div>

        <div>
          <span className="cpc-summary-key" style={{ marginBottom: 8, display: "block" }}>Effets de second ordre</span>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1 }}>
            {[
              { label: "Adaptations des acteurs",   items: temporal_simulation.second_order.actor_adaptations,         color: "var(--purple)" },
              { label: "Comportements défensifs",   items: temporal_simulation.second_order.defensive_behaviors,       color: "var(--coral)" },
              { label: "Dérive organisationnelle",  items: temporal_simulation.second_order.organizational_drift,      color: "var(--red)" },
            ].map(({ label, items, color }) => (
              <div key={label} style={{ background: "var(--bg-surface)", padding: "1rem 1.25rem" }}>
                <span className="cpc-temporal-label" style={{ color }}>{label}</span>
                <ul className="cpc-temporal-list" style={{ marginTop: 8 }}>
                  {items.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>
            ))}
          </div>
          {temporal_simulation.second_order.cognitive_debt.length > 0 && (
            <div style={{ background: "var(--purple-dim)", padding: "1rem 1.25rem", marginTop: 1, borderRadius: "0 0 6px 6px" }}>
              <span className="cpc-temporal-label" style={{ color: "var(--purple)" }}>Dette cognitive & fatigue décisionnelle</span>
              <ul className="cpc-temporal-list" style={{ marginTop: 8 }}>
                {[...temporal_simulation.second_order.cognitive_debt, ...temporal_simulation.second_order.decisional_fatigue_signals]
                  .map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* ── 11. Recommendations ───────────────────────────── */}
      <div className="cpc-section">
        <div className="cpc-section-header">
          <span className="cpc-section-num">11</span>
          <h2 className="cpc-section-title">Recommandations</h2>
        </div>
        <div className="cpc-reco-list">
          {[...decision_recommendations].sort((a, b) => a.priority - b.priority).map((r, i) => (
            <div key={i} className="cpc-reco-row">
              <span className={`cpc-reco-priority cpc-reco-p${r.priority}`}>P{r.priority}</span>
              <div className="cpc-reco-body">
                <span className="cpc-reco-action">{r.action}</span>
                <div className="cpc-reco-meta">
                  <span className="cpc-tag">{r.target_bias.replace(/_/g, " ")}</span>
                  <span className="cpc-tag cpc-tag-timeline">{r.timeline.replace(/_/g, " ")}</span>
                  <span className="cpc-tag">{r.source_layer.replace(/_/g, " ")}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Meta footer ───────────────────────────────────── */}
      <div className="cpc-meta-footer">
        CPC v{meta.cpc_version} · {meta.processed_statement_count} statements · Pipeline : {meta.pipeline_executed.join(" → ")}
      </div>
    </div>
  );
}
