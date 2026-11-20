/**
 * Builder for the source-traceable draft cases. Each case is authored once with French and
 * English side by side; `buildCase` produces the French case content (stored in the database)
 * and the English overlay used by the interface language switch, so the two cannot drift.
 */
import type { CaseContent, Difficulty, Emotion, Vitals } from "@/lib/sim/types";
import type { DemoCase } from "../demo-cases";
import type { CaseEn } from "../i18n/types";
import type { Bi, CasePedagogy } from "@/lib/pedagogy/types";

type Kind = "essential" | "appropriate" | "contraindicated" | "neutral";

export interface DraftDef {
  slug: string;
  specialty: string;
  difficulty: Difficulty;
  minutes: number;
  title: Bi;
  summary: Bi;
  objectives: Bi[];
  patient: { name: string; nameEn?: string; age: number; sex: "F" | "M"; occupation: Bi; personality: Bi; baselineEmotion: Emotion; avatar: CaseContent["patient"]["avatar"] };
  setting: Bi;
  complaint: Bi;
  vitals: Vitals;
  interview: Record<string, Bi>;
  topicEmotions?: Record<string, Emotion>;
  history: { pastMedical: Bi[]; medications: Bi[]; allergies: Bi[]; family: Bi[]; social: Bi[] };
  symptoms: Bi[];
  exam: Record<string, [Bi, boolean]>;
  investigations: Record<string, [Bi, boolean]>;
  diagnosis: Bi;
  acceptedTerms: string[];
  differentials: { name: Bi; terms: string[] }[];
  teaching: Bi[];
  rubric: {
    keyTopics: { topic: string; weight: number }[];
    essentialExams: string[];
    essentialInvestigations: string[];
    unnecessaryInvestigations: string[];
    options: { code: string; label: Bi; kind: Kind; rationale: Bi }[];
    weights: CaseContent["rubric"]["weights"];
  };
  pedagogy: CasePedagogy;
}

const fr = (b: Bi) => b.fr;
const en = (b: Bi) => b.en;
const mapRec = <T, U>(r: Record<string, T>, f: (v: T) => U) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, f(v)]));

export function buildCase(d: DraftDef): { demo: DemoCase; en: CaseEn } {
  const content: CaseContent = {
    patient: { name: d.patient.name, age: d.patient.age, sex: d.patient.sex, occupation: fr(d.patient.occupation), personality: fr(d.patient.personality), baselineEmotion: d.patient.baselineEmotion, avatar: d.patient.avatar },
    setting: fr(d.setting),
    chiefComplaint: { en: d.complaint.en, fr: d.complaint.fr },
    vitals: d.vitals,
    interview: mapRec(d.interview, (b) => ({ en: b.en, fr: b.fr })),
    ...(d.topicEmotions ? { topicEmotions: d.topicEmotions } : {}),
    history: { pastMedical: d.history.pastMedical.map(fr), medications: d.history.medications.map(fr), allergies: d.history.allergies.map(fr), family: d.history.family.map(fr), social: d.history.social.map(fr) },
    symptoms: d.symptoms.map((s) => s.fr.toLowerCase()),
    exam: mapRec(d.exam, ([b, abnormal]) => ({ finding: b.fr, abnormal })),
    investigations: mapRec(d.investigations, ([b, abnormal]) => ({ result: b.fr, abnormal })),
    answer: { diagnosis: d.diagnosis.fr, acceptedTerms: d.acceptedTerms, differentials: d.differentials.map((x) => ({ name: x.name.fr, terms: x.terms })), teachingPoints: d.teaching.map(fr) },
    rubric: {
      keyTopics: d.rubric.keyTopics,
      essentialExams: d.rubric.essentialExams,
      essentialInvestigations: d.rubric.essentialInvestigations,
      unnecessaryInvestigations: d.rubric.unnecessaryInvestigations,
      management: { options: d.rubric.options.map((o) => ({ code: o.code, label: o.label.fr, kind: o.kind, rationale: o.rationale.fr })) },
      weights: d.rubric.weights,
    },
    pedagogy: d.pedagogy,
  };
  return {
    demo: { slug: d.slug, title: d.title.fr, specialty: d.specialty, difficulty: d.difficulty, summary: d.summary.fr, objectives: d.objectives.map(fr), minutes: d.minutes, freeTier: false, content },
    en: {
      ...(d.patient.nameEn ? { patientName: d.patient.nameEn } : {}),
      title: d.title.en,
      summary: d.summary.en,
      objectives: d.objectives.map(en),
      occupation: d.patient.occupation.en,
      personality: d.patient.personality.en,
      setting: d.setting.en,
      history: { pastMedical: d.history.pastMedical.map(en), medications: d.history.medications.map(en), allergies: d.history.allergies.map(en), family: d.history.family.map(en), social: d.history.social.map(en) },
      symptoms: d.symptoms.map(en),
      exam: mapRec(d.exam, ([b]) => b.en),
      investigations: mapRec(d.investigations, ([b]) => b.en),
      diagnosis: d.diagnosis.en,
      differentials: d.differentials.map((x) => x.name.en),
      teachingPoints: d.teaching.map(en),
      management: Object.fromEntries(d.rubric.options.map((o) => [o.code, [o.label.en, o.rationale.en] as [string, string]])),
    },
  };
}

