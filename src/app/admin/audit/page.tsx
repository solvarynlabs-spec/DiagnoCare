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

export default async function AdminAudit() {
  await requireUser({ permission: "audit:read" });
  const t = makeT(await getLang());
  const logs = await prisma.auditLog.findMany({ include: { user: { select: { name: true, email: true } } }, orderBy: { createdAt: "desc" }, take: 300 });
  return (
    <>
      <PageHeader eyebrow={t("Sécurité", "Security")} title={t("Journal d'audit", "Audit log")} sub={t("Les 300 derniers événements de connexion, de contenu, de facturation et d'administration.", "The last 300 sign-in, content, billing and administration events.")} />
      <AuditTable logs={logs} />
    </>
  );
}
