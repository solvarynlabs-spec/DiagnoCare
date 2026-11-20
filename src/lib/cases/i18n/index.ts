import type { CaseContent } from "@/lib/sim/types";
import type { UiLang } from "@/lib/i18n/shared";
import { CASES_EN_A } from "./en-a";
import { CASES_EN_B } from "./en-b";
import type { CaseEn } from "./types";
import { DEMO_CASES } from "../demo-cases";
import { DRAFT_CASES, DRAFT_CASES_EN } from "../drafts";

/**
 * Case content is authored in French. For English, demo cases carry a full translation
 * (below); teacher-authored cases without one fall back to the French text.
 * Translation only changes display text — codes, rubric and scoring are untouched.
 */
const CASES_EN: Record<string, CaseEn> = { ...CASES_EN_A, ...CASES_EN_B, ...DRAFT_CASES_EN };

export const caseEn = (slug: string | null | undefined): CaseEn | undefined => (slug ? CASES_EN[slug] : undefined);
export const hasEnglish = (slug: string | null | undefined) => !!caseEn(slug);

interface MetaLike {
  slug: string;
  title: string;
  summary: string;
}

/** Title / summary / objectives in the interface language. */
export function localizeCaseMeta<M extends MetaLike>(row: M, lang: UiLang, objectives?: string[]): M & { objectivesLocalized: string[] } {
  const en = lang === "en" ? caseEn(row.slug) : undefined;
  return {
    ...row,
    title: en?.title ?? row.title,
    summary: en?.summary ?? row.summary,
    objectivesLocalized: en?.objectives ?? objectives ?? [],
  };
}

const pick = (arr: string[], enArr: string[] | undefined) => (enArr && enArr.length === arr.length ? enArr : arr);

/** Full case content with every display string in the interface language. */
export function localizeCaseContent(content: CaseContent, slug: string | null | undefined, lang: UiLang): CaseContent {
  if (lang !== "en") return content;
  const en = caseEn(slug);
  if (!en) return content;
  return {
    ...content,
    patient: { ...content.patient, name: en.patientName ?? content.patient.name, occupation: en.occupation, personality: en.personality },
    setting: en.setting,
    history: {
      pastMedical: pick(content.history.pastMedical, en.history.pastMedical),
      medications: pick(content.history.medications, en.history.medications),
      allergies: pick(content.history.allergies, en.history.allergies),
      family: pick(content.history.family, en.history.family),
      social: pick(content.history.social, en.history.social),
    },
    symptoms: pick(content.symptoms, en.symptoms),
    exam: Object.fromEntries(Object.entries(content.exam).map(([k, v]) => [k, { ...v, finding: en.exam[k] ?? v.finding }])),
    investigations: Object.fromEntries(Object.entries(content.investigations).map(([k, v]) => [k, { ...v, result: en.investigations[k] ?? v.result }])),
    answer: {
      ...content.answer,
      diagnosis: en.diagnosis,
      differentials: content.answer.differentials.map((d, i) => ({ ...d, name: en.differentials[i] ?? d.name })),
      teachingPoints: pick(content.answer.teachingPoints, en.teachingPoints),
    },
    rubric: {
      ...content.rubric,
      management: {
        ...content.rubric.management,
        options: content.rubric.management.options.map((o) => {
          const m = en.management[o.code];
          return m ? { ...o, label: m[0], rationale: m[1] } : o;
        }),
      },
    },
  };
}

let SYMPTOM_EN: Map<string, string> | null = null;
/** English name of a (French, lower-case) symptom from the demo cases; falls back to the input. */
export function symptomName(name: string, lang: UiLang): string {
  if (lang !== "en") return name;
  if (!SYMPTOM_EN) {
    SYMPTOM_EN = new Map();
    for (const c of [...DEMO_CASES, ...DRAFT_CASES]) {
      const en = caseEn(c.slug);
      if (en && en.symptoms.length === c.content.symptoms.length) c.content.symptoms.forEach((s, i) => SYMPTOM_EN!.set(s.toLowerCase().trim(), en.symptoms[i]));
    }
  }
  return SYMPTOM_EN.get(name.toLowerCase().trim()) ?? name;
}
