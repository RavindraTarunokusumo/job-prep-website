/**
 * Seed curated interview video metadata (human-made / external hosts).
 *
 * Usage (from web/):
 *   npm run seed:videos
 *   npx tsx scripts/seed-videos.ts
 *
 * Requires DATABASE_URL and applied Prisma migrations.
 */
import { PrismaClient } from "@prisma/client";

import { seedInterviewVideos } from "../lib/videos/seed";

async function main(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    const result = await seedInterviewVideos(prisma);
    console.log(
      `Interview video seed complete: ${result.count} rows (${result.published} published).`
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
