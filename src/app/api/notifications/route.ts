import { NextResponse } from "next/server";
import { handle } from "@/lib/api";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth/session";

export const GET = handle(async () => {
  const user = await requireApiUser();
  const items = await prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 20 });
  return NextResponse.json({ items, unread: items.filter((i) => !i.read).length });
});

/** Mark all as read. */
export const POST = handle(async () => {
  const user = await requireApiUser();
  await prisma.notification.updateMany({ where: { userId: user.id, read: false }, data: { read: true } });
  return NextResponse.json({ ok: true });
});
