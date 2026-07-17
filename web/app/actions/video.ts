"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";

import {
  getProfileForUser,
  requireUser,
} from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { seedInterviewVideos } from "@/lib/videos/seed";
import {
  interviewVideoCreateSchema,
  parseVideoFilters,
  type VideoFilters,
} from "@/lib/validation/video";

export type VideoListItem = {
  id: string;
  title: string;
  url: string;
  categoryTags: string[];
  targetRoles: string[];
  targetIndustries: string[];
  experienceLevels: string[];
  summary: string | null;
  transcript: string | null;
  published: boolean;
  sortOrder: number;
};

function toListItem(row: {
  id: string;
  title: string;
  url: string;
  categoryTags: string[];
  targetRoles: string[];
  targetIndustries: string[];
  experienceLevels: string[];
  summary: string | null;
  transcript: string | null;
  published: boolean;
  sortOrder: number;
}): VideoListItem {
  return {
    id: row.id,
    title: row.title,
    url: row.url,
    categoryTags: row.categoryTags,
    targetRoles: row.targetRoles,
    targetIndustries: row.targetIndustries,
    experienceLevels: row.experienceLevels,
    summary: row.summary,
    transcript: row.transcript,
    published: row.published,
    sortOrder: row.sortOrder,
  };
}

function matchesFilterList(
  values: string[],
  filter: string | undefined
): boolean {
  if (!filter) return true;
  // Empty dimension on a video means "applies to all"
  if (values.length === 0) return true;
  const needle = filter.toLowerCase();
  return values.some((v) => v.toLowerCase().includes(needle));
}

function applyClientFilters(
  rows: VideoListItem[],
  filters: VideoFilters
): VideoListItem[] {
  return rows.filter((video) => {
    if (filters.category) {
      const needle = filters.category.toLowerCase();
      if (
        !video.categoryTags.some((t) => t.toLowerCase().includes(needle))
      ) {
        return false;
      }
    }
    if (!matchesFilterList(video.targetRoles, filters.role)) return false;
    if (!matchesFilterList(video.targetIndustries, filters.industry)) {
      return false;
    }
    if (!matchesFilterList(video.experienceLevels, filters.experience)) {
      return false;
    }
    if (filters.q) {
      const q = filters.q.toLowerCase();
      const hay = `${video.title} ${video.summary ?? ""} ${video.categoryTags.join(" ")}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

async function loadPublishedVideos(): Promise<VideoListItem[]> {
  const rows = await prisma.interviewVideo.findMany({
    where: { published: true },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
  });
  return rows.map(toListItem);
}

/**
 * List published videos with optional filters. Seeds sample rows once if empty.
 */
export async function listVideosAction(rawFilters?: unknown): Promise<{
  videos: VideoListItem[];
  seeded: boolean;
  seedHint: string | null;
}> {
  await requireUser();

  const filters = rawFilters
    ? parseVideoFilters(rawFilters)
    : ({} as VideoFilters);

  let videos = await loadPublishedVideos();
  let seeded = false;
  let seedHint: string | null = null;

  if (videos.length === 0) {
    try {
      await seedInterviewVideos(prisma);
      videos = await loadPublishedVideos();
      seeded = true;
      seedHint =
        "Loaded sample human-made interview video placeholders. Replace with licensed content for production.";
    } catch {
      seedHint =
        "Video library is empty. Run npm run seed:videos after migrations, or add entries via Admin.";
    }
  }

  return {
    videos: applyClientFilters(videos, filters),
    seeded,
    seedHint,
  };
}

/**
 * Create a global library entry.
 * MVP authz: any authenticated onboarded user may write (no ownership / no role CMS).
 */
export async function createVideoAction(
  input: unknown
): Promise<
  { ok: true; id: string } | { ok: false; error: string }
> {
  const user = await requireUser();
  const profile = await getProfileForUser(user.id);
  if (!profile?.onboardingCompletedAt) {
    return {
      ok: false,
      error: "Complete onboarding before adding library videos.",
    };
  }

  const parsed = interviewVideoCreateSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      ok: false,
      error: first?.message ?? "Invalid video entry.",
    };
  }

  const data = parsed.data;

  try {
    const created = await prisma.interviewVideo.create({
      data: {
        title: data.title,
        url: data.url,
        categoryTags: data.categoryTags,
        targetRoles: data.targetRoles,
        targetIndustries: data.targetIndustries,
        experienceLevels: data.experienceLevels,
        summary: data.summary ?? null,
        transcript: data.transcript ?? null,
        published: data.published,
        sortOrder: data.sortOrder,
      } satisfies Prisma.InterviewVideoCreateInput,
    });

    revalidatePath("/videos");
    revalidatePath("/videos/admin");
    return { ok: true, id: created.id };
  } catch {
    return { ok: false, error: "Could not save video entry. Try again." };
  }
}

/** Distinct facet values from published videos for filter controls. */
export async function listVideoFacetsAction(): Promise<{
  categories: string[];
  roles: string[];
  industries: string[];
  experienceLevels: string[];
}> {
  await requireUser();
  const rows = await prisma.interviewVideo.findMany({
    where: { published: true },
    select: {
      categoryTags: true,
      targetRoles: true,
      targetIndustries: true,
      experienceLevels: true,
    },
  });

  const uniq = (values: string[]) =>
    [...new Set(values.map((v) => v.trim()).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b)
    );

  return {
    categories: uniq(rows.flatMap((r) => r.categoryTags)),
    roles: uniq(rows.flatMap((r) => r.targetRoles)),
    industries: uniq(rows.flatMap((r) => r.targetIndustries)),
    experienceLevels: uniq(rows.flatMap((r) => r.experienceLevels)),
  };
}
