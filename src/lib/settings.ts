import { z } from "zod";
import { prisma } from "@/lib/db";

export const SETTING_KEYS = {
  "ai.patientEffort": z.enum(["low", "medium", "high"]),
  "ai.feedbackEffort": z.enum(["low", "medium", "high"]),
  "voice.enabled": z.enum(["true", "false"]),
} as const;
export type SettingKey = keyof typeof SETTING_KEYS;

export const SETTING_DEFAULTS: Record<SettingKey, string> = {
  "ai.patientEffort": "low",
  "ai.feedbackEffort": "medium",
  "voice.enabled": "true",
};

export async function getSetting(key: SettingKey): Promise<string> {
  const row = await prisma.platformSetting.findUnique({ where: { key } });
  return row?.value ?? SETTING_DEFAULTS[key];
}
