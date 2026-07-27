import { z } from "zod";

export const readinessDimensionKeys = [
  "requirement_coverage",
  "evidence_strength",
  "cv_readiness",
  "interview_readiness",
  "preparation_completion",
  "application_execution",
] as const;

export type ReadinessDimensionKey = (typeof readinessDimensionKeys)[number];

export const readinessDimensionSchema = z.object({
  key: z.enum(readinessDimensionKeys),
  score: z.number().min(0).max(100).nullable(),
  confidence: z.number().min(0).max(1),
  explanation: z.string().max(2000),
  sourceRefs: z.array(z.string()).default([]),
  highestImpactAction: z.string().max(1000).nullable().optional(),
});

export const readinessDimensionsSchema = z.object({
  dimensions: z.array(readinessDimensionSchema).min(1),
});

export const readinessScoreRecordSchema = z.object({
  userId: z.string().min(1),
  jobDescriptionId: z.string().nullable().optional(),
  confidenceBand: z.enum(["ready", "partial", "sparse"]),
  dimensions: readinessDimensionsSchema,
  overallScore: z.number().int().min(0).max(100).nullable(),
  explanations: z.record(z.string(), z.string()).optional(),
  sourceTimestamps: z.record(z.string(), z.string()).optional(),
  version: z.number().int().positive(),
});

export type ReadinessDimension = z.infer<typeof readinessDimensionSchema>;
export type ReadinessDimensions = z.infer<typeof readinessDimensionsSchema>;
export type ReadinessScoreRecord = z.infer<typeof readinessScoreRecordSchema>;

const HIRE_PHRASES =
  /\b(hire probability|chance of (getting )?hired|you will (not )?get the job|guaranteed offer)\b/i;

export function readinessTextIsSafe(text: string): boolean {
  return !HIRE_PHRASES.test(text);
}
