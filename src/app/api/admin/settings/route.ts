import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/api";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth/session";
import { audit } from "@/lib/audit";
import { SETTING_KEYS } from "@/lib/settings";

const Body = z.object({ key: z.enum(Object.keys(SETTING_KEYS) as [keyof typeof SETTING_KEYS]), value: z.string() });

export const PUT = handle(async (req: Request) => {
  const admin = await requireApiUser("platform:settings");
  const { key, value } = Body.parse(await req.json());
  SETTING_KEYS[key].parse(value);
  await prisma.platformSetting.upsert({ where: { key }, create: { key, value }, update: { value } });
  await audit("admin.setting", { userId: admin.id, meta: { key, value } });
  return NextResponse.json({ ok: true });
});
