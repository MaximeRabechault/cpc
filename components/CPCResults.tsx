"use client";

import type { CPCOutput, DetectedBias, AdversarialScenario } from "@/lib/types";

// ── Risk color helpers ────────────────────────────────────────

function riskClass(score: number): string {
  if (score >= 12) return "risk-critical";
  if (score >= 8) return "risk-high";
  if (score >= 4) return "risk-moderate";
  return "risk-low";
}

function riskLabel(score: number): string {
  if (score >= 12) return "CRITIQUE";
  if (score >= 8) return "ÉLEVÉ";
  if (score >= 4) return "MODÉRÉ";
  return "FAIBLE";
}

function vulnClass(level: string): string {
  const map: Record<string, string> = {
    critical: "risk-critical",
    high: "risk-high",
    moderate: "risk-moderate",
    low: "risk-low",
  };
  return map[level] ?? "risk-low";
}

function severityClass(s: string): string {
  const map: Record<string, string> = {
    critical: "risk-critical",
    high: "risk-high",
    moderate: "risk-moderate",
  };
  return map[s] ?? "risk-moderate";
}

// ── Bias row ──────────────────────────────────────────────────

function BiasRow({ bias, rank }: { bias: DetectedBias; rank?: number }) {
  return (
    <tr className="cpc-table-row">
      <td className="cpc-td cpc-td-index">{rank ?? bias.id}</td>
      <td className="cpc-td">
        <span className="cpc-bias-label">{bias.bias_label}</span>
        <span className="cpc-bias-statement">{bias.statement}</span>
      </td>
      <td className="cpc-td cpc-td-center">
        <span className="cpc-score-cell">{bias.probability}</span>
      </td>
      <td className="cpc-td cpc-td-center">
        <span className="cpc-score-cell">{bias.impact}</span>
      </td>
      <td className="cpc-td cpc-td-center">
        <span className={`cpc-risk-badge ${riskClass(bias.risk_score)}`}>
          {bias.risk_score} — {riskLabel(bias.risk_score)}
        </span>
      </td>
      <td className="cpc-td cpc-td-muted">
        {Math.round(bias.confidence * 100)}%
      </td>
    </tr>
  );
}

// ── Adversarial card ──────────────────────────────────────────

function AdversarialCard({ scenario }: { scenario: AdversarialScenario }) {
  return (
    <div className="cpc-adversarial-card">
      <div className="cpc-adversarial-header">
        <span className="cpc-adversarial-id">{String(scenario.id).padStart(2, "0")}</span>
        <span className={`cpc-risk-badge ${severityClass(scenario.severity)}`}>
          {scenario.severity.toUpperCase()}
        </span>
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
    cognitive_summary,
    biases,
    top_risks,
    adversarial_scenarios,
    temporal_simulation,
    decision_recommendations,
    meta,
  } = result;

  // Sort biases by risk_score desc for table
  const sortedBiases = [...biases].sort((a, b) => b.risk_score - a.risk_score);

  return (
    <div className="cpc-results">

      {/* ── Cognitive Summary ──────────────────────────────── */}
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
            <span className="cpc-summary-key">Angles morts détectés</span>
            <ul className="cpc-blindspot-list">
              {cognitive_summary.key_blind_spots.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ── Bias Map ───────────────────────────────────────── */}
      <div className="cpc-section">
        <div className="cpc-section-header">
          <span className="cpc-section-num">2</span>
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
                <th className="cpc-th">Biais / Verbatim source</th>
                <th className="cpc-th cpc-th-center">P</th>
                <th className="cpc-th cpc-th-center">I</th>
                <th className="cpc-th cpc-th-center">Score P×I</th>
                <th className="cpc-th">Conf.</th>
              </tr>
            </thead>
            <tbody>
              {sortedBiases.map((b, i) => (
                <BiasRow key={b.id} bias={b} rank={i + 1} />
              ))}
            </tbody>
          </table>
        </div>
        <p className="cpc-table-legend">
          P = Probabilité (1–4) · I = Impact (1–4) · Score = P × I
        </p>
      </div>

      {/* ── Risk Heatmap (top 5) ──────────────────────────── */}
      <div className="cpc-section">
        <div className="cpc-section-header">
          <span className="cpc-section-num">3</span>
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
                <span className={`cpc-risk-badge ${riskClass(r.risk_score)}`}>
                  {r.risk_score}
                </span>
                {bias && (
                  <span className="cpc-top-risk-confidence">
                    {Math.round(bias.confidence * 100)}%
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Adversarial Scenarios ─────────────────────────── */}
      <div className="cpc-section">
        <div className="cpc-section-header">
          <span className="cpc-section-num">4</span>
          <h2 className="cpc-section-title">Scénarios adversariaux</h2>
        </div>
        <div className="cpc-adversarial-grid">
          {adversarial_scenarios.map((s) => (
            <AdversarialCard key={s.id} scenario={s} />
          ))}
        </div>
      </div>

      {/* ── Temporal Simulation ───────────────────────────── */}
      <div className="cpc-section">
        <div className="cpc-section-header">
          <span className="cpc-section-num">5</span>
          <h2 className="cpc-section-title">
            Simulation temporelle
            <span className="cpc-horizon-badge">T+3 mois</span>
          </h2>
        </div>

        <div className="cpc-temporal-grid">
          {[
            {
              key: "unintended_consequences",
              label: "Conséquences non anticipées",
              items: temporal_simulation.unintended_consequences,
              color: "amber",
            },
            {
              key: "emergent_risks",
              label: "Risques émergents",
              items: temporal_simulation.emergent_risks,
              color: "red",
            },
            {
              key: "new_biases_introduced",
              label: "Nouveaux biais induits",
              items: temporal_simulation.new_biases_introduced,
              color: "purple",
            },
            {
              key: "degradation_effects",
              label: "Effets de dégradation systémique",
              items: temporal_simulation.degradation_effects,
              color: "coral",
            },
          ].map(({ key, label, items, color }) => (
            <div key={key} className={`cpc-temporal-card cpc-temporal-${color}`}>
              <span className="cpc-temporal-label">{label}</span>
              <ul className="cpc-temporal-list">
                {items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── Decision Recommendations ──────────────────────── */}
      <div className="cpc-section">
        <div className="cpc-section-header">
          <span className="cpc-section-num">6</span>
          <h2 className="cpc-section-title">Recommandations</h2>
        </div>

        <div className="cpc-reco-list">
          {[...decision_recommendations]
            .sort((a, b) => a.priority - b.priority)
            .map((r, i) => (
              <div key={i} className="cpc-reco-row">
                <span className={`cpc-reco-priority cpc-reco-p${r.priority}`}>
                  P{r.priority}
                </span>
                <div className="cpc-reco-body">
                  <span className="cpc-reco-action">{r.action}</span>
                  <div className="cpc-reco-meta">
                    <span className="cpc-tag">{r.target_bias.replace(/_/g, " ")}</span>
                    <span className="cpc-tag cpc-tag-timeline">{r.timeline.replace(/_/g, " ")}</span>
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
