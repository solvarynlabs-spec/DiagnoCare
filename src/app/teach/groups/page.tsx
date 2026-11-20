import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Card, CardTitle, Empty, PageHeader } from "@/components/ui";
import { AddMembersForm, CreateGroupForm } from "./group-forms";
import { getLang, getT } from "@/lib/i18n/server";
import { makeT } from "@/lib/i18n/shared";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("Groupes", "Groups") };
}

export default async function GroupsPage() {
  const user = await requireUser({ permission: "group:manage" });
  const t = makeT(await getLang());
  const where = user.roleKey === "TEACHER" ? { teacherId: user.id } : user.roleKey === "UNIVERSITY_ADMIN" ? { universityId: user.universityId ?? "__none__" } : {};
  const [groups, teachers] = await Promise.all([
    prisma.studentGroup.findMany({ where, include: { teacher: true, members: { include: { user: true } }, _count: { select: { assignments: true } } }, orderBy: { name: "asc" } }),
    user.roleKey === "TEACHER" ? Promise.resolve([]) : prisma.user.findMany({ where: { roleKey: "TEACHER", ...(user.roleKey === "UNIVERSITY_ADMIN" ? { universityId: user.universityId } : {}) }, select: { id: true, name: true } }),
  ]);
  return (
    <>
      <PageHeader eyebrow={t("Promotions", "Classes")} title={t("Groupes d'étudiants", "Student groups")} sub={t("Organisez vos étudiants en groupes pour leur assigner des cas et suivre leurs résultats.", "Organise your students into groups to assign cases and follow their results.")} />
      <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
        <Card>
          <CardTitle>{t("Nouveau groupe", "New group")}</CardTitle>
          <CreateGroupForm teachers={teachers} />
        </Card>
        <div className="space-y-4">
          {groups.length === 0 && <Empty title={t("Aucun groupe", "No groups")} />}
          {groups.map((g) => (
            <Card key={g.id}>
              <CardTitle sub={t(`Enseignant : ${g.teacher.name} · ${g.members.length} étudiant(s) · ${g._count.assignments} devoir(s)`, `Teacher: ${g.teacher.name} · ${g.members.length} student(s) · ${g._count.assignments} assignment(s)`)}>{g.name}</CardTitle>
              <div className="mb-4 flex flex-wrap gap-1.5">
                {g.members.map((m) => (
                  <span key={m.id} className="chip bg-[rgb(var(--panel-2))]" title={m.user.email}>{m.user.name}</span>
                ))}
                {g.members.length === 0 && <span className="subtle text-sm">{t("Aucun étudiant.", "No students.")}</span>}
              </div>
              <AddMembersForm groupId={g.id} />
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
