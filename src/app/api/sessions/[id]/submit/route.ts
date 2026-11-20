import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/api";
import { requireApiUser } from "@/lib/auth/session";
import { submitSession } from "@/lib/sim/service";

const Body = z.object({
  differentials: z.array(z.string().trim().min(1).max(200)).max(10),
  finalDiagnosis: z.string().trim().min(2, "Indiquez votre diagnostic final").max(300),
  justification: z.string().trim().max(5000),
  managementActions: z.array(z.string().max(60)).max(30),
  managementNotes: z.string().trim().max(5000).default(""),
  // Optional, ungraded prescription exercise (free text, stored as written).
  prescription: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(120),
        dose: z.string().trim().max(80).default(""),
        route: z.string().trim().max(80).default(""),
        frequency: z.string().trim().max(80).default(""),
        duration: z.string().trim().max(80).default(""),
        notes: z.string().trim().max(300).default(""),
      }),
    )
    .max(15)
    .default([]),
});

export const POST = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireApiUser("simulation:run");
  const { id } = await ctx.params;
  const body = Body.parse(await req.json());
  const r = await submitSession(user, id, body);
  return NextResponse.json({ ...r, url: `/app/reports/${id}` });
});
