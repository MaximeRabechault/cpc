// ─────────────────────────────────────────────────────────────
// /api/analyze — CPC Cognitive Engine
//
// Vercel Serverless Function (Next.js App Router)
// Runtime : Node.js (Edge-compatible with minor changes)
// Method  : POST
// Auth    : None (prototype — add bearer token for production)
//
// Flow:
//   1. Validate request
//   2. Build GPT messages (system prompt + user context)
//   3. Call OpenAI gpt-4o
//   4. Parse + validate JSON response
//   5. Return typed AnalyzeResponse
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { CPC_SYSTEM_PROMPT, CPC_VERSION, buildUserMessage } from "@/lib/cpc-prompt";
import type {
  AnalyzeRequest,
  AnalyzeResponse,
  AnalyzeErrorResponse,
  CPCOutput,
} from "@/lib/types";

// ── Constants ────────────────────────────────────────────────

const MAX_VERBATIMS = 10;
const MAX_VERBATIM_LENGTH = 500;
const MAX_DECISION_LENGTH = 300;
const OPENAI_MODEL = "gpt-4o";
const OPENAI_MAX_TOKENS = 4096;
const OPENAI_TEMPERATURE = 0.3;   // Low for reproducibility

// ── Client (singleton) ───────────────────────────────────────

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ── Handler ──────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // 1. Parse body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return error("INVALID_INPUT", "Request body must be valid JSON");
  }

  // 2. Validate input
  const validation = validateRequest(body);
  if (!validation.ok) {
    return error(validation.code, validation.message);
  }

  const { decision, verbatims, participants, context } =
    validation.data as AnalyzeRequest;

  // 3. Generate session ID
  const session_id =
    (validation.data as AnalyzeRequest).session_id ??
    `cpc_${new Date().toISOString().slice(0, 10).replace(/-/g, "")}_${Math.random()
      .toString(36)
      .slice(2, 7)}`;

  // 4. Build messages
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: CPC_SYSTEM_PROMPT,
    },
    {
      role: "user",
      content: buildUserMessage({ decision, verbatims, participants, context }),
    },
  ];

  // 5. Call OpenAI
  let rawContent: string;
  try {
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages,
      max_tokens: OPENAI_MAX_TOKENS,
      temperature: OPENAI_TEMPERATURE,
      response_format: { type: "json_object" }, // Enforce JSON mode
    });

    rawContent = completion.choices[0]?.message?.content ?? "";

    if (!rawContent) {
      return error("OPENAI_ERROR", "Empty response from OpenAI");
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown OpenAI error";
    console.error("[CPC] OpenAI call failed:", msg);
    return error("OPENAI_ERROR", msg);
  }

  // 6. Parse JSON
  let parsed: CPCOutput;
  try {
    parsed = JSON.parse(rawContent) as CPCOutput;
  } catch {
    console.error("[CPC] JSON parse failed. Raw content:", rawContent.slice(0, 500));
    return error("PARSE_ERROR", "GPT returned malformed JSON", rawContent.slice(0, 300));
  }

  // 7. Validate pipeline completeness
  const pipelineCheck = validatePipelineOutput(parsed);
  if (!pipelineCheck.ok) {
    return error("PIPELINE_INCOMPLETE", pipelineCheck.message);
  }

  // 8. Stamp version (ensure it matches even if GPT hallucinates a different one)
  parsed.meta.cpc_version = CPC_VERSION;

  // 9. Return
  const response: AnalyzeResponse = {
    ok: true,
    session_id,
    timestamp: new Date().toISOString(),
    decision,
    result: parsed,
  };

  return NextResponse.json(response, { status: 200 });
}

// ── Input validation ─────────────────────────────────────────

function validateRequest(body: unknown):
  | { ok: true; data: AnalyzeRequest }
  | { ok: false; code: AnalyzeErrorResponse["code"]; message: string } {

  if (typeof body !== "object" || body === null) {
    return { ok: false, code: "INVALID_INPUT", message: "Body must be an object" };
  }

  const b = body as Record<string, unknown>;

  // decision
  if (!b.decision || typeof b.decision !== "string" || !b.decision.trim()) {
    return { ok: false, code: "INVALID_INPUT", message: "Field 'decision' is required" };
  }
  if (b.decision.length > MAX_DECISION_LENGTH) {
    return {
      ok: false,
      code: "INVALID_INPUT",
      message: `Field 'decision' must be under ${MAX_DECISION_LENGTH} characters`,
    };
  }

  // verbatims
  if (!Array.isArray(b.verbatims) || b.verbatims.length === 0) {
    return { ok: false, code: "INVALID_INPUT", message: "Field 'verbatims' must be a non-empty array" };
  }
  if (b.verbatims.length > MAX_VERBATIMS) {
    return { ok: false, code: "TOO_MANY_VERBATIMS", message: `Maximum ${MAX_VERBATIMS} verbatims allowed` };
  }
  for (let i = 0; i < b.verbatims.length; i++) {
    if (typeof b.verbatims[i] !== "string" || !b.verbatims[i].trim()) {
      return { ok: false, code: "INVALID_INPUT", message: `verbatims[${i}] must be a non-empty string` };
    }
    if ((b.verbatims[i] as string).length > MAX_VERBATIM_LENGTH) {
      return {
        ok: false,
        code: "VERBATIM_TOO_LONG",
        message: `verbatims[${i}] exceeds ${MAX_VERBATIM_LENGTH} characters`,
      };
    }
  }

  // optional fields
  const participants =
    typeof b.participants === "number" && b.participants > 0
      ? Math.floor(b.participants)
      : undefined;
  const context =
    typeof b.context === "string" && b.context.trim() ? b.context.trim() : undefined;
  const session_id =
    typeof b.session_id === "string" && b.session_id.trim()
      ? b.session_id.trim()
      : undefined;

  return {
    ok: true,
    data: {
      decision: b.decision.trim(),
      verbatims: (b.verbatims as string[]).map((v) => v.trim()),
      participants,
      context,
      session_id,
    },
  };
}

// ── Pipeline output validation ────────────────────────────────

function validatePipelineOutput(output: CPCOutput):
  | { ok: true }
  | { ok: false; message: string } {

  const required = [
    ["meta", "object"],
    ["cognitive_summary", "object"],
    ["cleaned_statements", "array"],
    ["biases", "array"],
    ["top_risks", "array"],
    ["adversarial_scenarios", "array"],
    ["temporal_simulation", "object"],
    ["decision_recommendations", "array"],
  ] as const;

  for (const [field, type] of required) {
    const val = (output as unknown as Record<string, unknown>)[field];
    if (type === "array" && !Array.isArray(val)) {
      return { ok: false, message: `Output missing or invalid field: '${field}'` };
    }
    if (type === "object" && (typeof val !== "object" || val === null || Array.isArray(val))) {
      return { ok: false, message: `Output missing or invalid field: '${field}'` };
    }
  }

  if (!output.biases.length) {
    return { ok: false, message: "Pipeline returned zero biases — likely a truncated response" };
  }

  return { ok: true };
}

// ── Error helper ─────────────────────────────────────────────

function error(
  code: AnalyzeErrorResponse["code"],
  message: string,
  details?: string
) {
  const body: AnalyzeErrorResponse = { ok: false, error: message, code, details };
  const status = code === "INVALID_INPUT" || code === "TOO_MANY_VERBATIMS" || code === "VERBATIM_TOO_LONG"
    ? 400
    : code === "OPENAI_ERROR"
    ? 502
    : 500;
  return NextResponse.json(body, { status });
}
