"use client";

import { useState, useCallback } from "react";
import type {
  AnalyzeRequest,
  AnalyzeResponse,
  AnalyzeErrorResponse,
  CPCOutput,
} from "@/lib/types";
import { CPCResults } from "@/components/CPCResults";

type Step = 1 | 2 | 3 | 4 | 5;

// Horizons temporels disponibles
const HORIZONS = ["3 mois", "6 mois", "12 mois", "18 mois"];

interface SessionState {
  decision: string;
  participants: string;
  context: string;
  horizon: string;
  verbatims: string[];
}

const EMPTY_SESSION: SessionState = {
  decision: "",
  participants: "",
  context: "",
  horizon: "6 mois",
  verbatims: ["", ""],
};

// Calcule la date projetée
function projectedDate(horizon: string): string {
  const now = new Date();
  const months = parseInt(horizon);
  now.setMonth(now.getMonth() + months);
  return now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

export default function CPCPage() {
  const [step, setStep] = useState<Step>(1);
  const [session, setSession] = useState<SessionState>(EMPTY_SESSION);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CPCOutput | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // ── Verbatims ───────────────────────────────────────────────
  const addVerbatim = () => {
    if (session.verbatims.length >= 10) return;
    setSession((s) => ({ ...s, verbatims: [...s.verbatims, ""] }));
  };
  const removeVerbatim = (i: number) => {
    if (session.verbatims.length <= 1) return;
    setSession((s) => ({ ...s, verbatims: s.verbatims.filter((_, idx) => idx !== i) }));
  };
  const updateVerbatim = (i: number, val: string) => {
    setSession((s) => {
      const v = [...s.verbatims];
      v[i] = val;
      return { ...s, verbatims: v };
    });
  };

  const canProceedStep1 = session.decision.trim().length >= 10 && session.decision.trim().length <= 300;
  const filledVerbatims = session.verbatims.filter((v) => v.trim().length > 0);
  const canAnalyze = filledVerbatims.length >= 1;

  // ── Analyse ─────────────────────────────────────────────────
  const runAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Injecter le cadrage prémortem dans le contexte
    const premortContext = `CADRAGE PRÉMORTEM : Cette analyse part du principe que la décision a déjà été prise et que le projet a échoué à l'horizon ${session.horizon}. Les verbatims ci-dessous sont des projections d'échec rédigées depuis ce futur hypothétique. ${session.context ? `Contexte additionnel : ${session.context}` : ""}`.trim();

    const payload: AnalyzeRequest = {
      decision: session.decision.trim(),
      verbatims: filledVerbatims,
      participants: session.participants ? parseInt(session.participants) : undefined,
      context: premortContext,
    };

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data: AnalyzeResponse | AnalyzeErrorResponse = await res.json();
      if (!data.ok) {
        setError((data as AnalyzeErrorResponse).error);
        setLoading(false);
        return;
      }
      setResult((data as AnalyzeResponse).result);
      setSessionId((data as AnalyzeResponse).session_id);
      setStep(4);
    } catch {
      setError("Erreur réseau — vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  }, [session, filledVerbatims]);

  // ── Export ───────────────────────────────────────────────────
  const handleExport = async () => {
    if (!result || !sessionId) return;
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ok: true,
          session_id: sessionId,
          timestamp: new Date().toISOString(),
          decision: session.decision,
          result,
        }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error); return; }
      setStep(5);
    } catch {
      setError("Erreur lors de l'export — réessayez.");
    }
  };

  const resetSession = () => {
    setStep(1);
    setSession(EMPTY_SESSION);
    setResult(null);
    setSessionId(null);
    setError(null);
  };

  // ── Steps nav labels ─────────────────────────────────────────
  const stepLabels = [
    { n: 1, label: "Décision" },
    { n: 2, label: "Prémortem" },
    { n: 3, label: "Verbatims" },
    { n: 4, label: "Analyse" },
    { n: 5, label: "Export" },
  ];

  return (
    <main className="cpc-root">
      {/* Header */}
      <header className="cpc-header">
        <div className="cpc-header-inner">
          <div className="cpc-logo">
            <span className="cpc-logo-mark">CPC</span>
            <span className="cpc-logo-sub">Cognitive Premortem Copilot</span>
          </div>
          <nav className="cpc-steps-nav">
            {stepLabels.map(({ n, label }) => (
              <div
                key={n}
                className={`cpc-step-dot ${step === n ? "active" : ""} ${step > n ? "done" : ""}`}
              >
                <span className="cpc-step-num">{step > n ? "✓" : n}</span>
                <span className="cpc-step-label">{label}</span>
              </div>
            ))}
          </nav>
        </div>
      </header>

      <div className="cpc-body">

        {/* ── STEP 1 — Décision ────────────────────────────── */}
        {step === 1 && (
          <section className="cpc-panel">
            <div className="cpc-panel-header">
              <span className="cpc-panel-index">01</span>
              <h1 className="cpc-panel-title">Décision analysée</h1>
              <p className="cpc-panel-desc">
                Décrivez la décision soumise à l'analyse cognitive.
              </p>
            </div>

            <div className="cpc-field">
              <label className="cpc-label" htmlFor="decision">
                Décision <span className="cpc-required">*</span>
              </label>
              <textarea
                id="decision"
                className="cpc-textarea"
                rows={3}
                maxLength={300}
                placeholder="Ex. : Lancer le produit en Q3 sans validation utilisateur supplémentaire"
                value={session.decision}
                onChange={(e) => setSession((s) => ({ ...s, decision: e.target.value }))}
              />
              <span className="cpc-char-count">{session.decision.length} / 300</span>
            </div>

            <div className="cpc-row">
              <div className="cpc-field">
                <label className="cpc-label" htmlFor="participants">Participants</label>
                <input
                  id="participants" type="number" min={1} max={50}
                  className="cpc-input" placeholder="Ex. : 6"
                  value={session.participants}
                  onChange={(e) => setSession((s) => ({ ...s, participants: e.target.value }))}
                />
              </div>
              <div className="cpc-field cpc-field-grow">
                <label className="cpc-label" htmlFor="context">Contexte (optionnel)</label>
                <input
                  id="context" type="text" className="cpc-input"
                  placeholder="Ex. : Startup SaaS B2B, Série A, équipe de 12"
                  value={session.context}
                  onChange={(e) => setSession((s) => ({ ...s, context: e.target.value }))}
                />
              </div>
            </div>

            <div className="cpc-actions">
              <button className="cpc-btn-primary" disabled={!canProceedStep1} onClick={() => setStep(2)}>
                Continuer →
              </button>
            </div>
          </section>
        )}

        {/* ── STEP 2 — Cadrage prémortem ───────────────────── */}
        {step === 2 && (
          <section className="cpc-panel">
            <div className="cpc-panel-header">
              <span className="cpc-panel-index">02</span>
              <h1 className="cpc-panel-title">Cadrage prémortem</h1>
              <p className="cpc-panel-desc">
                Avant de saisir les verbatims, lisez ce cadrage à voix haute à l'ensemble du groupe.
              </p>
            </div>

            <div className="cpc-premortem-box">
              <span className="cpc-premortem-label">Instructions pour le groupe</span>
              <p className="cpc-premortem-text">
                Nous sommes en <strong>{projectedDate(session.horizon)}</strong>. La décision a été prise.
                <br /><br />
                <strong>Le projet a échoué.</strong>
                <br /><br />
                Partant de ce constat, chaque participant va décrire en 2 à 3 phrases ce qui s'est passé.
                Pas de questions, pas de discussions — uniquement des projections individuelles et silencieuses.
                <br /><br />
                Répondez à : <strong>"Qu'est-ce qui a conduit à cet échec ?"</strong>
              </p>
              <div className="cpc-horizon-row">
                <span className="cpc-horizon-label">Horizon temporel :</span>
                <select
                  className="cpc-horizon-select"
                  value={session.horizon}
                  onChange={(e) => setSession((s) => ({ ...s, horizon: e.target.value }))}
                >
                  {HORIZONS.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="cpc-actions cpc-actions-split">
              <button className="cpc-btn-ghost" onClick={() => setStep(1)}>← Retour</button>
              <button className="cpc-btn-primary" onClick={() => setStep(3)}>
                Le groupe est prêt →
              </button>
            </div>
          </section>
        )}

        {/* ── STEP 3 — Verbatims ───────────────────────────── */}
        {step === 3 && (
          <section className="cpc-panel">
            <div className="cpc-panel-header">
              <span className="cpc-panel-index">03</span>
              <h1 className="cpc-panel-title">Projections d'échec</h1>
              <p className="cpc-panel-desc">
                Saisissez les verbatims individuels (1 à 10).<br />
                <span className="cpc-panel-decision">
                  Décision : {session.decision}
                </span>
              </p>
            </div>

            <div className="cpc-verbatims-list">
              {session.verbatims.map((v, i) => (
                <div key={i} className="cpc-verbatim-row">
                  <span className="cpc-verbatim-index">{i + 1}</span>
                  <textarea
                    className="cpc-textarea cpc-verbatim-input"
                    rows={2} maxLength={500}
                    placeholder={`Projection ${i + 1} — "Ce qui s'est passé, c'est que…"`}
                    value={v}
                    onChange={(e) => updateVerbatim(i, e.target.value)}
                  />
                  {session.verbatims.length > 1 && (
                    <button className="cpc-btn-ghost cpc-remove" onClick={() => removeVerbatim(i)} aria-label="Supprimer">×</button>
                  )}
                </div>
              ))}
            </div>

            <div className="cpc-verbatims-footer">
              <button className="cpc-btn-ghost" disabled={session.verbatims.length >= 10} onClick={addVerbatim}>
                + Ajouter une projection{" "}
                <span className="cpc-count-hint">({session.verbatims.length}/10)</span>
              </button>
            </div>

            {error && <p className="cpc-error">{error}</p>}

            <div className="cpc-actions cpc-actions-split">
              <button className="cpc-btn-ghost" onClick={() => setStep(2)}>← Retour</button>
              <button className="cpc-btn-primary" disabled={!canAnalyze || loading} onClick={runAnalysis}>
                {loading ? (
                  <span className="cpc-loading">
                    <span className="cpc-spinner" />
                    Analyse en cours…
                  </span>
                ) : "Lancer l'analyse CPC →"}
              </button>
            </div>
          </section>
        )}

        {/* ── STEP 4 — Résultats ───────────────────────────── */}
        {step === 4 && result && (
          <section className="cpc-results-section">
            <div className="cpc-results-header">
              <div>
                <span className="cpc-panel-index">04</span>
                <h1 className="cpc-panel-title">Résultats CPC</h1>
                <p className="cpc-panel-desc">
                  Vérifiez et validez les outputs avant export.<br />
                  <span className="cpc-session-id">Session : {sessionId}</span>
                </p>
              </div>
              <div className="cpc-validate-banner">
                <span>⚠</span>
                L'IA propose — vous validez avant tout export.
              </div>
            </div>

            <CPCResults result={result} />

            {error && <p className="cpc-error" style={{ marginTop: "1rem" }}>{error}</p>}

            <div className="cpc-actions cpc-actions-split cpc-actions-results">
              <button className="cpc-btn-ghost" onClick={() => setStep(3)}>← Modifier les verbatims</button>
              <button className="cpc-btn-primary" onClick={handleExport}>
                Exporter vers Google Sheets →
              </button>
            </div>
          </section>
        )}

        {/* ── STEP 5 — Export confirmé ─────────────────────── */}
        {step === 5 && (
          <section className="cpc-panel cpc-panel-export">
            <div className="cpc-export-success">
              <span className="cpc-export-check">✓</span>
              <h1 className="cpc-panel-title">Export confirmé</h1>
              <p className="cpc-panel-desc">La heatmap et la synthèse ont été mises à jour.</p>
            </div>
            <div className="cpc-export-links">
              <a href="#" className="cpc-btn-secondary" onClick={(e) => e.preventDefault()}>
                Ouvrir Google Sheets ↗
              </a>
              <button className="cpc-btn-ghost" onClick={resetSession}>Nouvelle session</button>
            </div>
          </section>
        )}

      </div>
    </main>
  );
}
