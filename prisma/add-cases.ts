/**
 * Adds (or updates) the ophthalmology, gynaecology and pulmonology demo cases without
 * touching existing users, sessions or cases. Run with: npx tsx prisma/add-cases.ts
 */
import { PrismaClient } from "@prisma/client";
import { upsertCase } from "../src/lib/cases/repo";
import { MORE_CASES } from "../src/lib/cases/demo-cases-2";

const prisma = new PrismaClient();

async function main() {
  const author = await prisma.user.findFirst({ where: { roleKey: "TEACHER" }, orderBy: { createdAt: "asc" } });
  if (!author) throw new Error("Aucun enseignant en base : lancez d'abord npm run db:seed");
  for (const c of MORE_CASES) {
    const row = await upsertCase(prisma, { slug: c.slug, title: c.title, specialty: c.specialty, difficulty: c.difficulty, summary: c.summary, objectives: c.objectives, minutes: c.minutes, freeTier: c.freeTier }, c.content, {
      authorId: author.id,
      status: "PUBLISHED",
      reviewedBy: "Contenu de démonstration — à faire relire par les experts cliniques de la faculté avant tout usage formel",
      reviewNotes: "Cas fictif rédigé pour la démonstration du produit.",
    });
    console.log(`✓ ${row.slug}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
