import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma, parseJson } from "@/lib/db";
import type { CaseContent, Difficulty } from "@/lib/sim/types";

export interface CaseMeta {
  slug: string;
  title: string;
  specialty: string;
  difficulty: Difficulty;
  summary: string;
  objectives: string[];
  minutes: number;
  freeTier: boolean;
}

type Tx = PrismaClient | Prisma.TransactionClient;

/** Writes a case and keeps derived, queryable tables (patient, symptoms, history, rubric) in sync. */
export async function upsertCase(
  db: Tx,
  meta: CaseMeta,
  content: CaseContent,
  opts: { authorId?: string | null; status?: string; reviewedBy?: string | null; reviewNotes?: string | null; id?: string } = {},
) {
  const data = {
    slug: meta.slug,
    title: meta.title,
    specialty: meta.specialty,
    difficulty: meta.difficulty,
    summary: meta.summary,
    learningObjectives: JSON.stringify(meta.objectives),
    estimatedMinutes: meta.minutes,
    patientAge: content.patient.age,
    patientSex: content.patient.sex,
    freeTier: meta.freeTier,
    content: JSON.stringify(content),
  };
  const existing = opts.id ? await db.clinicalCase.findUnique({ where: { id: opts.id } }) : await db.clinicalCase.findUnique({ where: { slug: meta.slug } });

  const row = existing
    ? await db.clinicalCase.update({
        where: { id: existing.id },
        data: {
          ...data,
          version: existing.content !== data.content ? existing.version + 1 : existing.version,
          ...(opts.status ? { status: opts.status } : {}),
        },
      })
    : await db.clinicalCase.create({
        data: { ...data, authorId: opts.authorId ?? null, status: opts.status ?? "DRAFT", reviewedBy: opts.reviewedBy ?? null, reviewNotes: opts.reviewNotes ?? null, reviewedAt: opts.reviewedBy ? new Date() : null },
      });

  const p = content.patient;
  await db.virtualPatient.upsert({
    where: { caseId: row.id },
    create: { caseId: row.id, name: p.name, age: p.age, sex: p.sex, occupation: p.occupation, personality: p.personality, baselineEmotion: p.baselineEmotion, avatarConfig: JSON.stringify(p.avatar) },
    update: { name: p.name, age: p.age, sex: p.sex, occupation: p.occupation, personality: p.personality, baselineEmotion: p.baselineEmotion, avatarConfig: JSON.stringify(p.avatar) },
  });
  await db.caseSymptom.deleteMany({ where: { caseId: row.id } });
  if (content.symptoms.length) await db.caseSymptom.createMany({ data: content.symptoms.map((name) => ({ caseId: row.id, name: name.toLowerCase().trim() })) });
  await db.medicalHistoryItem.deleteMany({ where: { caseId: row.id } });
  const h = content.history;
  const hist = [
    ...h.pastMedical.map((d) => ({ kind: "PAST_MEDICAL", detail: d })),
    ...h.medications.map((d) => ({ kind: "MEDICATION", detail: d })),
    ...h.allergies.map((d) => ({ kind: "ALLERGY", detail: d })),
    ...h.family.map((d) => ({ kind: "FAMILY", detail: d })),
    ...h.social.map((d) => ({ kind: "SOCIAL", detail: d })),
  ];
  if (hist.length) await db.medicalHistoryItem.createMany({ data: hist.map((x) => ({ ...x, caseId: row.id })) });
  await db.evaluationRubric.upsert({
    where: { caseId: row.id },
    create: { caseId: row.id, criteria: JSON.stringify(content.rubric), version: row.version },
    update: { criteria: JSON.stringify(content.rubric), version: row.version },
  });
  return row;
}

export function caseContent(row: { content: string }): CaseContent {
  return parseJson<CaseContent>(row.content, null as unknown as CaseContent);
}

export interface LibraryFilters {
  q?: string;
  specialty?: string;
  difficulty?: string;
  age?: "child" | "adult" | "older";
  maxMinutes?: number;
  symptom?: string;
}

export async function listPublishedCases(f: LibraryFilters) {
  const where: Prisma.ClinicalCaseWhereInput = { status: "PUBLISHED" };
  if (f.specialty) where.specialty = f.specialty;
  if (f.difficulty) where.difficulty = f.difficulty;
  if (f.age === "child") where.patientAge = { lt: 18 };
  if (f.age === "adult") where.patientAge = { gte: 18, lt: 65 };
  if (f.age === "older") where.patientAge = { gte: 65 };
  if (f.maxMinutes) where.estimatedMinutes = { lte: f.maxMinutes };
  if (f.symptom) where.symptoms = { some: { name: { contains: f.symptom.toLowerCase() } } };
  if (f.q) {
    where.OR = [
      { title: { contains: f.q } },
      { summary: { contains: f.q } },
      { learningObjectives: { contains: f.q } },
      { symptoms: { some: { name: { contains: f.q.toLowerCase() } } } },
    ];
  }
  return prisma.clinicalCase.findMany({
    where,
    orderBy: [{ specialty: "asc" }, { difficulty: "asc" }],
    include: { symptoms: true, patient: true },
  });
}
