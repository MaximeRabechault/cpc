"use client";

import { useState, useCallback } from "react";
import type {
  AnalyzeRequest,
  AnalyzeResponse,
  AnalyzeErrorResponse,
  CPCOutput,
} from "@/lib/types";
import { CPCResults } from "@/components/CPCResults";

// ── Step types ────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4;

interface SessionState {
  decision: string;
  participants: string;
  context: string;
  verbatims: string[];
}

const EMPTY_SESSION: SessionState = {
  decision: "",
  participants: "",
  context: "",
  verbatims: ["", ""],
};

// ─────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────

export default function CPCPage() {
  const [step, setStep] = useState<Step>(1);
  const [session, setSession] = useState<SessionState>(EMPTY_SESSION);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CPCOutput | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [exported, setExported] = useState(false);

  // ── Verbatim helpers ────────────────────────────────────────

  const addVerbatim = () => {
    if (session.verbatims.length >= 10) return;
    setSession((s) => ({ ...s, verbatims: [...s.verbatims, ""] }));
  };

  const removeVerbatim = (i: number) => {
    if (session.verbatims.length <= 1) return;
    setSession((s) => ({
      ...s,
      verbatims: s.verbatims.filter((_, idx) => idx !== i),
    }));
  };

  const updateVerbatim = (i: number, val: string) => {
    setSession((s) => {
      const v = [...s.verbatims];
      v[i] = val;
      return { ...s, verbatims: v };
    });
  };

  // ── Step 1 validation ───────────────────────────────────────

  const canProceedStep1 =
    session.decision.trim().length >= 10 &&
    session.decision.trim().length <= 300;

  // ── Step 2 validation ───────────────────────────────────────

  const filledVerbatims = session.verbatims.filter((v) => v.trim().length > 0);
  const canAnalyze = filledVerbatims.length >= 1;

  // ── Analyze ─────────────────────────────────────────────────

  const runAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);

    const payload: AnalyzeRequest = {
      decision: session.decision.trim(),
      verbatims: filledVerbatims,
      participants: session.participants ? parseInt(session.participants) : undefined,
      context: session.context.trim() || undefined,
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
      setStep(3);
    } catch {
      setError("Erreur réseau — vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  }, [session, filledVerbatims]);

  // ── Export (stub — branché sur /api/export à l'étape C) ─────

  const handleExport = async () => {
    // TODO: POST to /api/export with result + session mapping to Sheets
    setExported(true);
    setStep(4);
  };

  // ── Reset ───────────────────────────────────────────────────

  const resetSession = () => {
    setStep(1);
    setSession(EMPTY_SESSION);
    setResult(null);
    setSessionId(null);
    setExported(false);
    setError(null);
  };

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────

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
            {[
              { n: 1, label: "Contexte" },
              { n: 2, label: "Verbatims" },
              { n: 3, label: "Analyse" },
              { n: 4, label: "Export" },
            ].map(({ n, label }) => (
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

      {/* Content */}
      <div className="cpc-body">

        {/* ── STEP 1 — Context ─────────────────────────────── */}
        {step === 1 && (
          <section className="cpc-panel">
            <div className="cpc-panel-header">
              <span className="cpc-panel-index">01</span>
              <h1 className="cpc-panel-title">Décision analysée</h1>
              <p className="cpc-panel-desc">
                Décrivez précisément la décision soumise à l'analyse cognitive.
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
                onChange={(e) =>
                  setSession((s) => ({ ...s, decision: e.target.value }))
                }
              />
              <span className="cpc-char-count">
                {session.decision.length} / 300
              </span>
            </div>

            <div className="cpc-row">
              <div className="cpc-field">
                <label className="cpc-label" htmlFor="participants">
                  Participants
                </label>
                <input
                  id="participants"
                  type="number"
                  min={1}
                  max={50}
                  className="cpc-input"
                  placeholder="Ex. : 6"
                  value={session.participants}
                  onChange={(e) =>
                    setSession((s) => ({ ...s, participants: e.target.value }))
                  }
                />
              </div>
              <div className="cpc-field cpc-field-grow">
                <label className="cpc-label" htmlFor="context">
                  Contexte (optionnel)
                </label>
                <input
                  id="context"
                  type="text"
                  className="cpc-input"
                  placeholder="Ex. : Startup SaaS B2B, Série A, équipe de 12"
                  value={session.context}
                  onChange={(e) =>
                    setSession((s) => ({ ...s, context: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="cpc-actions">
              <button
                className="cpc-btn-primary"
                disabled={!canProceedStep1}
                onClick={() => setStep(2)}
              >
                Continuer →
              </button>
            </div>
          </section>
        )}

        {/* ── STEP 2 — Verbatims ───────────────────────────── */}
        {step === 2 && (
          <section className="cpc-panel">
            <div className="cpc-panel-header">
              <span className="cpc-panel-index">02</span>
              <h1 className="cpc-panel-title">Verbatims participants</h1>
              <p className="cpc-panel-desc">
                Saisissez les prises de position brutes du groupe (1 à 10).
                <br />
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
                    rows={2}
                    maxLength={500}
                    placeholder={`Verbatim ${i + 1}…`}
                    value={v}
                    onChange={(e) => updateVerbatim(i, e.target.value)}
                  />
                  {session.verbatims.length > 1 && (
                    <button
                      className="cpc-btn-ghost cpc-remove"
                      onClick={() => removeVerbatim(i)}
                      aria-label="Supprimer"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="cpc-verbatims-footer">
              <button
                className="cpc-btn-ghost"
                disabled={session.verbatims.length >= 10}
                onClick={addVerbatim}
              >
                + Ajouter un verbatim{" "}
                <span className="cpc-count-hint">
                  ({session.verbatims.length}/10)
                </span>
              </button>
            </div>

            {error && <p className="cpc-error">{error}</p>}

            <div className="cpc-actions cpc-actions-split">
              <button
                className="cpc-btn-ghost"
                onClick={() => setStep(1)}
              >
                ← Retour
              </button>
              <button
                className="cpc-btn-primary"
                disabled={!canAnalyze || loading}
                onClick={runAnalysis}
              >
                {loading ? (
                  <span className="cpc-loading">
                    <span className="cpc-spinner" />
                    Analyse en cours…
                  </span>
                ) : (
                  `Lancer l'analyse CPC →`
                )}
              </button>
            </div>
          </section>
        )}

        {/* ── STEP 3 — Results ─────────────────────────────── */}
        {step === 3 && result && (
          <section className="cpc-results-section">
            <div className="cpc-results-header">
              <div>
                <span className="cpc-panel-index">03</span>
                <h1 className="cpc-panel-title">Résultats CPC</h1>
                <p className="cpc-panel-desc">
                  Vérifiez et validez les outputs avant export.
                  <br />
                  <span className="cpc-session-id">
                    Session : {sessionId}
                  </span>
                </p>
              </div>
              <div className="cpc-validate-banner">
                <span className="cpc-validate-icon">⚠</span>
                L'IA propose — vous validez avant tout export.
              </div>
            </div>

            <CPCResults result={result} />

            <div className="cpc-actions cpc-actions-split cpc-actions-results">
              <button className="cpc-btn-ghost" onClick={() => setStep(2)}>
                ← Modifier les verbatims
              </button>
              <button className="cpc-btn-primary" onClick={handleExport}>
                Exporter vers Google Sheets →
              </button>
            </div>
          </section>
        )}

        {/* ── STEP 4 — Export ──────────────────────────────── */}
        {step === 4 && (
          <section className="cpc-panel cpc-panel-export">
            <div className="cpc-export-success">
              <span className="cpc-export-check">✓</span>
              <h1 className="cpc-panel-title">Export confirmé</h1>
              <p className="cpc-panel-desc">
                La heatmap et la synthèse ont été mises à jour.
              </p>
            </div>

            <div className="cpc-export-links">
              <a
                href="#"
                className="cpc-btn-secondary"
                onClick={(e) => e.preventDefault()}
              >
                Ouvrir Google Sheets ↗
              </a>
              <button className="cpc-btn-ghost" onClick={resetSession}>
                Nouvelle session
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
