import type { PrismaClient } from "@prisma/client";

import { SEED_INTERVIEW_VIDEOS } from "./seed-data";

/**
 * Idempotent interview video seed.
 * Upserts by fixed primary key id so re-runs refresh metadata.
 */
export async function seedInterviewVideos(prisma: PrismaClient): Promise<{
  count: number;
  published: number;
}> {
  let published = 0;

  for (const video of SEED_INTERVIEW_VIDEOS) {
    await prisma.interviewVideo.upsert({
      where: { id: video.id },
      create: {
        id: video.id,
        title: video.title,
        url: video.url,
        categoryTags: video.categoryTags,
        targetRoles: video.targetRoles,
        targetIndustries: video.targetIndustries,
        experienceLevels: video.experienceLevels,
        summary: video.summary,
        transcript: video.transcript,
        published: video.published,
        sortOrder: video.sortOrder,
      },
      update: {
        title: video.title,
        url: video.url,
        categoryTags: video.categoryTags,
        targetRoles: video.targetRoles,
        targetIndustries: video.targetIndustries,
        experienceLevels: video.experienceLevels,
        summary: video.summary,
        transcript: video.transcript,
        published: video.published,
        sortOrder: video.sortOrder,
      },
    });
    if (video.published) {
      published += 1;
    }
  }

  return { count: SEED_INTERVIEW_VIDEOS.length, published };
}
