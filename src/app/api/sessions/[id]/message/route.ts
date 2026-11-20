import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/api";
import { requireApiUser } from "@/lib/auth/session";
import { sendStudentMessage } from "@/lib/sim/service";
import { rateLimit } from "@/lib/rate-limit";

const Body = z.object({ text: z.string().trim().min(1).max(1000) });

export const POST = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireApiUser("simulation:run");
  if (!rateLimit(`msg:${user.id}`, 30, 60_000).ok) return NextResponse.json({ error: "Vous envoyez des messages trop vite." }, { status: 429 });
  const { id } = await ctx.params;
  const { text } = Body.parse(await req.json());
  return NextResponse.json(await sendStudentMessage(user, id, text));
});
