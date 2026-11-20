import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/api";
import { prisma } from "@/lib/db";
import { hashPassword, requireApiUser, verifyPassword } from "@/lib/auth/session";
import { audit } from "@/lib/audit";

const Body = z.object({
  current: z.string().min(1).max(200),
  next: z.string().min(10, "Au moins 10 caractères").max(200).regex(/[A-Za-z]/, "Au moins une lettre").regex(/[0-9]/, "Au moins un chiffre"),
  locale: z.enum(["en", "fr"]).optional(),
});

export const POST = handle(async (req: Request) => {
  const user = await requireApiUser();
  const body = Body.parse(await req.json());
  if (!(await verifyPassword(body.current, user.passwordHash))) return NextResponse.json({ error: "Mot de passe actuel incorrect" }, { status: 400 });
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(body.next) } });
  await audit("auth.password_change", { userId: user.id });
  return NextResponse.json({ ok: true });
});
