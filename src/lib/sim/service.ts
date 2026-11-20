import "server-only";
import { prisma, parseJson } from "@/lib/db";
import { HttpError, type CurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/rbac";
import { audit, notify } from "@/lib/audit";
import { caseContent } from "@/lib/cases/repo";
import { examByCode, investigationByCode } from "@/lib/catalog";
import { aiMode, patientRespond } from "./engines";
import { scoreSession, type SessionEvidence } from "./scoring";
import { aiNarrative, rubricFeedback } from "./feedback";
import { asLang, pickLocalized, type Lang } from "./types";
import { examText } from "./exam-text";
import { localizeCaseContent } from "@/lib/cases/i18n";
import type { UiLang } from "@/lib/i18n/shared";
import { getSetting } from "@/lib/settings";
import { DRAFT_SLUGS } from "@/lib/cases/drafts";

export const STAGES = ["INTERVIEW", "EXAM", "INVESTIGATIONS", "REASONING", "MANAGEMENT", "COMPLETED"] as const;
export type Stage = (typeof STAGES)[number];

/** A source-traceable draft case awaiting clinical educator review (see lib/cases/drafts). */
export const isDraftCase = (c: { status: string; slug: string }) => c.status === "IN_REVIEW" && DRAFT_SLUGS.has(c.slug);

/** Whether students may open draft cases and workshops (admin setting, off by default). */
export async function draftsOpenToStudents() {
  return (await getSetting("drafts.studentAccess")) === "true";
}

/** Can this user open this case under their plan / role? */
export function canAccessCase(user: CurrentUser, c: { freeTier: boolean; status: string; authorId: string | null; slug?: string }, draftsOpen = false) {
  if (can(user.roleKey, "case:write")) return true; // teachers/admins can preview any case
  if (c.status !== "PUBLISHED" && !(draftsOpen && c.slug && isDraftCase({ status: c.status, slug: c.slug }))) return false;
  return c.freeTier || user.plan.limits.fullLibrary;
}

export async function monthlyUsage(userId: string) {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  return prisma.consultationSession.count({ where: { userId, startedAt: { gte: start } } });
}

export async function startSession(user: CurrentUser, caseId: string, lang: Lang, assignmentId?: string) {
  const c = await prisma.clinicalCase.findUnique({ where: { id: caseId } });
  if (!c) throw new HttpError(404, "Cas introuvable");
  let assigned = false;
  if (assignmentId) {
    const a = await prisma.assignment.findFirst({ where: { id: assignmentId, caseId, group: { members: { some: { userId: user.id } } } } });
    if (!a) throw new HttpError(403, "Ce devoir ne vous est pas destiné");
    assigned = true;
  }
  if (!assigned && !canAccessCase(user, c, await draftsOpenToStudents())) throw new HttpError(402, "Ce cas nécessite la formule Étudiant Pro ou un abonnement de faculté.");
  const limit = user.plan.limits.simulationsPerMonth;
  if (!assigned && limit !== null && (await monthlyUsage(user.id)) >= limit) {
    throw new HttpError(402, `Votre formule inclut ${limit} simulations par mois. Passez à une formule supérieure pour continuer.`);
  }

  const content = caseContent(c);
  const mode = aiMode();
  const session = await prisma.consultationSession.create({
    data: { userId: user.id, caseId: c.id, caseVersion: c.version, assignmentId: assignmentId ?? null, language: lang, aiMode: mode },
  });
  await prisma.conversationMessage.create({
    data: { sessionId: session.id, role: "patient", content: pickLocalized(content.chiefComplaint, lang).text, emotion: content.patient.baselineEmotion },
  });
  await audit("session.start", { userId: user.id, entity: "ConsultationSession", entityId: session.id, meta: { caseId, mode } });
  return session;
}

export async function loadOwnSession(user: CurrentUser, id: string) {
  const s = await prisma.consultationSession.findUnique({ where: { id }, include: { case: true } });
  if (!s || s.userId !== user.id) throw new HttpError(404, "Consultation introuvable");
  return s;
}

export async function sendStudentMessage(user: CurrentUser, id: string, text: string) {
  const s = await loadOwnSession(user, id);
  if (s.status !== "IN_PROGRESS") throw new HttpError(409, "Cette consultation est clôturée");
  const content = caseContent(s.case);
  const history = await prisma.conversationMessage.findMany({ where: { sessionId: id, role: { in: ["student", "patient"] } }, orderBy: { createdAt: "asc" } });

  const studentMsg = await prisma.conversationMessage.create({ data: { sessionId: id, role: "student", content: text } });
  const out = await patientRespond(s.aiMode as "anthropic" | "groq" | "demo", {
    content,
    history: history.map((m) => ({ role: m.role as "student" | "patient", content: m.content })),
    question: text,
    lang: asLang(s.language),
    effort: (await getSetting("ai.patientEffort")) as "low" | "medium" | "high",
  });
  const covered = new Set(parseJson<string[]>(s.topicsCovered, []));
  out.topics.forEach((t) => covered.add(t));
  await prisma.conversationMessage.update({ where: { id: studentMsg.id }, data: { topics: JSON.stringify(out.topics) } });
  const patientMsg = await prisma.conversationMessage.create({ data: { sessionId: id, role: "patient", content: out.reply, emotion: out.emotion } });
  await prisma.consultationSession.update({ where: { id }, data: { topicsCovered: JSON.stringify([...covered]) } });
  return { student: studentMsg, patient: patientMsg, topics: out.topics, topicsCovered: [...covered], engine: out.engine, note: out.note };
}

export async function performExam(user: CurrentUser, id: string, kind: "PHYSICAL" | "INVESTIGATION", code: string, lang: UiLang = "fr") {
  const s = await loadOwnSession(user, id);
  if (s.status !== "IN_PROGRESS") throw new HttpError(409, "Cette consultation est clôturée");
  const content = caseContent(s.case);
  // Stored in French (canonical); the response is in the interface language.
  const fr = examText(content, s.case.slug, kind, code, "fr");
  if (!fr) throw new HttpError(422, kind === "PHYSICAL" ? "Examen inconnu" : "Examen complémentaire inconnu");
  const row = await prisma.medicalExamination.upsert({
    where: { sessionId_code: { sessionId: id, code } },
    create: { sessionId: id, kind, code, name: fr.name, result: fr.result, abnormal: fr.abnormal },
    update: {},
  });
  const shown = lang === "fr" ? fr : examText(content, s.case.slug, kind, code, lang) ?? fr;
  return { ...row, name: shown.name, result: shown.result };
}

export async function submitSession(
  user: CurrentUser,
  id: string,
  input: { differentials: string[]; finalDiagnosis: string; justification: string; managementActions: string[]; managementNotes: string; prescription?: { name: string; dose: string; route: string; frequency: string; duration: string; notes: string }[] },
) {
  const s = await loadOwnSession(user, id);
  if (s.status !== "IN_PROGRESS") throw new HttpError(409, "Cette consultation a déjà été soumise");
  const content = caseContent(s.case);
  const validActions = new Set(content.rubric.management.options.map((o) => o.code));
  const actions = input.managementActions.filter((a) => validActions.has(a));

  const [exams, messages] = await Promise.all([
    prisma.medicalExamination.findMany({ where: { sessionId: id } }),
    prisma.conversationMessage.findMany({ where: { sessionId: id }, orderBy: { createdAt: "asc" } }),
  ]);
  const completedAt = new Date();
  const ev: SessionEvidence = {
    topicsCovered: parseJson<string[]>(s.topicsCovered, []),
    exams: exams.filter((e) => e.kind === "PHYSICAL").map((e) => e.code),
    investigations: exams.filter((e) => e.kind === "INVESTIGATION").map((e) => e.code),
    differentials: input.differentials,
    finalDiagnosis: input.finalDiagnosis,
    justification: input.justification,
    managementActions: actions,
    durationMinutes: Math.max(1, Math.round((completedAt.getTime() - s.startedAt.getTime()) / 60000)),
    questionsAsked: messages.filter((m) => m.role === "student").length,
  };
  // Stored in the consultation language; reports re-derive it for the viewer's language.
  const sLang = asLang(s.language);
  const shown = localizeCaseContent(content, s.case.slug, sLang);
  const score = scoreSession(shown, ev, sLang);
  let feedback = rubricFeedback(shown, score, ev, sLang);
  let feedbackSource = "rubric";
  if ((s.aiMode === "anthropic" || s.aiMode === "groq") && user.plan.limits.aiFeedback) {
    try {
      const effort = (await getSetting("ai.feedbackEffort")) as "low" | "medium" | "high";
      const narrative = await aiNarrative(content, score, ev, messages.map((m) => ({ role: m.role, content: m.content })), s.language, effort, s.aiMode as "anthropic" | "groq");
      feedback = { ...feedback, ...narrative, missedFindings: feedback.missedFindings };
      feedbackSource = `rubric+${s.aiMode}`;
    } catch (e) {
      console.error("[feedback] AI narrative failed; using rubric feedback", e);
    }
  }

  await prisma.$transaction([
    prisma.diagnosisSubmission.create({
      data: { sessionId: id, differentials: JSON.stringify(input.differentials), finalDiagnosis: input.finalDiagnosis, justification: input.justification, managementActions: JSON.stringify(actions), managementNotes: input.managementNotes, prescription: JSON.stringify(input.prescription ?? []) },
    }),
    prisma.assessmentResult.create({
      data: { sessionId: id, totalScore: score.total, breakdown: JSON.stringify(score), feedback: JSON.stringify(feedback), feedbackSource, rubricVersion: s.caseVersion },
    }),
    prisma.consultationSession.update({ where: { id }, data: { status: "COMPLETED", stage: "COMPLETED", completedAt } }),
  ]);
  await audit("session.complete", { userId: user.id, entity: "ConsultationSession", entityId: id, meta: { score: score.total } });
  if (s.assignmentId) {
    const a = await prisma.assignment.findUnique({ where: { id: s.assignmentId } });
    if (a) await notify(a.creatorId, `Rendu : ${a.title}`, `${user.name} a terminé le devoir (${score.total}/100).`, `/teach/review/${id}`);
  }
  return { score: score.total };
}
