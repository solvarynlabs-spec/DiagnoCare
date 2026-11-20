import type { CaseContent, Lang } from "./types";
import { TOPICS } from "@/lib/catalog";

/**
 * The patient-visible projection of a case. It deliberately excludes the diagnosis,
 * differentials, rubric and investigation results: the patient engine cannot reveal
 * what it is never given, and cannot "drift" the correct answer during a session.
 */
export function toPatientBrief(c: CaseContent) {
  return {
    persona: c.patient,
    setting: c.setting,
    openingLine: c.chiefComplaint.en,
    facts: Object.fromEntries(
      TOPICS.map((t) => [
        t.key,
        c.interview[t.key]?.en ??
          `(Not specified in the case: answer plainly and negatively/neutrally, e.g. "${t.fallback.en}". Do not invent new symptoms.)`,
      ]),
    ),
    background: c.history,
  };
}

export const LANG_NAME: Record<Lang, string> = { en: "English", fr: "French" };
