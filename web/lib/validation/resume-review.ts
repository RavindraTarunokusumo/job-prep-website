import { z } from "zod";

const scoreSchema = z.number().min(0).max(100);

export const resumeReviewSectionScoreSchema = z.object({
  section: z.string(),
  score: scoreSchema,
  note: z.string().optional(),
});

export const resumeReviewPriorityActionSchema = z.object({
  title: z.string(),
  detail: z.string(),
  priority: z.number(),
});

export const resumeReviewRewriteSuggestionSchema = z.object({
  original: z.string(),
  suggested: z.string(),
  rationale: z.string(),
});

export const resumeReviewResultSchema = z.object({
  overallScore: scoreSchema,
  sectionScores: z.array(resumeReviewSectionScoreSchema),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  atsRisks: z.array(z.string()),
  missingMetrics: z.array(z.string()),
  priorityActions: z.array(resumeReviewPriorityActionSchema),
  rewriteSuggestions: z.array(resumeReviewRewriteSuggestionSchema),
  summary: z.string(),
});

export type ResumeReviewSectionScore = z.infer<
  typeof resumeReviewSectionScoreSchema
>;
export type ResumeReviewPriorityAction = z.infer<
  typeof resumeReviewPriorityActionSchema
>;
export type ResumeReviewRewriteSuggestion = z.infer<
  typeof resumeReviewRewriteSuggestionSchema
>;
export type ResumeReviewResult = z.infer<typeof resumeReviewResultSchema>;

export function parseResumeReviewResult(data: unknown): ResumeReviewResult {
  return resumeReviewResultSchema.parse(data);
}
