import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download } from "@/components/icons";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { canViewSession } from "@/lib/access";
import { caseContent } from "@/lib/cases/repo";
import { ReportView } from "@/components/sim/report-view";
import { Card, CardTitle } from "@/components/ui";
import { FeedbackForm } from "./feedback-form";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("Relecture de consultation", "Consultation review") };
}

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser({ permission: "student:review" });
  const t = await getT();
  const { id } = await params;
  const s = await prisma.consultationSession.findUnique({
    where: { id },
    include: { case: true, user: true, result: true, diagnosis: true, messages: { orderBy: { createdAt: "asc" } }, examinations: { orderBy: { createdAt: "asc" } } },
  });
  if (!s || !s.result || !(await canViewSession(user, s))) notFound();
  return (
    <>
      <Link href={`/teach/students?student=${s.userId}`} className="subtle mb-4 inline-flex items-center gap-1 text-sm hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" /> {s.user.name}
      </Link>
      <div className="grid gap-6 2xl:grid-cols-[1fr_380px]">
        <ReportView
          s={s}
          content={caseContent(s.case)}
          actions={
            <a href={`/api/reports/${id}/pdf`} className="btn-ghost">
              <Download className="h-4 w-4" /> PDF
            </a>
          }
        />
        <div>
          <Card className="sticky top-20">
            <CardTitle sub={t("Visible par l'étudiant dans son rapport", "Visible to the student in their report")}>{t("Commentaire pédagogique", "Teaching comment")}</CardTitle>
            <FeedbackForm sessionId={id} initialComment={s.result.teacherComment ?? ""} initialOverride={s.result.teacherScoreOverride} rubricScore={s.result.totalScore} />
          </Card>
        </div>
      </div>
    </>
  );
}
