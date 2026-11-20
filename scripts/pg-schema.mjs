// Generates prisma/schema.postgres.prisma from the SQLite schema used in local development.
// Production (Vercel + Neon) uses PostgreSQL; the models are identical.
import { readFileSync, writeFileSync } from "node:fs";

const src = readFileSync("prisma/schema.prisma", "utf8");
if (!src.includes('provider = "sqlite"')) throw new Error("prisma/schema.prisma: provider sqlite introuvable");
const out = src.replace('provider = "sqlite"', 'provider = "postgresql"');
writeFileSync("prisma/schema.postgres.prisma", `// GÉNÉRÉ par scripts/pg-schema.mjs — ne pas modifier à la main.\n${out}`);
console.log("prisma/schema.postgres.prisma généré (PostgreSQL)");
