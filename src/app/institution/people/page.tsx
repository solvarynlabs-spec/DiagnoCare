import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { ROLE_META, type RoleKey } from "@/lib/rbac";
import { Badge, Card, CardTitle, PageHeader, fmtDate } from "@/components/ui";
import { CreateUserForm } from "./create-user-form";
import { getLang, getT } from "@/lib/i18n/server";
import { makeT } from "@/lib/i18n/shared";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("Enseignants et étudiants", "Teachers and students") };
}

export default async function PeoplePage() {
  const user = await requireUser({ permission: "institution:manage" });
  const lang = await getLang();
  const t = makeT(lang);
  const people = await prisma.user.findMany({ where: { universityId: user.universityId ?? "__none__" }, include: { memberships: { include: { group: true } }, _count: { select: { sessions: true } } }, orderBy: [{ roleKey: "asc" }, { name: "asc" }] });
  return (
    <>
      <PageHeader eyebrow={t("Faculté", "Faculty")} title={t("Enseignants et étudiants", "Teachers and students")} sub={t("Créez les comptes de vos enseignants et étudiants. Chaque nouveau compte reçoit un mot de passe temporaire à usage unique.", "Create accounts for your teachers and students. Each new account gets a one-time temporary password.")} />
      <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
        <Card>
          <CardTitle>{t("Ajouter une personne", "Add a person")}</CardTitle>
          <CreateUserForm />
        </Card>
        <div className="panel overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="subtle border-b border-[rgb(var(--line))] text-left text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3">{t("Nom", "Name")}</th>
                <th className="px-4 py-3">{t("Rôle", "Role")}</th>
                <th className="px-4 py-3">{t("Groupes", "Groups")}</th>
                <th className="px-4 py-3">Consultations</th>
                <th className="px-4 py-3">{t("Dernière connexion", "Last sign-in")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(var(--line))]">
              {people.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-2.5">
                    <p className="font-medium">{p.name}</p>
                    <p className="subtle text-xs">{p.email}</p>
                  </td>
                  <td className="px-4 py-2.5"><Badge tone={p.roleKey === "STUDENT" ? "blue" : p.roleKey === "TEACHER" ? "teal" : "navy"}>{t(ROLE_META[p.roleKey as RoleKey]?.label ?? p.roleKey, ROLE_META[p.roleKey as RoleKey]?.labelEn ?? p.roleKey)}</Badge></td>
                  <td className="muted px-4 py-2.5 text-xs">{p.memberships.map((m) => m.group.name).join(", ") || "—"}</td>
                  <td className="px-4 py-2.5">{p._count.sessions}</td>
                  <td className="muted px-4 py-2.5 text-xs">{fmtDate(p.lastLoginAt, lang)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
