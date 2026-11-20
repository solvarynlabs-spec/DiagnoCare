import type { CaseContent, Emotion, Lang } from "../types";

export interface PatientTurnInput {
  content: CaseContent;
  history: { role: "student" | "patient"; content: string }[];
  question: string;
  lang: Lang;
  effort?: "low" | "medium" | "high";
}

export interface PatientTurnOutput {
  reply: string;
  emotion: Emotion;
  topics: string[];
  engine: "anthropic" | "groq" | "demo";
  note?: string;
}

/** Any patient engine (scripted, LLM, future voice/3D-driven) implements this. */
export interface PatientEngine {
  id: "anthropic" | "groq" | "demo";
  respond(input: PatientTurnInput): Promise<PatientTurnOutput>;
}
