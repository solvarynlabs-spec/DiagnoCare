import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/api";
import { clientIp } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";
import { DEMO_CASES } from "@/lib/cases/demo-cases";
import { scriptedEngine } from "@/lib/sim/engines/scripted";

const Body = z.object({ text: z.string().trim().min(1).max(300), lang: z.enum(["en", "fr"]).default("fr") });
const CASE = DEMO_CASES.find((c) => c.slug === "acute-chest-pain-58m")!;

/** Public, unauthenticated homepage demo — always uses the offline scripted engine. */
export const POST = handle(async (req: Request) => {
  if (!rateLimit(`demo:${await clientIp()}`, 40, 60 * 60_000).ok) return NextResponse.json({ error: "Limite de la démo atteinte — créez un compte gratuit pour continuer." }, { status: 429 });
  const { text, lang } = Body.parse(await req.json());
  const out = await scriptedEngine.respond({ content: CASE.content, history: [], question: text, lang });
  return NextResponse.json({ reply: out.reply, emotion: out.emotion, topics: out.topics });
});
