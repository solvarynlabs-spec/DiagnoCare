import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/api";
import { requireApiUser } from "@/lib/auth/session";
import { startSession } from "@/lib/sim/service";

const Body = z.object({ caseId: z.string().min(1), language: z.enum(["en", "fr"]).default("fr"), assignmentId: z.string().optional() });

export const POST = handle(async (req: Request) => {
  const user = await requireApiUser("simulation:run");
  const body = Body.parse(await req.json());
  const s = await startSession(user, body.caseId, body.language, body.assignmentId);
  return NextResponse.json({ id: s.id, url: `/app/consult/${s.id}` });
});
