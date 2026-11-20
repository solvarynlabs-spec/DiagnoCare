import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/api";
import { prisma } from "@/lib/db";
import { HttpError, requireApiUser } from "@/lib/auth/session";
import { planByKey } from "@/lib/billing/plans";
import { paymentProvider } from "@/lib/billing/providers";
import { normalizeDzPhone } from "@/lib/billing/sofizpay";
import { audit, notify } from "@/lib/audit";

const Body = z.object({ plan: z.enum(["FREE", "STUDENT_PRO"]), interval: z.enum(["MONTH", "YEAR"]).default("MONTH"), phone: z.string().max(32).optional() });

export const POST = handle(async (req: Request) => {
  const user = await requireApiUser();
  const { plan: planKey, interval, phone: rawPhone } = Body.parse(await req.json());
  if (user.subscription?.plan === "UNIVERSITY") throw new HttpError(409, "Votre accès est géré par votre faculté.");
  const plan = planByKey(planKey);
  const provider = paymentProvider();

  if (planKey === "FREE") {
    await provider.cancel(user.subscription?.providerRef ?? null);
    await prisma.subscription.upsert({
      where: { userId: user.id },
      create: { userId: user.id, plan: "FREE", status: "ACTIVE", provider: provider.id },
      update: { plan: "FREE", status: "ACTIVE", providerRef: null, currentPeriodEnd: null },
    });
    await audit("billing.downgrade", { userId: user.id });
    return NextResponse.json({ ok: true });
  }

  let phone: string | undefined;
  if (provider.needsPhone) {
    phone = normalizeDzPhone(rawPhone ?? "") ?? undefined;
    if (!phone) throw new HttpError(422, "Entrez un numéro de mobile algérien valide (ex. 0550 12 34 56).");
  }
  const origin = process.env.APP_URL || new URL(req.url).origin;
  const result = await provider.checkout({ userId: user.id, email: user.email, name: user.name, phone, origin, plan, interval });
  if (result.status === "redirect") {
    await audit("billing.checkout", { userId: user.id, meta: { plan: plan.key, interval, provider: provider.id, payment: result.providerRef } });
    return NextResponse.json({ redirect: result.redirectUrl });
  }

  const periodEnd = new Date(Date.now() + (interval === "YEAR" ? 365 : 30) * 864e5);
  const amount = (interval === "YEAR" ? plan.priceYearly : plan.priceMonthly) * 100;
  await prisma.$transaction([
    prisma.subscription.upsert({
      where: { userId: user.id },
      create: { userId: user.id, plan: plan.key, status: "ACTIVE", interval, provider: provider.id, providerRef: result.providerRef, currentPeriodEnd: periodEnd },
      update: { plan: plan.key, status: "ACTIVE", interval, provider: provider.id, providerRef: result.providerRef, currentPeriodEnd: periodEnd },
    }),
    prisma.payment.create({
      data: { userId: user.id, amountCents: amount, currency: "DZD", plan: plan.key, status: provider.live ? "SUCCEEDED" : "DEMO", provider: provider.id, providerRef: result.providerRef, description: `${plan.name} — ${interval === "YEAR" ? "annuel" : "mensuel"}${provider.live ? "" : " (paiement de démonstration, aucun débit)"}` },
    }),
  ]);
  await notify(user.id, `Vous êtes passé(e) à la formule ${plan.name}`, "Vos nouvelles fonctionnalités sont disponibles.", "/app/billing");
  await audit("billing.upgrade", { userId: user.id, meta: { plan: plan.key, interval, provider: provider.id } });
  return NextResponse.json({ ok: true });
});
