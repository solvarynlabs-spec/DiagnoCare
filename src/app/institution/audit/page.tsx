import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { AuditTable } from "@/components/admin";
import { getLang, getT } from "@/lib/i18n/server";
import { makeT } from "@/lib/i18n/shared";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("Journal d'audit", "Audit log") };
}

export default async function InstitutionAudit() {
  const user = await requireUser({ permission: "audit:read" });
  const t = makeT(await getLang());
  const logs = await prisma.auditLog.findMany({
    where: { user: { universityId: user.universityId ?? "__none__" } },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return (
    <>
      <PageHeader eyebrow={t("Conformité", "Compliance")} title={t("Journal d'audit", "Audit log")} sub={t("Les 200 derniers événements de sécurité et de contenu des membres de votre faculté.", "The last 200 security and content events from members of your faculty.")} />
      <AuditTable logs={logs} />
    </>
  );
}
