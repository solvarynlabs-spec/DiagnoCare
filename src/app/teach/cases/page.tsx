import Link from "next/link";
import { Copy, Plus } from "@/components/icons";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { specialtyName } from "@/lib/catalog";
import { DifficultyBadge, Empty, PageHeader, StatusBadge, fmtDate } from "@/components/ui";
import { getLang, getT } from "@/lib/i18n/server";
import { makeT } from "@/lib/i18n/shared";
import { localizeCaseMeta } from "@/lib/cases/i18n";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("Cas cliniques", "Clinical cases") };
}

export default async function TeacherCases({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const user = await requireUser({ permission: "case:write" });
  const lang = await getLang();
  const t = makeT(lang);
  const { status } = await searchParams;
  const cases = await prisma.clinicalCase.findMany({
    where: status ? { status } : {},
    include: { author: { select: { name: true } }, _count: { select: { sessions: true } } },
    orderBy: { updatedAt: "desc" },
  });
  const tabs = [["", t("Tous", "All")], ["DRAFT", t("Brouillons", "Drafts")], ["IN_REVIEW", t("En validation", "In review")], ["PUBLISHED", t("Publiés", "Published")], ["ARCHIVED", t("Archivés", "Archived")]];

  return (
    <>
      <PageHeader
        eyebrow={t("Gestion des contenus", "Content management")}
        title={t("Cas cliniques", "Clinical cases")}
        sub={t("Créez, modifiez, faites valider et publiez vos scénarios. Toute modification renvoie le cas en brouillon pour une nouvelle validation.", "Create, edit, get reviewed and publish your scenarios. Any edit sends the case back to draft for a new review.")}
        actions={
          <Link href="/teach/cases/new" className="btn-primary">
            <Plus className="h-4 w-4" /> {t("Nouveau cas", "New case")}
          </Link>
        }
      />
      <div className="mb-4 flex flex-wrap gap-1">
        {tabs.map(([k, l]) => (
          <Link key={k} href={k ? `/teach/cases?status=${k}` : "/teach/cases"} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${status === k || (!status && !k) ? "bg-brand-600 text-white" : "muted hover:bg-[rgb(var(--panel-2))]"}`}>
            {l}
          </Link>
        ))}
      </div>
      {cases.length === 0 ? (
        <Empty title={t("Aucun cas ici", "No cases here")} action={<Link href="/teach/cases/new" className="btn-primary">{t("Créer un cas", "Create a case")}</Link>} />
      ) : (
        <div className="panel overflow-x-auto p-0">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="subtle border-b border-[rgb(var(--line))] text-left text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3">{t("Cas", "Case")}</th>
                <th className="px-4 py-3">{t("Spécialité", "Specialty")}</th>
                <th className="px-4 py-3">{t("Niveau", "Level")}</th>
                <th className="px-4 py-3">{t("Statut", "Status")}</th>
                <th className="px-4 py-3">Version</th>
                <th className="px-4 py-3">Consultations</th>
                <th className="px-4 py-3">{t("Modifié", "Updated")}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(var(--line))]">
              {cases.map((c) => {
                const editable = user.roleKey !== "TEACHER" || c.authorId === user.id;
                return (
                  <tr key={c.id} className="hover:bg-[rgb(var(--panel-2))]">
                    <td className="px-4 py-3">
                      <Link href={`/teach/cases/${c.id}`} className="font-semibold hover:text-brand-600">{localizeCaseMeta(c, lang).title}</Link>
                      <p className="subtle text-xs">{t("par", "by")} {c.author?.name ?? "—"}</p>
                    </td>
                    <td className="muted px-4 py-3">{specialtyName(c.specialty, lang)}</td>
                    <td className="px-4 py-3"><DifficultyBadge d={c.difficulty} /></td>
                    <td className="px-4 py-3"><StatusBadge s={c.status} /></td>
                    <td className="muted px-4 py-3">v{c.version}</td>
                    <td className="muted px-4 py-3">{c._count.sessions}</td>
                    <td className="muted px-4 py-3">{fmtDate(c.updatedAt, lang)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <Link href={`/teach/cases/${c.id}`} className="font-semibold text-brand-600 hover:underline">{editable ? t("Ouvrir", "Open") : t("Voir", "View")}</Link>
                      <Link href={`/teach/cases/new?from=${c.id}`} className="subtle ml-3 inline-flex items-center gap-1 hover:text-brand-600" title={t("Dupliquer en nouveau brouillon", "Duplicate as a new draft")}>
                        <Copy className="h-3.5 w-3.5" /> {t("Dupliquer", "Duplicate")}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
