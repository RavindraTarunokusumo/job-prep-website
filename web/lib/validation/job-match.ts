import { z } from "zod";

const scoreSchema = z.number().min(0).max(100);

export const jobRequirementsSchema = z.object({
  roleTitle: z.string().optional(),
  company: z.string().optional(),
  requiredSkills: z.array(z.string()),
  preferredSkills: z.array(z.string()),
  responsibilities: z.array(z.string()),
  experienceLevel: z.string().optional(),
  keywords: z.array(z.string()),
  tools: z.array(z.string()),
  certifications: z.array(z.string()),
  interviewTopics: z.array(z.string()),
  inferredNotes: z.array(z.string()),
});

export const jobMatchMatchedItemSchema = z.object({
  item: z.string(),
  evidence: z.string().optional(),
});

export const jobMatchMissingItemSchema = z.object({
  item: z.string(),
  importance: z.enum(["required", "preferred"]),
  suggestion: z.string().optional(),
});

export const jobMatchNextActionSchema = z.object({
  title: z.string(),
  detail: z.string(),
  priority: z.number(),
});

export const jobMatchResultSchema = z.object({
  matchScore: scoreSchema,
  matched: z.array(jobMatchMatchedItemSchema),
  missing: z.array(jobMatchMissingItemSchema),
  keywordGaps: z.array(z.string()),
  strengths: z.array(z.string()),
  gaps: z.array(z.string()),
  nextActions: z.array(jobMatchNextActionSchema),
  summary: z.string(),
});

export type JobRequirements = z.infer<typeof jobRequirementsSchema>;
export type JobMatchMatchedItem = z.infer<typeof jobMatchMatchedItemSchema>;
export type JobMatchMissingItem = z.infer<typeof jobMatchMissingItemSchema>;
export type JobMatchNextAction = z.infer<typeof jobMatchNextActionSchema>;
export type JobMatchResult = z.infer<typeof jobMatchResultSchema>;

export function parseJobRequirements(data: unknown): JobRequirements {
  return jobRequirementsSchema.parse(data);
}

export function parseJobMatchResult(data: unknown): JobMatchResult {
  return jobMatchResultSchema.parse(data);
}

export const MIN_JD_TEXT_LENGTH = 80;

export function assertJobDescriptionHasContent(rawText: string): string {
  const trimmed = rawText.trim();
  if (!trimmed) {
    throw new Error("Paste a job description before analyzing.");
  }
  if (trimmed.length < MIN_JD_TEXT_LENGTH) {
    throw new Error(
      "Job description is too short. Paste the full posting (at least a few sentences)."
    );
  }
  return trimmed;
}