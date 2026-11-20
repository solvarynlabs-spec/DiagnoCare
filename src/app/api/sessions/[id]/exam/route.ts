import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/api";
import { requireApiUser } from "@/lib/auth/session";
import { performExam } from "@/lib/sim/service";
import { getLang } from "@/lib/i18n/server";

const Body = z.object({ kind: z.enum(["PHYSICAL", "INVESTIGATION"]), code: z.string().min(1).max(60) });

export const POST = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireApiUser("simulation:run");
  const { id } = await ctx.params;
  const { kind, code } = Body.parse(await req.json());
  return NextResponse.json(await performExam(user, id, kind, code, await getLang()));
});
