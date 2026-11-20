import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { can, type Permission, type RoleKey, ROLE_META } from "@/lib/rbac";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, signSession, verifySession } from "./token";
import { planByKey } from "@/lib/billing/plans";

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 12);
}
export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export async function createSession(user: { id: string; roleKey: string; name: string }, opts: { remember?: boolean } = {}) {
  const token = await signSession({ sub: user.id, role: user.roleKey, name: user.name });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    // Without « Se souvenir de moi » the cookie lives until the browser closes (token still expires after 7 days).
    ...(opts.remember === false ? {} : { maxAge: SESSION_TTL_SECONDS }),
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

/** Returns the current user (fresh from DB, so deactivation/role changes apply immediately). */
export async function getCurrentUser() {
  const jar = await cookies();
  const claims = await verifySession(jar.get(SESSION_COOKIE)?.value);
  if (!claims) return null;
  const user = await prisma.user.findUnique({
    where: { id: claims.sub },
    include: { subscription: true, university: true },
  });
  if (!user || !user.active) return null;
  return { ...user, plan: planByKey(user.subscription?.status === "ACTIVE" ? user.subscription.plan : "FREE") };
}
export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/** For pages: redirect to login (or the user's home) when not allowed. */
export async function requireUser(opts?: { roles?: RoleKey[]; permission?: Permission }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (opts?.roles && !opts.roles.includes(user.roleKey as RoleKey)) redirect(ROLE_META[user.roleKey as RoleKey]?.home ?? "/");
  if (opts?.permission && !can(user.roleKey, opts.permission)) redirect(ROLE_META[user.roleKey as RoleKey]?.home ?? "/");
  return user;
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** For route handlers / server actions: throw 401/403 instead of redirecting. */
export async function requireApiUser(permission?: Permission) {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "Authentification requise");
  if (permission && !can(user.roleKey, permission)) throw new HttpError(403, "Vous n'avez pas l'autorisation pour cette action");
  return user;
}

export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "local";
}
