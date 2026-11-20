import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { handle } from "@/lib/api";
import { clientIp, hashPassword } from "@/lib/auth/session";
import { audit } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";
import { DEMO_LOGIN_ENABLED } from "@/lib/demo";
import { matchesFingerprint, readResetToken, sendResetEmail, signResetToken } from "@/lib/auth/reset";
import { getLang } from "@/lib/i18n/server";

const Request_ = z.object({ email: z.string().email().max(200) });
const Confirm = z.object({
  token: z.string().min(20).max(2000),
  password: z.string().min(10, "Au moins 10 caractères").max(200).regex(/[A-Za-z]/, "Au moins une lettre").regex(/[0-9]/, "Au moins un chiffre"),
});

/** Step 1: request a reset link. Always answers the same way, whether or not the account exists. */
export const POST = handle(async (req: Request) => {
  const ip = await clientIp();
  const rl = rateLimit(`reset:${ip}`, 5, 15 * 60_000);
  if (!rl.ok) return NextResponse.json({ error: `Trop de demandes. Réessayez dans ${rl.retryAfter} s.` }, { status: 429 });
  const { email } = Request_.parse(await req.json());
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  let demoLink: string | undefined;
  if (user && user.active) {
    const origin = process.env.APP_URL || new URL(req.url).origin;
    const link = `${origin}/reset-password?token=${await signResetToken(user.id, user.passwordHash)}`;
    const mode = await sendResetEmail(user.email, user.name, link, await getLang());
    await audit("auth.reset_requested", { userId: user.id, ip });
    if (mode === "demo" && DEMO_LOGIN_ENABLED()) demoLink = link;
  }
  return NextResponse.json({ ok: true, demoLink });
});

/** Step 2: set the new password. */
export const PUT = handle(async (req: Request) => {
  const { token, password } = Confirm.parse(await req.json());
  const t = await readResetToken(token);
  const user = t ? await prisma.user.findUnique({ where: { id: t.userId } }) : null;
  if (!t || !user || !user.active || !matchesFingerprint(user.passwordHash, t.fp)) return NextResponse.json({ error: "Lien invalide ou expiré. Refaites une demande." }, { status: 400 });
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(password) } });
  await audit("auth.password_reset", { userId: user.id });
  return NextResponse.json({ ok: true });
});
