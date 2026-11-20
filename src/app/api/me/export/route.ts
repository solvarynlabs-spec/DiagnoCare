import { NextResponse } from "next/server";
import { handle } from "@/lib/api";
import { prisma, parseJson } from "@/lib/db";
import { requireApiUser } from "@/lib/auth/session";
import { audit } from "@/lib/audit";
import { parsePrefs } from "@/lib/prefs";

/** Download of the user's own data (profile, consultations, results) as JSON. */
export const GET = handle(async () => {
  const user = await requireApiUser();
  const sessions = await prisma.consultationSession.findMany({
    where: { userId: user.id },
    orderBy: { startedAt: "desc" },
    include: { case: { select: { title: true, specialty: true } }, messages: { orderBy: { createdAt: "asc" }, select: { role: true, content: true, createdAt: true } }, examinations: { select: { name: true, result: true, abnormal: true } }, result: { select: { totalScore: true, breakdown: true, createdAt: true } } },
  });
  const payments = await prisma.payment.findMany({ where: { userId: user.id }, select: { description: true, amountCents: true, currency: true, status: true, createdAt: true } });
  const data = {
    exportedAt: new Date().toISOString(),
    profile: { name: user.name, email: user.email, role: user.roleKey, university: user.university?.name ?? null, yearOfStudy: user.yearOfStudy, plan: user.plan.name, createdAt: user.createdAt, preferences: parsePrefs(user.preferences) },
    consultations: sessions.map((s) => ({
      case: s.case.title,
      specialty: s.case.specialty,
      status: s.status,
      language: s.language,
      startedAt: s.startedAt,
      completedAt: s.completedAt,
      score: s.result?.totalScore ?? null,
      breakdown: s.result ? parseJson(s.result.breakdown, null) : null,
      transcript: s.messages,
      examinations: s.examinations,
    })),
    payments,
  };
  await audit("account.export", { userId: user.id });
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="diagnocare-mes-donnees-${new Date().toISOString().slice(0, 10)}.json"` },
  });
});
