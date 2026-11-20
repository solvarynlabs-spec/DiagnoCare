import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { handle } from "@/lib/api";
import { clientIp, hashPassword } from "@/lib/auth/session";
import { audit, notify } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";

const Body = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email().max(200),
  password: z
    .string()
    .min(10, "Au moins 10 caractères")
    .max(200)
    .regex(/[A-Za-z]/, "Au moins une lettre")
    .regex(/[0-9]/, "Au moins un chiffre"),
  role: z.enum(["STUDENT", "TEACHER"]),
  yearOfStudy: z.coerce.number().int().min(1).max(10).optional(),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: "Vous devez accepter les conditions et l'avertissement d'usage pédagogique" }) }),
});

export const POST = handle(async (req: Request) => {
  const ip = await clientIp();
  if (!rateLimit(`register:${ip}`, 5, 60 * 60_000).ok) return NextResponse.json({ error: "Trop d'inscriptions depuis cette adresse. Réessayez plus tard." }, { status: 429 });

  const body = Body.parse(await req.json());
  if (await prisma.user.findUnique({ where: { email: body.email } })) {
    return NextResponse.json({ error: "Un compte existe déjà avec cet e-mail" }, { status: 409 });
  }
  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      passwordHash: await hashPassword(body.password),
      roleKey: body.role,
      yearOfStudy: body.role === "STUDENT" ? body.yearOfStudy ?? null : null,
      subscription: { create: { plan: "FREE", status: "ACTIVE", provider: "demo" } },
    },
  });
  await audit("auth.register", { userId: user.id, ip, meta: { role: body.role } });
  await notify(user.id, "Bienvenue sur DiagnoCare", body.role === "STUDENT" ? "Commencez par un cas « Fondamental » pour découvrir le déroulé de la consultation." : "Créez votre premier groupe et assignez un cas à vos étudiants.", body.role === "STUDENT" ? "/app/cases" : "/teach");
  // No automatic sign-in: the new user signs in explicitly before reaching the dashboard.
  return NextResponse.json({ ok: true, redirect: "/login?registered=1" });
});
