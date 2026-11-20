import { z } from "zod";
import { INVESTIGATIONS, PHYSICAL_EXAMS, SPECIALTIES, TOPICS } from "@/lib/catalog";

const str = (max = 2000) => z.string().trim().max(max);
const localized = z.object({ en: str().min(1), fr: str().optional(), ar: str().optional() });
const emotion = z.enum(["neutral", "anxious", "pain", "distressed", "tired", "relieved", "irritated"]);
const topicKeys = TOPICS.map((t) => t.key) as [string, ...string[]];
const examCodes = PHYSICAL_EXAMS.map((e) => e.code) as [string, ...string[]];
const invCodes = INVESTIGATIONS.map((e) => e.code) as [string, ...string[]];

export const CaseContentSchema = z.object({
  patient: z.object({
    name: str(120).min(1),
    age: z.number().int().min(0).max(110),
    sex: z.enum(["F", "M"]),
    occupation: str(120),
    personality: str(1000),
    baselineEmotion: emotion,
    avatar: z.object({ skin: str(20), hair: str(20), hairStyle: z.enum(["short", "long", "bald", "child"]), accessory: z.enum(["glasses", "none"]).optional() }),
  }),
  setting: str(200),
  chiefComplaint: localized,
  vitals: z.object({
    hr: z.number().min(20).max(250),
    sbp: z.number().min(40).max(260),
    dbp: z.number().min(20).max(160),
    rr: z.number().min(4).max(80),
    spo2: z.number().min(50).max(100),
    temp: z.number().min(30).max(43),
    trend: z.record(z.number()).optional(),
  }),
  interview: z.record(z.enum(topicKeys), localized),
  topicEmotions: z.record(z.enum(topicKeys), emotion).optional(),
  history: z.object({ pastMedical: z.array(str(300)), medications: z.array(str(300)), allergies: z.array(str(300)), family: z.array(str(300)), social: z.array(str(300)) }),
  symptoms: z.array(str(80)).max(20),
  exam: z.record(z.enum(examCodes), z.object({ finding: str(1000).min(1), abnormal: z.boolean() })),
  investigations: z.record(z.enum(invCodes), z.object({ result: str(1000).min(1), abnormal: z.boolean() })),
  answer: z.object({
    diagnosis: str(300).min(2),
    acceptedTerms: z.array(str(120).min(1)).min(1),
    differentials: z.array(z.object({ name: str(200).min(1), terms: z.array(str(120).min(1)).min(1) })),
    teachingPoints: z.array(str(1000)),
  }),
  rubric: z.object({
    keyTopics: z.array(z.object({ topic: z.enum(topicKeys), weight: z.number().min(1).max(10) })).min(1),
    essentialExams: z.array(z.enum(examCodes)),
    essentialInvestigations: z.array(z.enum(invCodes)),
    unnecessaryInvestigations: z.array(z.enum(invCodes)),
    management: z.object({
      options: z
        .array(z.object({ code: z.string().regex(/^[a-z0-9_]{2,40}$/), label: str(200).min(1), kind: z.enum(["essential", "appropriate", "contraindicated", "neutral"]), rationale: str(600) }))
        .min(2),
    }),
    weights: z
      .object({ history: z.number().min(0), exam: z.number().min(0), investigations: z.number().min(0), diagnosis: z.number().min(0), management: z.number().min(0) })
      .refine((w) => Math.round(w.history + w.exam + w.investigations + w.diagnosis + w.management) === 100, "La somme des pondérations doit être égale à 100"),
  }),
});

export const CaseMetaSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]{3,80}$/, "Minuscules, chiffres et tirets uniquement"),
  title: str(160).min(3),
  specialty: z.enum(SPECIALTIES.map((s) => s.key) as [string, ...string[]]),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  summary: str(600).min(10),
  objectives: z.array(str(300).min(1)).min(1).max(10),
  minutes: z.number().int().min(5).max(120),
  freeTier: z.boolean(),
});

export const CaseUpsertSchema = z.object({ meta: CaseMetaSchema, content: CaseContentSchema });
