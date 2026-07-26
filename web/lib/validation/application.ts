import { z } from "zod";

export const applicationStages = [
  "interested",
  "preparing",
  "applied",
  "interview",
  "offer",
  "rejected",
  "withdrawn",
] as const;

export type ApplicationStage = (typeof applicationStages)[number];

export const applicationStatusSchema = z.enum(["active", "archived"]);

export const applicationStageSchema = z.enum(applicationStages);

export const createApplicationSchema = z.object({
  company: z.string().trim().min(1).max(200),
  role: z.string().trim().min(1).max(200),
  stage: applicationStageSchema.optional().default("interested"),
  sourceUrl: z.string().trim().url().max(2000).optional().or(z.literal("")),
  location: z.string().trim().max(200).optional(),
  appliedAt: z.string().datetime().optional().nullable(),
  closingDate: z.string().datetime().optional().nullable(),
  nextAction: z.string().trim().max(500).optional(),
  nextActionDue: z.string().datetime().optional().nullable(),
  contactName: z.string().trim().max(200).optional(),
  contactEmail: z.string().trim().email().max(320).optional().or(z.literal("")),
  notes: z.string().max(10000).optional(),
  jobDescriptionId: z.string().min(1).optional().nullable(),
  jobMatchAnalysisId: z.string().min(1).optional().nullable(),
  applicationDraftId: z.string().min(1).optional().nullable(),
  interviewSessionId: z.string().min(1).optional().nullable(),
  preparationPlanId: z.string().min(1).optional().nullable(),
});

export const updateApplicationSchema = createApplicationSchema
  .partial()
  .extend({
    id: z.string().min(1),
  });

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;
