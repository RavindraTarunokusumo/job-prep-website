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

export const followUpDecisionSchema = z.object({
  askFollowUp: z.boolean(),
  followUpQuestion: z.string().optional(),
  reason: z.string().optional(),
});

export type InterviewSessionStatus = z.infer<
  typeof interviewSessionStatusSchema
>;
export type InterviewTurnKind = z.infer<typeof interviewTurnKindSchema>;
export type InterviewCategory = z.infer<typeof interviewCategorySchema>;
export type QuestionSet = z.infer<typeof questionSetSchema>;
export type FollowUpDecision = z.infer<typeof followUpDecisionSchema>;

export function parseQuestionSet(data: unknown): QuestionSet {
  return questionSetSchema.parse(data);
}

export function parseFollowUpDecision(data: unknown): FollowUpDecision {
  return followUpDecisionSchema.parse(data);
}
