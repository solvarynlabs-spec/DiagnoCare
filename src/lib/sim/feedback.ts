import { examName, investigationName } from "@/lib/catalog";
import { anthropicClient, anthropicModel } from "./engines/anthropic";
import { groqChat } from "./engines/groq";
import type { CaseContent, EducationalFeedback, ScoreBreakdown } from "./types";
import type { SessionEvidence } from "./scoring";

export const FEEDBACK_DISCLAIMER =
  "Feedback pédagogique produit uniquement pour l'entraînement par simulation. La note suit la grille d'évaluation explicite du cas ; le commentaire narratif est assisté par IA et n'a pas été validé médicalement de façon indépendante. Il ne constitue pas une recommandation clinique pour de vrais patients.";
export const FEEDBACK_DISCLAIMER_EN =
  "Educational feedback produced for simulation training only. The score follows the case's explicit rubric; the narrative comment is AI-assisted and has not been independently medically validated. It is not clinical advice for real patients.";

/** Rubric-derived feedback (always available, no external calls). */
export function rubricFeedback(c: CaseContent, score: ScoreBreakdown, ev: SessionEvidence, lang: "fr" | "en" = "fr"): EducationalFeedback {
  const t = (fr: string, en: string) => (lang === "en" ? en : fr);
  const strengths: string[] = [];
  const improvements: string[] = [];
  for (const cat of score.categories) {
    const pct = cat.max ? cat.score / cat.max : 0;
    const hit = cat.items.filter((i) => i.achieved).map((i) => i.label);
    const miss = cat.items.filter((i) => !i.achieved && i.max > 0).map((i) => i.label);
    const unsafe = cat.items.filter((i) => i.points < 0).map((i) => i.label);
    if (pct >= 0.75 && hit.length) strengths.push(`${cat.label}: ${hit.slice(0, 3).join("; ")}.`);
    if (miss.length) improvements.push(`${cat.label}: ${miss.slice(0, 3).join("; ")}.`);
    for (const u of unsafe) improvements.push(`${u} — ${t("revoyez pourquoi ce choix est inapproprié ici.", "review why this choice is inappropriate here.")}`);
  }
  const missedFindings = [
    ...Object.entries(c.exam).filter(([code, f]) => f.abnormal && !ev.exams.includes(code)).map(([code, f]) => `${examName(code, lang)}: ${f.finding}`),
    ...c.rubric.essentialInvestigations.filter((code) => !ev.investigations.includes(code)).map((code) => `${investigationName(code, lang)}: ${c.investigations[code]?.result ?? "normal"}`),
  ].slice(0, 6);

  const diag = score.categories.find((x) => x.key === "diagnosis");
  const correct = diag?.items[0]?.achieved;
  return {
    summary: t(
      `Vous avez obtenu ${score.total}/100 en ${score.durationMinutes} min avec ${score.questionsAsked} questions. ${correct ? "Votre diagnostic final est correct." : "Votre diagnostic final ne correspond pas au diagnostic du cas."}`,
      `You scored ${score.total}/100 in ${score.durationMinutes} min with ${score.questionsAsked} questions. ${correct ? "Your final diagnosis is correct." : "Your final diagnosis does not match the case diagnosis."}`,
    ),
    strengths: strengths.length ? strengths : [t("Vous avez mené la consultation jusqu'au bout.", "You saw the consultation through to the end.")],
    improvements,
    missedFindings,
    reasoningComment: correct
      ? t("Votre diagnostic correspond au cas. Comparez vos diagnostics différentiels avec ceux à évoquer obligatoirement pour consolider votre raisonnement.", "Your diagnosis matches the case. Compare your differentials with the ones that must be considered to strengthen your reasoning.")
      : t(`Le diagnostic attendu était : ${c.answer.diagnosis}. Reprenez les éléments clés qui y orientaient.`, `The expected diagnosis was: ${c.answer.diagnosis}. Go back over the key findings that pointed to it.`),
    teachingPoints: c.answer.teachingPoints,
    correctDiagnosis: c.answer.diagnosis,
    disclaimer: lang === "en" ? FEEDBACK_DISCLAIMER_EN : FEEDBACK_DISCLAIMER,
  };
}

const NARRATIVE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "strengths", "improvements", "reasoningComment"],
  properties: {
    summary: { type: "string" },
    strengths: { type: "array", items: { type: "string" } },
    improvements: { type: "array", items: { type: "string" } },
    reasoningComment: { type: "string" },
  },
};

/**
 * Optional AI narrative layered on top of the rubric feedback. The model receives the
 * already-computed scores and may not change them; it only explains them.
 */
export async function aiNarrative(
  c: CaseContent,
  score: ScoreBreakdown,
  ev: SessionEvidence,
  transcript: { role: string; content: string }[],
  lang: string,
  effort: "low" | "medium" | "high" = "medium",
  provider: "anthropic" | "groq" = "anthropic",
): Promise<Pick<EducationalFeedback, "summary" | "strengths" | "improvements" | "reasoningComment">> {
  const prompt = `You are a clinical educator writing formative feedback for a medical student after a SIMULATED consultation with a fictional virtual patient.

Rules:
- The scores below were computed from an expert-authored rubric. Do NOT change, re-score or contradict them; explain them.
- Be specific: cite what the student asked or did (from the transcript and actions), what they missed, and why it matters clinically.
- Be encouraging but honest. Address the student formally as "vous" when writing in French.
- 3-5 strengths and 3-6 improvements, each one sentence. Summary: 2-3 sentences. reasoningComment: 3-5 sentences on their diagnostic reasoning (differentials, justification, safety).
- Write in ${lang === "en" ? "English" : "French (as used in Algerian medical faculties)"}.
- The student trains in Algeria: when relevant, reflect Algerian practice context (CHU, SAMU, availability of exams) without contradicting the case.

CASE (authoritative): ${JSON.stringify({ setting: c.setting, diagnosis: c.answer.diagnosis, mustConsider: c.answer.differentials.map((d) => d.name), teachingPoints: c.answer.teachingPoints, abnormalExam: c.exam, keyResults: c.investigations })}

STUDENT ACTIONS: ${JSON.stringify({ examsPerformed: ev.exams, investigationsRequested: ev.investigations, differentials: ev.differentials, finalDiagnosis: ev.finalDiagnosis, justification: ev.justification, management: ev.managementActions.map((code) => c.rubric.management.options.find((o) => o.code === code)?.label ?? code) })}

RUBRIC SCORE: ${JSON.stringify(score)}

TRANSCRIPT:
${transcript.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n").slice(0, 30000)}`;

  if (provider === "groq") {
    const text = await groqChat(
      [
        { role: "system", content: 'Respond with ONE JSON object only: {"summary": string, "strengths": string[], "improvements": string[], "reasoningComment": string}.' },
        { role: "user", content: prompt },
      ],
      { maxTokens: 6000, temperature: 0.4, reasoning: effort },
    );
    const j = JSON.parse(text);
    if (typeof j.summary !== "string" || !Array.isArray(j.strengths) || !Array.isArray(j.improvements)) throw new Error("Feedback Groq incomplet");
    return { summary: j.summary, strengths: j.strengths.map(String), improvements: j.improvements.map(String), reasoningComment: String(j.reasoningComment ?? "") };
  }

  const response = await anthropicClient().beta.messages.create({
    model: anthropicModel(),
    max_tokens: 8000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort, format: { type: "json_schema", schema: NARRATIVE_SCHEMA } },
    messages: [{ role: "user", content: prompt }],
  });
  if (response.stop_reason === "refusal") throw new Error("Model declined the request");
  const text = response.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
  return JSON.parse(text);
}
