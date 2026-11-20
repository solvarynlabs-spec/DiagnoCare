import { parseJson } from "@/lib/db";
import { localizeCaseContent } from "@/lib/cases/i18n";
import type { UiLang } from "@/lib/i18n/shared";
import { rubricFeedback } from "./feedback";
import { scoreSession, type SessionEvidence } from "./scoring";
import { asLang, type CaseContent, type EducationalFeedback, type ScoreBreakdown } from "./types";

interface ReportInput {
  language: string;
  slug: string;
  topicsCovered: string;
  examinations: { code: string; kind: string }[];
  diagnosis: { differentials: string; finalDiagnosis: string; justification: string; managementActions: string } | null;
  result: { breakdown: string; feedback: string; feedbackSource: string };
}

/**
 * Score breakdown and feedback in the viewer's language. Scoring is deterministic, so the
 * breakdown is recomputed in that language from the stored evidence; it is only used when
 * it reproduces the stored total (otherwise the case rubric changed and the stored text wins).
 * An AI narrative written in another language is replaced by the rubric feedback.
 */
export function reportInLang(s: ReportInput, content: CaseContent, lang: UiLang): { score: ScoreBreakdown; feedback: EducationalFeedback; content: CaseContent } {
  const stored = parseJson<ScoreBreakdown>(s.result.breakdown, { total: 0, categories: [], durationMinutes: 0, questionsAsked: 0 });
  const storedFb = parseJson<EducationalFeedback>(s.result.feedback, {} as EducationalFeedback);
  const shown = localizeCaseContent(content, s.slug, lang);
  if (asLang(s.language) === lang || !s.diagnosis) return { score: stored, feedback: storedFb, content: shown };

  const ev: SessionEvidence = {
    topicsCovered: parseJson<string[]>(s.topicsCovered, []),
    exams: s.examinations.filter((e) => e.kind === "PHYSICAL").map((e) => e.code),
    investigations: s.examinations.filter((e) => e.kind === "INVESTIGATION").map((e) => e.code),
    differentials: parseJson<string[]>(s.diagnosis.differentials, []),
    finalDiagnosis: s.diagnosis.finalDiagnosis,
    justification: s.diagnosis.justification,
    managementActions: parseJson<string[]>(s.diagnosis.managementActions, []),
    durationMinutes: stored.durationMinutes,
    questionsAsked: stored.questionsAsked,
  };
  const score = scoreSession(shown, ev, lang);
  if (score.total !== stored.total) return { score: stored, feedback: storedFb, content: shown };
  return { score, feedback: rubricFeedback(shown, score, ev, lang), content: shown };
}
