/** English overlay for one case. Codes (exam, investigation, management) match the case content. */
export interface CaseEn {
  title: string;
  /** Only when the French name carries a note, e.g. « (avec sa mère, …) ». */
  patientName?: string;
  summary: string;
  objectives: string[];
  occupation: string;
  personality: string;
  setting: string;
  history: { pastMedical: string[]; medications: string[]; allergies: string[]; family: string[]; social: string[] };
  symptoms: string[];
  exam: Record<string, string>;
  investigations: Record<string, string>;
  diagnosis: string;
  /** Same order as `answer.differentials`. */
  differentials: string[];
  teachingPoints: string[];
  /** code → [label, rationale] */
  management: Record<string, [string, string]>;
}