/** Bilingual pair. */
export const b = (frText: string, enText: string): Bi => ({ fr: frText, en: enText });

export const W = (history: number, exam: number, investigations: number, diagnosis: number, management: number) => ({ history, exam, investigations, diagnosis, management });

/** How the five scored categories map onto the shared rubric domains (identical for every draft case). */
export const STANDARD_RUBRIC_MAP: CasePedagogy["rubricMap"] = [
  { domain: "gathering", how: b("Recueil d'informations → « Interrogatoire » : chaque thème clé posé rapporte des points, pondérés selon son importance.", "Information gathering → 'History': each key topic asked earns points, weighted by importance.") },
  { domain: "selection", how: b("Choix des examens → « Examen clinique » et « Examens complémentaires » : gestes et examens essentiels récompensés ; examens inutiles ou nuisibles pénalisés.", "Examination / investigation choice → 'Examination' and 'Investigations': essential steps rewarded; unnecessary or harmful tests penalised.") },
  { domain: "reasoning", how: b("Interprétation et raisonnement → « Diagnostic » : hypothèse principale ET diagnostics différentiels raisonnables ; une formulation prudente est acceptée.", "Interpretation and reasoning → 'Diagnosis': working diagnosis AND reasonable differentials; a cautious formulation is accepted.") },
  { domain: "safety", how: b("Sécurité, incertitude, escalade → « Prise en charge » : l'escalade, la surveillance et la transmission sont des actions essentielles ; les choix dangereux retirent des points.", "Safety, uncertainty, escalation → 'Management': escalation, monitoring and handover are essential actions; unsafe choices cost points.") },
  { domain: "communication", how: b("Communication et transmission → actions « transmission structurée » et « explication au patient / à l'entourage » de la prise en charge.", "Communication and handover → the 'structured handover' and 'explaining to the patient / family' management actions.") },
  { domain: "reflection", how: b("Réflexion après feedback → questions de réflexion du débriefing (non notées) ; refaites le cas pour mesurer vos progrès.", "Reflection after feedback → the debrief's reflection questions (not scored); redo the case to track progress.") },
];

export const DRAFT_REVIEW = (pending: Bi[], localProtocol?: Bi): CasePedagogy["review"] => ({ status: "draft", version: "0.1-brouillon", reviewer: null, reviewDate: null, pending, localProtocol });

export const LOCAL_PROTOCOL = (what: Bi): Bi =>
  b(`Les recommandations varient selon le pays et l'établissement. À confirmer par un enseignant clinicien selon le protocole local du CHU : ${what.fr}.`, `Guidance differs by country and institution. To be confirmed by a clinical educator against the local teaching-hospital protocol: ${what.en}.`);
