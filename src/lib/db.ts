import { PrismaClient } from "@prisma/client";

// Hostinger writes the MySQL host as "localhost"; Node.js must use 127.0.0.1 (localhost can resolve to ::1).
if (process.env.DATABASE_URL?.includes("@localhost:")) process.env.DATABASE_URL = process.env.DATABASE_URL.replace("@localhost:", "@127.0.0.1:");

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/** Parse JSON columns defensively — corrupted rows must not crash a page. */
export function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
