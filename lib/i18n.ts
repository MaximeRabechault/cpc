// ─────────────────────────────────────────────────────────────
// lib/i18n.ts — Translations FR / EN
// ─────────────────────────────────────────────────────────────

export type Lang = "fr" | "en";

export const t = {
  fr: {
    // Header
    subtitle: "Cognitive Premortem Copilot",

    // Steps
    step1: "Décision",
    step2: "Prémortem",
    step3: "Verbatims",
    step4: "Analyse",
    step5: "Export",

    // Step 1
    s1_index: "01",
    s1_title: "Décision analysée",
    s1_desc: "Décrivez la décision soumise à l'analyse cognitive.",
    s1_label_decision: "Décision",
    s1_label_participants: "Participants",
    s1_label_context: "Contexte (optionnel)",
    s1_placeholder_decision: "Ex. : Lancer le produit en Q3 sans validation utilisateur supplémentaire",
    s1_placeholder_participants: "Ex. : 6",
    s1_placeholder_context: "Ex. : Startup SaaS B2B, Série A, équipe de 12",
    s1_cta: "Continuer →",

    // Step 2
    s2_index: "02",
    s2_title: "Cadrage prémortem",
    s2_desc: "Avant de saisir les verbatims, lisez ce cadrage à voix haute à l'ensemble du groupe.",
    s2_instruction_label: "Instructions pour le groupe",
    s2_text_1: "Nous sommes en",
    s2_text_2: ". La décision a été prise.",
    s2_text_3: "Le projet a échoué.",
    s2_text_4: "Partant de ce constat, chaque participant va décrire en 2 à 3 phrases ce qui s'est passé. Pas de questions, pas de discussions — uniquement des projections individuelles et silencieuses.",
    s2_text_5: "Répondez à :",
    s2_text_6: "\"Qu'est-ce qui a conduit à cet échec ?\"",
    s2_horizon_label: "Horizon temporel :",
    s2_back: "← Retour",
    s2_cta: "Le groupe est prêt →",

    // Step 3
    s3_index: "03",
    s3_title: "Projections d'échec",
    s3_desc: "Saisissez les verbatims individuels (1 à 10).",
    s3_decision_prefix: "Décision : ",
    s3_placeholder: (i: number) => `Projection ${i} — "Ce qui s'est passé, c'est que…"`,
    s3_add: "+ Ajouter une projection",
    s3_back: "← Retour",
    s3_cta: "Lancer l'analyse CPC →",
    s3_loading: "Analyse en cours…",

    // Step 4
    s4_index: "04",
    s4_title: "Résultats CPC",
    s4_desc: "Vérifiez et validez les outputs avant export.",
    s4_session: "Session : ",
    s4_banner: "L'IA propose — vous validez avant tout export.",
    s4_back: "← Modifier les verbatims",
    s4_cta: "Exporter vers Google Sheets →",

    // Step 5
    s5_title: "Export confirmé",
    s5_desc: "La heatmap et la synthèse ont été mises à jour.",
    s5_open: "Ouvrir Google Sheets ↗",
    s5_new: "Nouvelle session",

    // Errors
    err_network: "Erreur réseau — vérifiez votre connexion.",
    err_export: "Erreur lors de l'export — réessayez.",
  },

  en: {
    // Header
    subtitle: "Cognitive Premortem Copilot",

    // Steps
    step1: "Decision",
    step2: "Premortem",
    step3: "Verbatims",
    step4: "Analysis",
    step5: "Export",

    // Step 1
    s1_index: "01",
    s1_title: "Decision under analysis",
    s1_desc: "Describe the decision submitted for cognitive analysis.",
    s1_label_decision: "Decision",
    s1_label_participants: "Participants",
    s1_label_context: "Context (optional)",
    s1_placeholder_decision: "E.g.: Launch the product in Q3 without additional user validation",
    s1_placeholder_participants: "E.g.: 6",
    s1_placeholder_context: "E.g.: B2B SaaS startup, Series A, team of 12",
    s1_cta: "Continue →",

    // Step 2
    s2_index: "02",
    s2_title: "Premortem framing",
    s2_desc: "Before entering verbatims, read this framing aloud to the entire group.",
    s2_instruction_label: "Instructions for the group",
    s2_text_1: "We are in",
    s2_text_2: ". The decision has been made.",
    s2_text_3: "The project has failed.",
    s2_text_4: "From this premise, each participant will describe in 2 to 3 sentences what happened. No questions, no discussion — only individual, silent projections.",
    s2_text_5: "Answer:",
    s2_text_6: "\"What led to this failure?\"",
    s2_horizon_label: "Time horizon:",
    s2_back: "← Back",
    s2_cta: "The group is ready →",

    // Step 3
    s3_index: "03",
    s3_title: "Failure projections",
    s3_desc: "Enter individual verbatims (1 to 10).",
    s3_decision_prefix: "Decision: ",
    s3_placeholder: (i: number) => `Projection ${i} — "What happened was…"`,
    s3_add: "+ Add a projection",
    s3_back: "← Back",
    s3_cta: "Run CPC analysis →",
    s3_loading: "Analysis in progress…",

    // Step 4
    s4_index: "04",
    s4_title: "CPC Results",
    s4_desc: "Review and validate the outputs before export.",
    s4_session: "Session: ",
    s4_banner: "AI proposes — you validate before any export.",
    s4_back: "← Edit verbatims",
    s4_cta: "Export to Google Sheets →",

    // Step 5
    s5_title: "Export confirmed",
    s5_desc: "The heatmap and synthesis have been updated.",
    s5_open: "Open Google Sheets ↗",
    s5_new: "New session",

    // Errors
    err_network: "Network error — please check your connection.",
    err_export: "Export error — please try again.",
  },
} as const;

export type Translations = typeof t.fr;
