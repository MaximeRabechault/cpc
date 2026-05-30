"use client";

import { useState, useCallback } from "react";
import type {
  AnalyzeRequest,
  AnalyzeResponse,
  AnalyzeErrorResponse,
  CPCOutput,
} from "@/lib/types";
import { CPCResults } from "@/components/CPCResults";
import { t, type Lang } from "@/lib/i18n";

type Step = 1 | 2 | 3 | 4 | 5;
const HORIZONS_FR = ["3 mois", "6 mois", "12 mois", "18 mois"];
const HORIZONS_EN = ["3 months", "6 months", "12 months", "18 months"];

interface SessionState {
  decision: string; participants: string; context: string;
  horizon: string; verbatims: string[];
}
const emptySession = (lang: Lang): SessionState => ({
  decision: "", participants: "", context: "",
  horizon: lang === "fr" ? "6 mois" : "6 months", verbatims: ["", ""],
});
function projectedDate(horizon: string, lang: Lang): string {
  const now = new Date(); now.setMonth(now.getMonth() + parseInt(horizon));
  return now.toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB", { month: "long", year: "numeric" });
}

function UnrestLogo({ height = 26 }: { height?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={height*(253/78)} height={height} viewBox="0 0 253 78" fill="none" aria-label="UNREST">
      <path d="M 57.283 0.27 C 57.283 0.27 43.295 24.132 31.824 39.401 C 20.797 54.079 0 77.733 0 77.733 C 0 77.733 16.375 53.073 27.846 37.804 C 38.873 23.126 57.283 0.27 57.283 0.27 Z M 50.123 21.033 C 50.123 21.033 45.949 29.024 40.976 36.627 C 48.36 44.403 62.824 68.901 62.852 68.949 C 62.812 68.904 45.405 48.887 38.208 40.998 C 38.162 40.949 38.12 40.898 38.079 40.848 C 37.848 41.168 37.624 41.487 37.393 41.797 C 37.28 41.95 37.159 42.1 37.04 42.26 C 44.413 50.029 58.079 72.942 58.079 72.942 C 58.079 72.942 41.32 54.459 33.864 46.285 C 27.13 54.526 17.503 64.956 17.503 64.956 C 17.503 64.956 25.451 50.385 31.824 41.797 C 37.95 33.539 50.123 21.033 50.123 21.033 Z M 39.78 14.645 C 39.78 14.645 30.718 30.176 23.868 39.401 C 17.28 48.27 4.774 61.762 4.774 61.762 C 4.774 61.762 14.162 46.465 20.686 37.005 C 27.846 26.624 39.78 14.645 39.78 14.645 Z M 212.425 14.366 C 216.438 14.111 222.713 17.53 222.767 17.561 L 219.585 20.755 C 219.539 20.739 215.356 19.158 212.425 19.158 C 210.038 19.158 206.586 19.685 206.855 22.352 C 207.108 24.853 210.015 24.857 212.425 25.547 C 217.994 27.144 223.563 27.144 223.563 34.331 C 223.563 39.522 217.577 41.071 212.425 41.518 C 207.842 41.918 201.34 37.562 201.286 37.525 L 204.469 34.331 C 204.513 34.363 209.105 37.803 212.425 37.525 C 215.193 37.294 218.525 37.107 218.789 34.331 C 219.068 31.402 215.206 31.268 212.425 30.338 C 207.651 28.741 202.082 27.466 202.082 22.352 C 202.082 17.238 207.339 14.69 212.425 14.366 Z M 77.969 31.935 C 77.975 31.974 78.786 37.525 85.129 37.525 C 91.478 37.525 92.286 31.961 92.289 31.935 L 92.289 15.165 L 97.063 15.165 L 97.063 32.734 C 97.066 32.78 97.825 41.518 85.129 41.518 C 72.426 41.518 73.192 32.771 73.195 32.734 L 73.195 15.165 L 77.969 15.165 Z M 127.296 33.532 L 127.296 14.366 L 132.069 14.366 L 132.069 41.518 L 127.296 41.518 L 112.179 22.352 L 112.179 41.518 L 107.406 41.518 L 107.406 14.366 L 112.179 14.366 Z M 157.528 14.366 C 157.589 14.373 164.689 15.2 164.689 23.151 C 164.689 31.1 158.381 31.137 158.324 31.137 L 166.28 41.518 L 159.915 41.518 L 152.755 31.137 L 147.186 31.137 L 147.186 41.518 L 142.412 41.518 L 142.412 14.366 Z M 194.921 19.158 L 179.009 19.158 L 179.009 26.345 L 193.33 26.345 L 193.33 30.338 L 179.009 30.338 L 179.009 37.525 L 194.921 37.525 L 194.921 41.518 L 173.44 41.518 L 173.44 14.366 L 194.921 14.366 Z M 253 19.158 L 242.657 19.158 L 242.657 41.518 L 237.884 41.518 L 237.884 19.158 L 228.336 19.158 L 228.336 14.366 L 253 14.366 Z M 147.186 27.942 L 155.142 27.942 C 155.189 27.934 159.915 27.125 159.915 23.151 C 159.915 19.179 155.191 18.367 155.142 18.359 L 147.186 18.359 Z" fill="white"/>
      <text x="73" y="61.5" fontFamily="'Lato', Arial, sans-serif" fontStyle="italic" fontSize="12" fontWeight="300" letterSpacing="0.8" fill="white">Change Fitness Studio</text>
    </svg>
  );
}

