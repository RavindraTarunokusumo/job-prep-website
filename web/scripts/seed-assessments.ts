/**
 * Seed assessment categories and original MVP question bank.
 *
 * Usage (from web/):
 *   npm run seed:assessments
 *   npx tsx scripts/seed-assessments.ts
 *
 * Requires DATABASE_URL and applied Prisma migrations.
 */
import { PrismaClient } from "@prisma/client";

import { seedAssessments } from "../lib/assessment/seed";

async function main(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    const result = await seedAssessments(prisma);
    console.log(
      `Assessment seed complete: ${result.categories} categories, ${result.questions} questions.`
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
