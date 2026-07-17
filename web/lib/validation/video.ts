import { z } from "zod";

/** Well-known category tags used by seed + filters; free-form tags also allowed on create. */
export const videoCategoryTags = [
  "behavioral",
  "technical",
  "case",
  "motivation",
  "company_research",
  "salary_negotiation",
  "general",
] as const;

export const videoCategoryTagSchema = z.enum(videoCategoryTags);

export type VideoCategoryTag = z.infer<typeof videoCategoryTagSchema>;

const nonEmptyString = z.string().trim().min(1);

export const interviewVideoCreateSchema = z.object({
  title: nonEmptyString.max(200),
  url: z.string().trim().url(),
  categoryTags: z.array(nonEmptyString.max(64)).min(1).max(20),
  targetRoles: z.array(nonEmptyString.max(120)).max(20).default([]),
  targetIndustries: z.array(nonEmptyString.max(120)).max(20).default([]),
  experienceLevels: z.array(nonEmptyString.max(64)).max(20).default([]),
  summary: z.string().trim().max(2000).optional().nullable(),
  transcript: z.string().trim().max(50000).optional().nullable(),
  published: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export type InterviewVideoCreate = z.infer<typeof interviewVideoCreateSchema>;

export const videoFiltersSchema = z.object({
  category: z.string().trim().min(1).optional(),
  role: z.string().trim().min(1).optional(),
  industry: z.string().trim().min(1).optional(),
  experience: z.string().trim().min(1).optional(),
  q: z.string().trim().min(1).max(200).optional(),
});

export type VideoFilters = z.infer<typeof videoFiltersSchema>;

export function parseInterviewVideoCreate(data: unknown): InterviewVideoCreate {
  return interviewVideoCreateSchema.parse(data);
}

export function parseVideoFilters(data: unknown): VideoFilters {
  return videoFiltersSchema.parse(data);
}

/** Split comma-separated form input into trimmed unique tags. */
export function parseTagList(value: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of value.split(",")) {
    const tag = part.trim();
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
  }
  return out;
}