function LangToggle({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <div className="cpc-lang-toggle">
      <button className={`cpc-lang-btn ${lang === "fr" ? "active" : ""}`} onClick={() => setLang("fr")}>FR</button>
      <span className="cpc-lang-sep">|</span>
      <button className={`cpc-lang-btn ${lang === "en" ? "active" : ""}`} onClick={() => setLang("en")}>EN</button>
    </div>
  );
}

export default function CPCPage() {
  const [lang, setLang] = useState<Lang>("fr");
  const [step, setStep] = useState<Step>(1);
  const [session, setSession] = useState<SessionState>(emptySession("fr"));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CPCOutput | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const tr = t[lang];
  const horizons = lang === "fr" ? HORIZONS_FR : HORIZONS_EN;

  const handleLangSwitch = (l: Lang) => {
    setLang(l);
    setSession((s) => ({ ...s, horizon: l === "fr" ? "6 mois" : "6 months" }));
  };
  const addVerbatim = () => { if (session.verbatims.length >= 10) return; setSession((s) => ({ ...s, verbatims: [...s.verbatims, ""] })); };
  const removeVerbatim = (i: number) => { if (session.verbatims.length <= 1) return; setSession((s) => ({ ...s, verbatims: s.verbatims.filter((_, idx) => idx !== i) })); };
  const updateVerbatim = (i: number, val: string) => { setSession((s) => { const v = [...s.verbatims]; v[i] = val; return { ...s, verbatims: v }; }); };
  const canProceedStep1 = session.decision.trim().length >= 10 && session.decision.trim().length <= 300;
  const filledVerbatims = session.verbatims.filter((v) => v.trim().length > 0);
  const canAnalyze = filledVerbatims.length >= 1;

  const runAnalysis = useCallback(async () => {
    setLoading(true); setError(null);
    const premortContext = lang === "fr"
      ? `CADRAGE PRÉMORTEM : Cette analyse part du principe que la décision a déjà été prise et que le projet a échoué à l'horizon ${session.horizon}. Les verbatims ci-dessous sont des projections d'échec. ${session.context ? `Contexte : ${session.context}` : ""}`.trim()
      : `PREMORTEM FRAMING: The decision has been made and the project has failed at ${session.horizon}. Verbatims are failure projections. ${session.context ? `Context: ${session.context}` : ""}`.trim();
    const payload: AnalyzeRequest = {
      decision: session.decision.trim(), verbatims: filledVerbatims,
      participants: session.participants ? parseInt(session.participants) : undefined,
      context: premortContext,
    };
    try {
      const res = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data: AnalyzeResponse | AnalyzeErrorResponse = await res.json();
      if (!data.ok) { setError((data as AnalyzeErrorResponse).error); setLoading(false); return; }
      setResult((data as AnalyzeResponse).result); setSessionId((data as AnalyzeResponse).session_id); setStep(4);
    } catch { setError(tr.err_network); } finally { setLoading(false); }
  }, [session, filledVerbatims, lang, tr]);

  const handleExport = async () => {
    if (!result || !sessionId) return;
    try {
      const res = await fetch("/api/export", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ok: true, session_id: sessionId, timestamp: new Date().toISOString(), decision: session.decision, result }) });
      const data = await res.json();
      if (!data.ok) { setError(data.error); return; }
      setStep(5);
    } catch { setError(tr.err_export); }
  };

  const resetSession = () => { setStep(1); setSession(emptySession(lang)); setResult(null); setSessionId(null); setError(null); };
  const stepLabels = [{ n: 1, label: tr.step1 }, { n: 2, label: tr.step2 }, { n: 3, label: tr.step3 }, { n: 4, label: tr.step4 }, { n: 5, label: tr.step5 }];

  return (
    <main className="cpc-root">
      <header className="cpc-header">
        <div className="cpc-header-inner">
          <div className="cpc-logo">
            <UnrestLogo height={26} />
            <span className="cpc-logo-sep">·</span>
            <span className="cpc-logo-mark">CPC</span>
            <span className="cpc-logo-sub">{tr.subtitle}</span>
          </div>
          <div className="cpc-header-right">
            <nav className="cpc-steps-nav">
              {stepLabels.map(({ n, label }) => (
                <div key={n} className={`cpc-step-dot ${step === n ? "active" : ""} ${step > n ? "done" : ""}`}>
                  <span className="cpc-step-num">{step > n ? "✓" : n}</span>
                  <span className="cpc-step-label">{label}</span>
                </div>
              ))}
            </nav>
            <LangToggle lang={lang} setLang={handleLangSwitch} />
          </div>
        </div>
      </header>

      <div className="cpc-body">
        {step === 1 && (
          <section className="cpc-panel">
            <div className="cpc-panel-header">
              <span className="cpc-panel-index">{tr.s1_index}</span>
              <h1 className="cpc-panel-title">{tr.s1_title}</h1>
              <p className="cpc-panel-desc">{tr.s1_desc}</p>
            </div>
            <div className="cpc-field">
              <label className="cpc-label" htmlFor="decision">{tr.s1_label_decision} <span className="cpc-required">*</span></label>
              <textarea id="decision" className="cpc-textarea" rows={3} maxLength={300} placeholder={tr.s1_placeholder_decision} value={session.decision} onChange={(e) => setSession((s) => ({ ...s, decision: e.target.value }))} />
              <span className="cpc-char-count">{session.decision.length} / 300</span>
            </div>
            <div className="cpc-row">
              <div className="cpc-field">
                <label className="cpc-label" htmlFor="participants">{tr.s1_label_participants}</label>
                <input id="participants" type="number" min={1} max={50} className="cpc-input" placeholder={tr.s1_placeholder_participants} value={session.participants} onChange={(e) => setSession((s) => ({ ...s, participants: e.target.value }))} />
              </div>
              <div className="cpc-field cpc-field-grow">
                <label className="cpc-label" htmlFor="context">{tr.s1_label_context}</label>
                <input id="context" type="text" className="cpc-input" placeholder={tr.s1_placeholder_context} value={session.context} onChange={(e) => setSession((s) => ({ ...s, context: e.target.value }))} />
              </div>
            </div>
            <div className="cpc-actions">
              <button className="cpc-btn-primary" disabled={!canProceedStep1} onClick={() => setStep(2)}>{tr.s1_cta}</button>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="cpc-panel">
            <div className="cpc-panel-header">
              <span className="cpc-panel-index">{tr.s2_index}</span>
              <h1 className="cpc-panel-title">{tr.s2_title}</h1>
              <p className="cpc-panel-desc">{tr.s2_desc}</p>
            </div>
            <div className="cpc-premortem-box">
              <span className="cpc-premortem-label">{tr.s2_instruction_label}</span>
              <p className="cpc-premortem-text">
                {tr.s2_text_1} <strong>{projectedDate(session.horizon, lang)}</strong>{tr.s2_text_2}
                <br /><br /><strong>{tr.s2_text_3}</strong><br /><br />
                {tr.s2_text_4}<br /><br />
                {tr.s2_text_5} <strong>{tr.s2_text_6}</strong>
              </p>
              <div className="cpc-horizon-row">
                <span className="cpc-horizon-label">{tr.s2_horizon_label}</span>
                <select className="cpc-horizon-select" value={session.horizon} onChange={(e) => setSession((s) => ({ ...s, horizon: e.target.value }))}>
                  {horizons.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            </div>
            <div className="cpc-actions cpc-actions-split">
              <button className="cpc-btn-ghost" onClick={() => { setStep(1); setError(null); }}>{tr.s2_back}</button>
              <button className="cpc-btn-primary" onClick={() => setStep(3)}>{tr.s2_cta}</button>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="cpc-panel">
            <div className="cpc-panel-header">
              <span className="cpc-panel-index">{tr.s3_index}</span>
              <h1 className="cpc-panel-title">{tr.s3_title}</h1>
              <p className="cpc-panel-desc">{tr.s3_desc}<br /><span className="cpc-panel-decision">{tr.s3_decision_prefix}{session.decision}</span></p>
            </div>
            <div className="cpc-verbatims-list">
              {session.verbatims.map((v, i) => (
                <div key={i} className="cpc-verbatim-row">
                  <span className="cpc-verbatim-index">{i + 1}</span>
                  <textarea className="cpc-textarea cpc-verbatim-input" rows={2} maxLength={500} placeholder={tr.s3_placeholder(i + 1)} value={v} onChange={(e) => updateVerbatim(i, e.target.value)} />
                  {session.verbatims.length > 1 && <button className="cpc-btn-ghost cpc-remove" onClick={() => removeVerbatim(i)} aria-label="Remove">×</button>}
                </div>
              ))}
            </div>
            <div className="cpc-verbatims-footer">
              <button className="cpc-btn-ghost" disabled={session.verbatims.length >= 10} onClick={addVerbatim}>
                {tr.s3_add} <span className="cpc-count-hint">({session.verbatims.length}/10)</span>
              </button>
            </div>
            {error && <p className="cpc-error">{error}</p>}
            <div className="cpc-actions cpc-actions-split">
              <button className="cpc-btn-ghost" onClick={() => { setStep(2); setError(null); }}>{tr.s3_back}</button>
              <button className="cpc-btn-primary" disabled={!canAnalyze || loading} onClick={runAnalysis}>
                {loading ? <span className="cpc-loading"><span className="cpc-spinner" />{tr.s3_loading}</span> : tr.s3_cta}
              </button>
            </div>
          </section>
        )}

        {step === 4 && result && (
          <section className="cpc-results-section">
            <div className="cpc-results-header">
              <div>
                <span className="cpc-panel-index">{tr.s4_index}</span>
                <h1 className="cpc-panel-title">{tr.s4_title}</h1>
                <p className="cpc-panel-desc">{tr.s4_desc}<br /><span className="cpc-session-id">{tr.s4_session}{sessionId}</span></p>
              </div>
              <div className="cpc-validate-banner"><span>⚠</span>{tr.s4_banner}</div>
            </div>
            <CPCResults result={result} />
            {error && <p className="cpc-error" style={{ marginTop: "1rem" }}>{error}</p>}
            <div className="cpc-actions cpc-actions-split cpc-actions-results">
              <button className="cpc-btn-ghost" onClick={() => { setStep(3); setError(null); }}>{tr.s4_back}</button>
              <button className="cpc-btn-primary" onClick={handleExport}>{tr.s4_cta}</button>
            </div>
          </section>
        )}

        {step === 5 && (
          <section className="cpc-panel cpc-panel-export">
            <div className="cpc-export-success">
              <span className="cpc-export-check">✓</span>
              <h1 className="cpc-panel-title">{tr.s5_title}</h1>
              <p className="cpc-panel-desc">{tr.s5_desc}</p>
            </div>
            <div className="cpc-export-links">
              <button className="cpc-btn-secondary" onClick={() => window.location.href = "https://docs.google.com/spreadsheets/d/11qWh1u3cRfGY2eoSqTRdkHpAcIWwuEhu/edit"}>{tr.s5_open}</button>
              <button className="cpc-btn-ghost" onClick={resetSession}>{tr.s5_new}</button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
