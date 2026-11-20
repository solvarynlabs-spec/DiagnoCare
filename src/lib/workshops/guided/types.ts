/**
 * Data model of the guided, source-traceable workshops. One generic engine
 * (components/workshops/guided.tsx) renders every workshop from this data: numbered steps,
 * a scenario panel, student actions (select, sequence, examine, compose), immediate
 * explanatory feedback, and a result screen with a transparent rubric, debrief and references.
 */
import type { Bi, Domain, RefUse, ReviewMeta } from "@/lib/pedagogy/types";

export interface SceneVitals {
  hr?: number;
  sbp?: number;
  dbp?: number;
  rr?: number;
  spo2?: number;
  temp?: number;
  /** Free text, e.g. AVPU or capillary refill. */
  extra?: Bi;
}

/** What the scenario panel shows during a step. */
export interface Scene {
  text?: Bi;
  vitals?: SceneVitals;
  /** Built-in diagrams (schematic, non-diagnostic). */
  diagram?: "abdomen" | "cxr" | "abg";
  /** Values for the ABG card. */
  abg?: { ph: string; paco2: string; hco3: string; pao2?: string; context: Bi };
  /** Tone of the status cue (also stated in words, never colour alone). */
  alert?: "stable" | "worse" | "critical" | "better";
}

interface Base {
  id: string;
  title: Bi;
  prompt: Bi;
  scene?: Scene;
  domain: Domain;
  points: number;
}

export interface ChoiceStep extends Base {
  kind: "choice";
  multi?: boolean;
  options: { id: string; label: Bi; correct: boolean; feedback: Bi }[];
}

export interface SequenceStep extends Base {
  kind: "sequence";
  /** Listed in the CORRECT order; the engine shuffles them deterministically. */
  items: { id: string; label: Bi }[];
  explain: Bi;
}

export interface ActionsStep extends Base {
  kind: "actions";
  actions: {
    id: string;
    label: Bi;
    finding: Bi;
    required: boolean;
    /** Region of the diagram this action belongs to (abdomen / cxr). */
    region?: string;
    /** Must be done within the first `urgentBy` actions, otherwise flagged as delayed. */
    urgent?: boolean;
    /** Shown when the action is not useful at this stage. */
    note?: Bi;
  }[];
  /** Required actions must follow their listed order (e.g. A→B→C→D→E). Half the points. */
  ordered?: boolean;
  urgentBy?: number;
  /** Explains why order / delay matters. */
  explain: Bi;
}

export interface ComposeStep extends Base {
  kind: "compose";
  fields: {
    id: string;
    label: Bi;
    hint: Bi;
    /** Accent-insensitive keyword groups; the field earns its share when ANY group fully matches. */
    expect: string[][];
    model: Bi;
  }[];
}

export type GuidedStep = ChoiceStep | SequenceStep | ActionsStep | ComposeStep;

export interface GuidedWorkshop {
  slug: string;
  icon: "abcde" | "bls" | "neuro" | "abg" | "cxr" | "abdo" | "hands" | "sbar";
  title: Bi;
  sub: Bi;
  minutes: number;
  level: Bi;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  tags: Bi[];
  prerequisites: Bi[];
  objectives: Bi[];
  /** Short scenario introduction shown before step 1. */
  intro: Bi;
  steps: GuidedStep[];
  debrief: { keyPoints: Bi[]; reflection: Bi[] };
  /** Hands-on skill: shows the "does not replace supervised practice" notice. */
  handsOn?: boolean;
  refs: RefUse[];
  review: ReviewMeta;
}
