import { z } from "zod";

export const interviewSessionStatusSchema = z.enum([
  "active",
  "completed",
  "abandoned",
]);

export const interviewTurnKindSchema = z.enum(["primary", "follow_up"]);

export const interviewCategorySchema = z.enum([
  "behavioral",
  "motivation",
  "competency",
  "role_specific",
  "follow_up",
]);

export const questionSetSchema = z.object({
  title: z.string().min(1),
  questions: z
    .array(
      z.object({
        category: interviewCategorySchema,
        question: z.string().min(1),
      })
    )
    .min(3)
    .max(8),
});

export const followUpDecisionSchema = z
  .object({
    askFollowUp: z.boolean(),
    followUpQuestion: z.string().optional(),
    reason: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.askFollowUp) {
      const q = value.followUpQuestion?.trim() ?? "";
      if (!q) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "followUpQuestion is required when askFollowUp is true",
          path: ["followUpQuestion"],
        });
      }
    }
  });

const dimensionScoreSchema = z.number().int().min(1).max(5);

export const interviewFeedbackSchema = z.object({
  overallScore: z.number().int().min(0).max(100),
  dimensions: z.object({
    relevance: dimensionScoreSchema,
    specificity: dimensionScoreSchema,
    starStructure: dimensionScoreSchema,
    clarity: dimensionScoreSchema,
    roleAlignment: dimensionScoreSchema,
  }),
  strengths: z.array(z.string().min(1)).max(6),
  improvements: z.array(z.string().min(1)).max(6),
  missingDetails: z.array(z.string().min(1)).max(6),
  rewriteSuggestion: z.string().min(1),
});

/** Phrases that indicate hireability labeling (coaching must avoid these). */
export const BANNED_HIREABILITY_PHRASES = [
  "unhireable",
  "unhirable",
  "will not get the job",
  "won't get the job",
  "will never get hired",
  "not hireable",
  "no-hire",
  "no hire",
  "hire / no-hire",
  "you will not be hired",
  "guaranteed to fail",
  "pass probability",
  "hire probability",
] as const;

export type InterviewSessionStatus = z.infer<
  typeof interviewSessionStatusSchema
>;
export type InterviewTurnKind = z.infer<typeof interviewTurnKindSchema>;
export type InterviewCategory = z.infer<typeof interviewCategorySchema>;
export type QuestionSet = z.infer<typeof questionSetSchema>;
export type FollowUpDecision = z.infer<typeof followUpDecisionSchema>;
export type InterviewFeedback = z.infer<typeof interviewFeedbackSchema>;

export function parseQuestionSet(data: unknown): QuestionSet {
  return questionSetSchema.parse(data);
}

export function parseFollowUpDecision(data: unknown): FollowUpDecision {
  return followUpDecisionSchema.parse(data);
}

export function parseInterviewFeedback(data: unknown): InterviewFeedback {
  return interviewFeedbackSchema.parse(data);
}

export function safeParseInterviewFeedback(
  data: unknown
): InterviewFeedback | null {
  const result = interviewFeedbackSchema.safeParse(data);
  return result.success ? result.data : null;
}

/**
 * Lightweight safety check for coaching copy. Does not reject at the schema
 * layer (models may still err); use in tests and optional UI warnings.
 */
export function containsBannedHireabilityPhrases(text: string): boolean {
  const lower = text.toLowerCase();
  return BANNED_HIREABILITY_PHRASES.some((phrase) => lower.includes(phrase));
}

export function feedbackContainsBannedHireabilityPhrases(
  feedback: InterviewFeedback
): boolean {
  const parts = [
    feedback.rewriteSuggestion,
    ...feedback.strengths,
    ...feedback.improvements,
    ...feedback.missingDetails,
  ];
  return parts.some((part) => containsBannedHireabilityPhrases(part));
}
