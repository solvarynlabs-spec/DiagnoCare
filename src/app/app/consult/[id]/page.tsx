import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { prisma, parseJson } from "@/lib/db";
import { caseContent } from "@/lib/cases/repo";
import { getSetting } from "@/lib/settings";
import { ConsultationRoom, type RoomProps } from "@/components/sim/room";
import { getLang, getT } from "@/lib/i18n/server";
import { localizeCaseContent, localizeCaseMeta } from "@/lib/cases/i18n";
import { localizeExamRows } from "@/lib/sim/exam-text";
import { asLang } from "@/lib/sim/types";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("Salle de consultation", "Consultation room") };
}

export default async function ConsultPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const s = await prisma.consultationSession.findUnique({
    where: { id },
    include: { case: true, messages: { orderBy: { createdAt: "asc" } }, examinations: { orderBy: { createdAt: "asc" } } },
  });
  if (!s || s.userId !== user.id) notFound();
  if (s.status === "COMPLETED") redirect(`/app/reports/${id}`);
  if (s.status === "ABANDONED") redirect(`/app/cases/${s.case.slug}`);

  const lang = await getLang();
  const raw = caseContent(s.case);
  const c = localizeCaseContent(raw, s.case.slug, lang);
  const meta = localizeCaseMeta(s.case, lang);
  const voiceEnabled = (await getSetting("voice.enabled")) === "true";

  // Only patient-visible / non-scoring information is sent to the browser.
  const props: RoomProps = {
    session: { id: s.id, stage: s.stage, language: asLang(s.language), aiMode: s.aiMode as "anthropic" | "groq" | "demo", startedAt: s.startedAt.toISOString(), notes: s.notes, topicsCovered: parseJson<string[]>(s.topicsCovered, []) },
    caseInfo: { title: meta.title, slug: s.case.slug, setting: c.setting, minutes: s.case.estimatedMinutes, specialty: s.case.specialty, pregnant: "obs_exam" in c.exam },
    patient: { name: c.patient.name, age: c.patient.age, sex: c.patient.sex, occupation: c.patient.occupation, avatar: c.patient.avatar, baselineEmotion: c.patient.baselineEmotion },
    vitals: c.vitals,
    history: c.history,
    messages: s.messages.filter((m) => m.role !== "system").map((m) => ({ id: m.id, role: m.role as "student" | "patient", content: m.content, emotion: m.emotion })),
    exams: localizeExamRows(s.examinations, raw, s.case.slug, lang).map((e) => ({ code: e.code, kind: e.kind as "PHYSICAL" | "INVESTIGATION", name: e.name, result: e.result, abnormal: e.abnormal, at: e.createdAt.toISOString() })),
    managementOptions: c.rubric.management.options.map((o) => ({ code: o.code, label: o.label })).sort((a, b) => a.label.localeCompare(b.label)),
    voiceAllowed: voiceEnabled && user.plan.limits.voice,
  };
  return <ConsultationRoom {...props} />;
}
