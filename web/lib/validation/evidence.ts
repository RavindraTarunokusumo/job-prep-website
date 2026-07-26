import { z } from "zod";

export const evidenceSourceTypes = [
  "employment",
  "education",
  "volunteering",
  "freelance",
  "project",
  "competition",
  "other",
] as const;

export type EvidenceSourceType = (typeof evidenceSourceTypes)[number];

export const evidenceVerifications = [
  "imported",
  "inferred",
  "unconfirmed",
  "confirmed",
  "archived",
] as const;

export type EvidenceVerification = (typeof evidenceVerifications)[number];

export const starReadinessValues = ["draft", "ready", "archived"] as const;

export type StarReadiness = (typeof starReadinessValues)[number];

export const evidenceSourceTypeSchema = z.enum(evidenceSourceTypes);
export const evidenceVerificationSchema = z.enum(evidenceVerifications);
export const starReadinessSchema = z.enum(starReadinessValues);

export const createEvidenceSchema = z.object({
  title: z.string().trim().min(1).max(300),
  sourceType: evidenceSourceTypeSchema,
  organization: z.string().trim().max(300).optional(),
  roleTitle: z.string().trim().max(300).optional(),
  startDate: z.string().trim().max(40).optional(),
  endDate: z.string().trim().max(40).optional(),
  responsibilities: z.string().max(10000).optional(),
  achievements: z.string().max(10000).optional(),
  metrics: z.string().max(5000).optional(),
  verification: evidenceVerificationSchema.optional().default("unconfirmed"),
  sourceNote: z.string().trim().max(500).optional(),
});

export const updateEvidenceSchema = createEvidenceSchema.partial().extend({
  id: z.string().min(1),
});

export const createStarStorySchema = z.object({
  title: z.string().trim().min(1).max(300),
  situation: z.string().trim().min(1).max(8000),
  task: z.string().trim().min(1).max(8000),
  action: z.string().trim().min(1).max(8000),
  result: z.string().trim().min(1).max(8000),
  readiness: starReadinessSchema.optional().default("draft"),
  evidenceId: z.string().min(1).optional().nullable(),
  /** When true, evidenceId must point at confirmed evidence. */
  requireConfirmedEvidence: z.boolean().optional().default(false),
});

export const updateStarStorySchema = createStarStorySchema
  .partial()
  .extend({
    id: z.string().min(1),
  });

export type CreateEvidenceInput = z.infer<typeof createEvidenceSchema>;
export type UpdateEvidenceInput = z.infer<typeof updateEvidenceSchema>;
export type CreateStarStoryInput = z.infer<typeof createStarStorySchema>;
export type UpdateStarStoryInput = z.infer<typeof updateStarStorySchema>;
