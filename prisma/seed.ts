/**
 * Seeds roles, a demo institution, demo accounts, the fictional demo case library and
 * synthetic historical sessions (so dashboards and analytics have data).
 *
 * Demo accounts (local development only — change or remove before any deployment):
 *   student@medsim.demo   / Student123!   Étudiante, formule Étudiant Pro
 *   free@medsim.demo      / Student123!   Student, Free plan
 *   teacher@medsim.demo   / Teacher123!   Teacher
 *   uniadmin@medsim.demo  / Admin123!     University administrator
 *   admin@medsim.demo     / Admin123!     Platform administrator
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ROLE_META, ROLE_PERMISSIONS, ROLES } from "../src/lib/rbac";
import { DEMO_CASES } from "../src/lib/cases/demo-cases";
import { upsertCase } from "../src/lib/cases/repo";
import { scoreSession, type SessionEvidence } from "../src/lib/sim/scoring";
import { rubricFeedback } from "../src/lib/sim/feedback";
import { planByKey } from "../src/lib/billing/plans";

const prisma = new PrismaClient();

// Deterministic PRNG so the seed is reproducible.
let s = 42;
const rand = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = <T,>(arr: T[], p: number) => arr.filter(() => rand() < p);

async function main() {
  console.log("Seeding roles…");
  for (const key of ROLES) {
    await prisma.role.upsert({
      where: { key },
      create: { key, name: ROLE_META[key].label, description: ROLE_META[key].description, permissions: JSON.stringify(ROLE_PERMISSIONS[key]) },
      update: { name: ROLE_META[key].label, description: ROLE_META[key].description, permissions: JSON.stringify(ROLE_PERMISSIONS[key]) },
    });
  }

  const uni =
    (await prisma.university.findFirst({ where: { name: "Faculté de médecine d'Alger (démonstration)" } })) ??
    (await prisma.university.create({ data: { name: "Faculté de médecine d'Alger (démonstration)", country: "Algérie", domain: "faculte-demo.dz.example" } }));

  const hash = (pw: string) => bcrypt.hash(pw, 10);
  async function user(email: string, name: string, roleKey: string, pw: string, plan: string, extra: Record<string, unknown> = {}) {
    const u = await prisma.user.upsert({
      where: { email },
      create: { email, name, roleKey, locale: "fr", passwordHash: await hash(pw), universityId: roleKey === "PLATFORM_ADMIN" ? null : uni.id, ...extra },
      update: { name, roleKey, locale: "fr" },
    });
    await prisma.subscription.upsert({
      where: { userId: u.id },
      create: { userId: u.id, plan, status: "ACTIVE", provider: "demo", currentPeriodEnd: new Date(Date.now() + 30 * 864e5) },
      update: { plan },
    });
    return u;
  }

  console.log("Seeding users…");
  const student = await user("student@medsim.demo", "Amira Benali", "STUDENT", "Student123!", "STUDENT_PRO", { yearOfStudy: 4 });
  await user("free@medsim.demo", "Riad Ouali", "STUDENT", "Student123!", "FREE", { yearOfStudy: 2, universityId: null });
  const teacher = await user("teacher@medsim.demo", "Dr Leïla Hamdi", "TEACHER", "Teacher123!", "UNIVERSITY", { specialty: "Médecine d'urgence" });
  await user("uniadmin@medsim.demo", "Pr Karim Mansouri", "UNIVERSITY_ADMIN", "Admin123!", "UNIVERSITY");
  await user("admin@medsim.demo", "Administrateur plateforme", "PLATFORM_ADMIN", "Admin123!", "UNIVERSITY");

  const classmates = [];
  const names = ["Yasmine Khelifi", "Walid Boudiaf", "Sara Benmansour", "Mehdi Ait Ahmed", "Rania Zerrouki", "Omar Saidi"];
  for (const [i, n] of names.entries()) {
    classmates.push(await user(`student${i + 1}@medsim.demo`, n, "STUDENT", "Student123!", "UNIVERSITY", { yearOfStudy: 4 }));
  }

  // Payment history for the Pro student
  if ((await prisma.payment.count({ where: { userId: student.id } })) === 0) {
    for (let m = 3; m >= 1; m--) {
      await prisma.payment.create({
        data: { userId: student.id, amountCents: planByKey("STUDENT_PRO").priceMonthly * 100, currency: "DZD", plan: "STUDENT_PRO", status: "DEMO", provider: "demo", description: "Étudiant Pro — mensuel (paiement de démonstration)", createdAt: new Date(Date.now() - m * 30 * 864e5) },
      });
    }
  }

  console.log("Seeding clinical cases…");
  const caseRows = [];
  for (const c of DEMO_CASES) {
    caseRows.push(
      await upsertCase(prisma, { slug: c.slug, title: c.title, specialty: c.specialty, difficulty: c.difficulty, summary: c.summary, objectives: c.objectives, minutes: c.minutes, freeTier: c.freeTier }, c.content, {
        authorId: teacher.id,
        status: "PUBLISHED",
        reviewedBy: "Contenu de démonstration — à faire relire par les experts cliniques de la faculté avant tout usage formel",
        reviewNotes: "Cas fictif rédigé pour la démonstration du produit.",
      }),
    );
  }

  console.log("Seeding groups & assignments…");
  let group = await prisma.studentGroup.findFirst({ where: { name: "4e année — Groupe B" } });
  if (!group) {
    group = await prisma.studentGroup.create({ data: { name: "4e année — Groupe B", year: 4, universityId: uni.id, teacherId: teacher.id } });
    for (const u of [student, ...classmates]) await prisma.groupMembership.create({ data: { groupId: group.id, userId: u.id } });
    const stemi = caseRows.find((c) => c.slug === "acute-chest-pain-58m")!;
    const pe = caseRows.find((c) => c.slug === "post-op-dyspnea-52f")!;
    await prisma.assignment.create({ data: { title: "Triage d'une douleur thoracique", instructions: "Menez la consultation en entier. Insistez sur les décisions urgentes et la stratégie de reperfusion disponible localement.", caseId: stemi.id, groupId: group.id, creatorId: teacher.id, dueAt: new Date(Date.now() + 5 * 864e5) } });
    await prisma.assignment.create({ data: { title: "Dyspnée post-opératoire", instructions: "Appliquez explicitement le score de Wells dans votre argumentation.", caseId: pe.id, groupId: group.id, creatorId: teacher.id, dueAt: new Date(Date.now() + 12 * 864e5) } });
  }

  console.log("Seeding historical sessions…");
  if ((await prisma.consultationSession.count()) === 0) {
    const learners = [student, ...classmates];
    for (const [li, learner] of learners.entries()) {
      const skill = 0.45 + (li === 0 ? 0.25 : rand() * 0.4);
      const n = li === 0 ? 9 : 3 + Math.floor(rand() * 5);
      for (let k = 0; k < n; k++) {
        const demo = DEMO_CASES[Math.floor(rand() * DEMO_CASES.length)];
        const row = caseRows.find((r) => r.slug === demo.slug)!;
        const c = demo.content;
        const growth = Math.min(0.95, skill + k * 0.03);
        const ev: SessionEvidence = {
          topicsCovered: pick(c.rubric.keyTopics.map((t) => t.topic), growth),
          exams: pick(c.rubric.essentialExams, growth),
          investigations: [...pick(c.rubric.essentialInvestigations, growth + 0.05), ...pick(c.rubric.unnecessaryInvestigations, 0.12)],
          differentials: pick(c.answer.differentials.map((d) => d.name), growth - 0.1),
          finalDiagnosis: rand() < growth + 0.1 ? c.answer.diagnosis : c.answer.differentials[0].name,
          justification: rand() < growth ? "History, examination and key investigations support this diagnosis as outlined in my notes." : "",
          managementActions: [
            ...pick(c.rubric.management.options.filter((o) => o.kind === "essential" || o.kind === "appropriate").map((o) => o.code), growth),
            ...pick(c.rubric.management.options.filter((o) => o.kind === "contraindicated").map((o) => o.code), 0.08),
          ],
          durationMinutes: Math.round(demo.minutes * (0.7 + rand() * 0.8)),
          questionsAsked: 8 + Math.floor(rand() * 18),
        };
        const score = scoreSession(c, ev);
        const fb = rubricFeedback(c, score, ev);
        const started = new Date(Date.now() - (n - k) * 6 * 864e5 - rand() * 3 * 864e5);
        const done = new Date(started.getTime() + ev.durationMinutes * 60000);
        const sess = await prisma.consultationSession.create({
          data: {
            userId: learner.id, caseId: row.id, caseVersion: row.version, language: "fr", stage: "COMPLETED", status: "COMPLETED", aiMode: "demo",
            topicsCovered: JSON.stringify(ev.topicsCovered), startedAt: started, completedAt: done,
            notes: "Session historique générée (données synthétiques).",
          },
        });
        await prisma.conversationMessage.createMany({
          data: [
            { sessionId: sess.id, role: "patient", content: c.chiefComplaint.fr ?? c.chiefComplaint.en, emotion: c.patient.baselineEmotion, createdAt: started },
            { sessionId: sess.id, role: "student", content: "Depuis quand avez-vous ces symptômes ?", createdAt: new Date(started.getTime() + 60000) },
            { sessionId: sess.id, role: "patient", content: c.interview.onset?.fr ?? c.interview.onset?.en ?? "Depuis peu.", emotion: c.patient.baselineEmotion, createdAt: new Date(started.getTime() + 70000) },
          ],
        });
        for (const code of ev.exams) {
          const f = c.exam[code];
          await prisma.medicalExamination.create({ data: { sessionId: sess.id, kind: "PHYSICAL", code, name: code, result: f?.finding ?? "Normal.", abnormal: f?.abnormal ?? false } });
        }
        for (const code of ev.investigations) {
          const r = c.investigations[code];
          await prisma.medicalExamination.create({ data: { sessionId: sess.id, kind: "INVESTIGATION", code, name: code, result: r?.result ?? "Normal.", abnormal: r?.abnormal ?? false } });
        }
        await prisma.diagnosisSubmission.create({
          data: { sessionId: sess.id, differentials: JSON.stringify(ev.differentials), finalDiagnosis: ev.finalDiagnosis, justification: ev.justification, managementActions: JSON.stringify(ev.managementActions), submittedAt: done },
        });
        await prisma.assessmentResult.create({
          data: { sessionId: sess.id, totalScore: score.total, breakdown: JSON.stringify(score), feedback: JSON.stringify(fb), feedbackSource: "rubric", rubricVersion: row.version, createdAt: done },
        });
      }
    }
  }

  if ((await prisma.notification.count({ where: { userId: student.id } })) === 0) {
    await prisma.notification.createMany({
      data: [
        { userId: student.id, title: "Nouveau devoir : triage d'une douleur thoracique", body: "Dr Leïla Hamdi a assigné un cas au groupe 4e année — Groupe B.", href: "/app" },
        { userId: student.id, title: "Bienvenue sur DiagnoCare", body: "Commencez par un cas « Fondamental » pour découvrir le déroulé de la consultation.", href: "/app/cases" },
      ],
    });
  }

  await prisma.platformSetting.upsert({ where: { key: "ai.patientEffort" }, create: { key: "ai.patientEffort", value: "low" }, update: {} });
  await prisma.platformSetting.upsert({ where: { key: "ai.feedbackEffort" }, create: { key: "ai.feedbackEffort", value: "medium" }, update: {} });
  await prisma.platformSetting.upsert({ where: { key: "voice.enabled" }, create: { key: "voice.enabled", value: "true" }, update: {} });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
