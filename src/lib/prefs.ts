import { z } from "zod";

/** Per-user preferences, stored as JSON in User.preferences. */
export const PrefsSchema = z.object({
  avatarColor: z.enum(["blue", "cyan", "violet", "emerald", "amber", "rose"]).default("blue"),
  consultLang: z.preprocess((v) => (v === "en" ? "en" : "fr"), z.enum(["fr", "en"])).default("fr"),
  voiceReplies: z.boolean().default(false),
  sounds: z.boolean().default(true),
  reducedMotion: z.boolean().default(false),
  weeklyGoal: z.number().int().min(1).max(30).default(3),
  notifyAssignments: z.boolean().default(true),
  notifyResults: z.boolean().default(true),
  notifyNews: z.boolean().default(false),
});
export type Prefs = z.infer<typeof PrefsSchema>;

export const DEFAULT_PREFS: Prefs = PrefsSchema.parse({});

export function parsePrefs(raw: string | null | undefined): Prefs {
  try {
    const r = PrefsSchema.safeParse(JSON.parse(raw || "{}"));
    return r.success ? r.data : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

export const AVATAR_GRADIENT: Record<Prefs["avatarColor"], string> = {
  blue: "from-[#2f86ff] to-[#0a4fcc]",
  cyan: "from-[#38e1ff] to-[#0891b2]",
  violet: "from-[#a78bfa] to-[#6d28d9]",
  emerald: "from-[#34d399] to-[#047857]",
  amber: "from-[#fbbf24] to-[#b45309]",
  rose: "from-[#fb7185] to-[#be123c]",
};
