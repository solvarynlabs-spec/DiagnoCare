import type { CasePedagogy } from "@/lib/pedagogy/types";

/**
 * Clinical case domain model.
 *
 * A case's `CaseContent` is the single authoritative source of patient facts.
 * The conversation engine only ever receives the *patient-visible* projection of
 * it (see `toPatientBrief`), which never contains the diagnosis, so no engine —
 * scripted or LLM — can reveal or change it during a session.
 */

/** Consultation language. Arabic was removed; old "ar" sessions are read as French. */
export type Lang = "en" | "fr";
export const asLang = (v: string | null | undefined): Lang => (v === "en" ? "en" : "fr");
export type Localized = { en: string; fr?: string; ar?: string };
export type Difficulty = "EASY" | "MEDIUM" | "HARD";
export type Emotion = "neutral" | "anxious" | "pain" | "distressed" | "tired" | "relieved" | "irritated";

export interface Vitals {
  hr: number; // bpm
  sbp: number; // mmHg
  dbp: number;
  rr: number; // /min
  spo2: number; // %
  temp: number; // °C
  /** Per-minute drift applied by the monitor while the case is untreated. */
  trend?: Partial<Record<"hr" | "sbp" | "rr" | "spo2" | "temp", number>>;
}

export interface CaseContent {
  patient: {
    name: string;
    age: number;
    sex: "F" | "M";
    occupation: string;
    personality: string;
    baselineEmotion: Emotion;
    avatar: { skin: string; hair: string; hairStyle: "short" | "long" | "bald" | "child"; accessory?: "glasses" | "none" };
  };
  setting: string; // e.g. "Emergency department, 02:10"
  chiefComplaint: Localized; // the patient's opening line
  vitals: Vitals;
  /** Answers keyed by interview topic (see catalog/topics.ts). Missing topics fall back to a neutral answer. */
  interview: Record<string, Localized>;
  /** Emotion the patient displays when a topic is discussed. */
  topicEmotions?: Record<string, Emotion>;
  history: {
    pastMedical: string[];
    medications: string[];
    allergies: string[];
    family: string[];
    social: string[];
  };
  symptoms: string[];
  /** Physical exam findings keyed by exam code; others default to the catalog's normal finding. */
  exam: Record<string, { finding: string; abnormal: boolean }>;
  /** Investigation results keyed by code; others default to normal. */
  investigations: Record<string, { result: string; abnormal: boolean }>;
  /** Hidden from the patient engine. */
  answer: {
    diagnosis: string;
    acceptedTerms: string[]; // normalized synonyms accepted as correct
    differentials: { name: string; terms: string[] }[]; // must-consider differentials
    teachingPoints: string[];
  };
  rubric: CaseRubric;
  /** Display-only teaching metadata (sources, review, debrief) of the source-traceable draft cases. Never sent to the patient engine. */
  pedagogy?: CasePedagogy;
}

export interface CaseRubric {
  keyTopics: { topic: string; weight: number }[];
  essentialExams: string[];
  essentialInvestigations: string[];
  /** Investigations that are low-value or harmful here (penalised). */
  unnecessaryInvestigations: string[];
  management: {
    options: { code: string; label: string; kind: "essential" | "appropriate" | "contraindicated" | "neutral"; rationale: string }[];
  };
  /** Category weights out of 100. */
  weights: { history: number; exam: number; investigations: number; diagnosis: number; management: number };
}

export interface ScoreItem {
  label: string;
  achieved: boolean;
  points: number;
  max: number;
  note?: string;
}

export interface ScoreCategory {
  key: keyof CaseRubric["weights"];
  label: string;
  score: number;
  max: number;
  items: ScoreItem[];
}

export interface ScoreBreakdown {
  total: number;
  categories: ScoreCategory[];
  durationMinutes: number;
  questionsAsked: number;
}

export interface EducationalFeedback {
  summary: string;
  strengths: string[];
  improvements: string[];
  missedFindings: string[];
  reasoningComment: string;
  teachingPoints: string[];
  correctDiagnosis: string;
  disclaimer: string;
}

export const LANGS: { code: Lang; label: string; dir: "ltr" }[] = [
  { code: "fr", label: "Français", dir: "ltr" },
  { code: "en", label: "English", dir: "ltr" },
];

export function pickLocalized(value: Localized | undefined, lang: Lang): { text: string; translated: boolean } {
  if (!value) return { text: "", translated: true };
  const v = value[lang];
  if (v) return { text: v, translated: true };
  return { text: value.en, translated: lang === "en" };
}
