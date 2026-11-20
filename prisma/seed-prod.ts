/**
 * Production seed: roles, platform settings and the published case library.
 * Creates NO user account (the demo accounts of seed.ts have public passwords and must never
 * exist online). Idempotent: safe to run again after adding cases.
 *
 *   DATABASE_URL=... npx tsx prisma/seed-prod.ts   (with the PostgreSQL client generated)
 */
import { PrismaClient } from "@prisma/client";
import { ROLE_META, ROLE_PERMISSIONS, ROLES } from "../src/lib/rbac";
import { DEMO_CASES } from "../src/lib/cases/demo-cases";
import { seedDraftCases, upsertCase } from "../src/lib/cases/repo";
import { DRAFT_CASES } from "../src/lib/cases/drafts";

const prisma = new PrismaClient();

async function main() {
  for (const key of ROLES) {
    const data = { name: ROLE_META[key].label, description: ROLE_META[key].description, permissions: JSON.stringify(ROLE_PERMISSIONS[key]) };
    await prisma.role.upsert({ where: { key }, create: { key, ...data }, update: data });
  }
  console.log(`✓ ${ROLES.length} rôles`);

  for (const c of DEMO_CASES) {
    await upsertCase(prisma, { slug: c.slug, title: c.title, specialty: c.specialty, difficulty: c.difficulty, summary: c.summary, objectives: c.objectives, minutes: c.minutes, freeTier: c.freeTier }, c.content, {
      authorId: null,
      status: "PUBLISHED",
      reviewedBy: "Contenu de démonstration — à faire relire par les experts cliniques de la faculté avant tout usage formel",
      reviewNotes: "Cas fictif rédigé pour la démonstration du produit.",
    });
  }
  console.log(`✓ ${DEMO_CASES.length} cas cliniques`);
  const drafts = await seedDraftCases(prisma, DRAFT_CASES);
  console.log(`✓ ${drafts} nouveau(x) cas brouillon(s) en relecture (${DRAFT_CASES.length} au total, jamais écrasés)`);

  for (const [key, value] of [["ai.patientEffort", "low"], ["ai.feedbackEffort", "medium"], ["voice.enabled", "true"]]) {
    await prisma.platformSetting.upsert({ where: { key }, create: { key, value }, update: {} });
  }
  console.log("✓ réglages de la plateforme");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
