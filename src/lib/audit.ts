import { prisma } from "@/lib/db";

export async function audit(action: string, opts: { userId?: string | null; entity?: string; entityId?: string; meta?: unknown; ip?: string } = {}) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        userId: opts.userId ?? null,
        entity: opts.entity,
        entityId: opts.entityId,
        meta: opts.meta === undefined ? null : JSON.stringify(opts.meta),
        ip: opts.ip,
      },
    });
  } catch (e) {
    console.error("audit log failed", e);
  }
}

export async function notify(userId: string, title: string, body: string, href?: string) {
  await prisma.notification.create({ data: { userId, title, body, href } });
}
