import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/api";
import { prisma } from "@/lib/db";
import { clientIp } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";
import { audit } from "@/lib/audit";

const Body = z.object({
  kind: z.enum(["CONTACT", "DEMO"]),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  organization: z.string().trim().max(200).optional(),
  role: z.string().trim().max(120).optional(),
  message: z.string().trim().min(10, "Écrivez au moins un court message").max(5000),
  website: z.string().max(0).optional(), // honeypot
});

export const POST = handle(async (req: Request) => {
  const ip = await clientIp();
  if (!rateLimit(`contact:${ip}`, 5, 60 * 60_000).ok) return NextResponse.json({ error: "Trop de demandes, réessayez plus tard." }, { status: 429 });
  const { website: _hp, ...body } = Body.parse(await req.json());
  const r = await prisma.contactRequest.create({ data: body });
  await audit("contact.submitted", { entity: "ContactRequest", entityId: r.id, ip, meta: { kind: body.kind } });
  return NextResponse.json({ ok: true });
});
