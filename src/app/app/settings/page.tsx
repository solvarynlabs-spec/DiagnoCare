import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { ROLE_META, ROLE_PERMISSIONS, PERMISSIONS, PERMISSIONS_EN, type RoleKey } from "@/lib/rbac";
import { getLang, getT } from "@/lib/i18n/server";
import { parsePrefs } from "@/lib/prefs";
import { SettingsClient } from "./settings-client";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("Paramètres", "Settings") };
}

export default async function SettingsPage() {
  const user = await requireUser();
  const en = (await getLang()) === "en";
  const role = user.roleKey as RoleKey;
  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7)); // Monday

  const [done, results, thisWeek, logins] = await Promise.all([
    prisma.consultationSession.count({ where: { userId: user.id, status: "COMPLETED" } }),
    prisma.assessmentResult.findMany({ where: { session: { userId: user.id } }, select: { totalScore: true } }),
    prisma.consultationSession.count({ where: { userId: user.id, status: "COMPLETED", completedAt: { gte: weekStart } } }),
    prisma.auditLog.findMany({ where: { userId: user.id, action: { in: ["auth.login", "auth.login_google", "auth.register", "auth.register_google", "auth.demo_login", "auth.password_reset"] } }, orderBy: { createdAt: "desc" }, take: 5, select: { action: true, createdAt: true, ip: true } }),
  ]);
  const avg = results.length ? Math.round(results.reduce((a, r) => a + r.totalScore, 0) / results.length) : null;
  const best = results.length ? Math.max(...results.map((r) => r.totalScore)) : null;

  return (
    <SettingsClient
      user={{
        name: user.name,
        email: user.email,
        role: en ? ROLE_META[role].labelEn : ROLE_META[role].label,
        isStudent: role === "STUDENT",
        university: user.university?.name ?? null,
        yearOfStudy: user.yearOfStudy,
        plan: en ? user.plan.nameEn : user.plan.name,
        createdAt: user.createdAt.toISOString(),
        lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
        google: !!user.googleId,
      }}
      prefs={parsePrefs(user.preferences)}
      stats={{ done, avg, best, thisWeek }}
      logins={logins.map((l) => ({ action: l.action, at: l.createdAt.toISOString(), ip: l.ip }))}
      permissions={ROLE_PERMISSIONS[role].map((p) => ({ key: p, label: en ? PERMISSIONS_EN[p] : PERMISSIONS[p] }))}
    />
  );
}
