import "server-only";
import { prisma } from "@/lib/db";
import type { CurrentUser } from "@/lib/auth/session";

/** Who may view a consultation record: its owner, the student's teachers, their institution admins, platform admins. */
export async function canViewSession(user: CurrentUser, session: { userId: string }) {
  if (session.userId === user.id) return true;
  if (user.roleKey === "PLATFORM_ADMIN") return true;
  if (user.roleKey === "TEACHER") {
    const shared = await prisma.groupMembership.findFirst({ where: { userId: session.userId, group: { teacherId: user.id } } });
    return !!shared;
  }
  if (user.roleKey === "UNIVERSITY_ADMIN" && user.universityId) {
    const student = await prisma.user.findUnique({ where: { id: session.userId }, select: { universityId: true } });
    return student?.universityId === user.universityId;
  }
  return false;
}

/** Student ids visible to a teacher / institution admin. */
export async function visibleStudentIds(user: CurrentUser): Promise<string[]> {
  if (user.roleKey === "PLATFORM_ADMIN") return (await prisma.user.findMany({ where: { roleKey: "STUDENT" }, select: { id: true } })).map((u) => u.id);
  if (user.roleKey === "UNIVERSITY_ADMIN") return (await prisma.user.findMany({ where: { roleKey: "STUDENT", universityId: user.universityId ?? "__none__" }, select: { id: true } })).map((u) => u.id);
  const m = await prisma.groupMembership.findMany({ where: { group: { teacherId: user.id } }, select: { userId: true } });
  return [...new Set(m.map((x) => x.userId))];
}
