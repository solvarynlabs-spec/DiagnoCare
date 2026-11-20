/** Shared types for the source-traceable draft activities (cases and workshops). */

/** A display string in both interface languages. */
export interface Bi {
  fr: string;
  en: string;
}

/** A citation of one registry source for one specific use. */
export interface RefUse {
  /** Key of `SOURCES` in ./sources. */
  id: string;
  /** Section / chapter / recommendation the activity relies on. */
  section: Bi;
}

export interface ReviewMeta {
  /** "draft" until a clinical educator approves (cases: approval = PUBLISHED in the review workflow). */
  status: "draft" | "approved";
  version: string;
  reviewer: string | null;
  reviewDate: string | null;
  /** Points flagged "Requires clinical educator review" and kept out of the answer key. */
  pending: Bi[];
  /** Where local (Algerian teaching-hospital) protocol must be confirmed. */
  localProtocol?: Bi;
}

/** Rubric domains shared by every activity. */
export type Domain = "gathering" | "recognition" | "selection" | "reasoning" | "communication" | "safety" | "reflection";

export const DOMAIN_LABEL: Record<Domain, Bi> = {
  gathering: { fr: "Recueil d'informations", en: "Information gathering" },
  recognition: { fr: "Reconnaissance de l'urgence", en: "Recognising urgent findings" },
  selection: { fr: "Choix des examens", en: "Examination / investigation choice" },
  reasoning: { fr: "Interprétation et raisonnement", en: "Interpretation and reasoning" },
  communication: { fr: "Communication et transmission", en: "Communication and handover" },
  safety: { fr: "Sécurité, incertitude, escalade", en: "Safety, uncertainty, escalation" },
  reflection: { fr: "Réflexion après feedback", en: "Reflection after feedback" },
};

/** Extra, display-only block stored in a case's content JSON (`content.pedagogy`). */
export interface CasePedagogy {
  level: Bi;
  prerequisites: Bi[];
  tags: Bi[];
  /** Expected clinical reasoning, step by step. */
  reasoning: Bi[];
  mustNotMiss: Bi[];
  uncertainty: Bi;
  reflection: Bi[];
  /** How the rubric maps onto the shared domains. */
  rubricMap: { domain: Domain; how: Bi }[];
  /** Feedback shown in the debrief for correct / incomplete / unsafe approaches. */
  feedback: { correct: Bi; incomplete: Bi; unsafe: Bi };
  /** Sensitive content: shown before starting, with pause / exit in the room. */
  contentNotice?: Bi;
  /** Supportive debrief message for sensitive topics. */
  support?: Bi;
  refs: RefUse[];
  review: ReviewMeta;
}

export const DRAFT_LABEL: Bi = { fr: "Brouillon — relecture par un enseignant clinicien requise", en: "Draft — clinical educator review required" };
export const SIM_LABEL: Bi = { fr: "Simulation pédagogique fictive — patient et données synthétiques", en: "Fictional teaching simulation — synthetic patient and data" };
export const NOT_CERTIFYING: Bi = {
  fr: "Cet exercice sur écran ne certifie aucune compétence clinique et ne remplace pas la pratique supervisée sur mannequin ou en situation clinique.",
  en: "This screen-based exercise does not certify clinical competence and does not replace supervised practice on an appropriate model or in a clinical setting.",
};
export const REVIEW_TAG: Bi = { fr: "Requiert la relecture d'un enseignant clinicien", en: "Requires clinical educator review" };
