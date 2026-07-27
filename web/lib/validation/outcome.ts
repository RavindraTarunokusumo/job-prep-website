import { z } from "zod";

export const outcomeStages = [
  "applied",
  "screening",
  "interview",
  "final",
  "offer",
  "rejected",
  "withdrawn",
  "no_response",
] as const;

export type OutcomeStage = (typeof outcomeStages)[number];

export const outcomeStageSchema = z.enum(outcomeStages);

export const applicationOutcomeInputSchema = z.object({
  jobDescriptionId: z.string().min(1).optional().nullable(),
  jobApplicationId: z.string().min(1).optional().nullable(),
  stage: outcomeStageSchema,
  outcome: z.string().max(200).optional().nullable(),
  stageDate: z.string().datetime().optional().nullable(),
  employerFeedback: z.string().max(8000).optional().nullable(),
  userInterpretation: z.string().max(8000).optional().nullable(),
  perceivedBlockers: z.string().max(4000).optional().nullable(),
  isSensitive: z.boolean().optional().default(true),
});

export type ApplicationOutcomeInput = z.infer<typeof applicationOutcomeInputSchema>;

export const outcomeInsightSchema = z.object({
  label: z.string(),
  sampleSize: z.number().int().min(0),
  rate: z.number().min(0).max(1).nullable(),
  caveat: z.string(),
});

export type OutcomeInsight = z.infer<typeof outcomeInsightSchema>;
