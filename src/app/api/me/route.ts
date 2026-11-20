import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/api";
import { prisma } from "@/lib/db";
import { HttpError, destroySession, requireApiUser, verifyPassword } from "@/lib/auth/session";
import { audit } from "@/lib/audit";
import { PrefsSchema, parsePrefs } from "@/lib/prefs";

const Patch = z.object({
  name: z.string().trim().min(2, "Nom trop court").max(80).optional(),
  yearOfStudy: z.number().int().min(1).max(7).nullable().optional(),
  preferences: PrefsSchema.partial().optional(),
});

/** Update the signed-in user's profile and/or preferences (partial). */
export const PATCH = handle(async (req: Request) => {
  const user = await requireApiUser();
  const body = Patch.parse(await req.json());
  const preferences = body.preferences ? JSON.stringify({ ...parsePrefs(user.preferences), ...body.preferences }) : undefined;
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { name: body.name, yearOfStudy: user.roleKey === "STUDENT" ? body.yearOfStudy : undefined, preferences },
    select: { name: true, yearOfStudy: true, preferences: true },
  });
  await audit("account.update", { userId: user.id, meta: { fields: Object.keys(body) } });
  return NextResponse.json({ ok: true, user: { ...updated, preferences: parsePrefs(updated.preferences) } });
});

const Del = z.object({ confirmEmail: z.string().email(), password: z.string().max(200).optional() });

/**
 * Close the account: deactivates it and removes personal data (name, e-mail, Google link),
 * keeping anonymised results so a faculty's statistics stay consistent.
 */
export const DELETE = handle(async (req: Request) => {
  const user = await requireApiUser();
  const { confirmEmail, password } = Del.parse(await req.json());
  if (confirmEmail.toLowerCase() !== user.email.toLowerCase()) throw new HttpError(400, "L'adresse e-mail ne correspond pas à votre compte.");
  if (!user.googleId && !(password && (await verifyPassword(password, user.passwordHash)))) throw new HttpError(400, "Mot de passe incorrect.");
  await prisma.user.update({
    where: { id: user.id },
    data: { active: false, name: "Compte supprimé", email: `deleted-${user.id}@diagnocare.invalid`, googleId: null, avatarUrl: null, preferences: "{}" },
  });
  await audit("account.delete", { userId: user.id });
  await destroySession();
  return NextResponse.json({ ok: true, redirect: "/" });
});
