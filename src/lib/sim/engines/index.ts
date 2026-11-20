import { anthropicEngine } from "./anthropic";
import { scriptedEngine } from "./scripted";
import { groqEngine } from "./groq";
import type { PatientEngine, PatientTurnInput, PatientTurnOutput } from "./types";

export type AiMode = "anthropic" | "groq" | "demo";

export function aiMode(): AiMode {
  const p = (process.env.AI_PROVIDER || "").toLowerCase();
  if (p === "demo") return "demo";
  if (p === "anthropic") return "anthropic";
  if (p === "groq") return "groq";
  if (process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN) return "anthropic";
  return process.env.GROQ_API_KEY ? "groq" : "demo";
}

export function engineFor(mode: AiMode): PatientEngine {
  return mode === "anthropic" ? anthropicEngine : mode === "groq" ? groqEngine : scriptedEngine;
}

/** Runs the configured engine; on LLM failure degrades to the scripted engine and says so. */
export async function patientRespond(mode: AiMode, input: PatientTurnInput): Promise<PatientTurnOutput> {
  try {
    return await engineFor(mode).respond(input);
  } catch (e) {
    if (mode === "demo") throw e;
    console.error("[patient-engine] AI call failed, falling back to scripted engine:", e);
    const out = await scriptedEngine.respond(input);
    return { ...out, note: "The AI service was unavailable for this turn; the scripted engine answered from the case facts." };
  }
}

export type { PatientTurnInput, PatientTurnOutput };
