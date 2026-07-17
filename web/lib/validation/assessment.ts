import { z } from "zod";

export const categorySlugSchema = z.enum([
  "numerical",
  "verbal",
  "logical",
  "situational_judgment",
  "work_style",
  "consulting_case",
]);

export const attemptStatusSchema = z.enum(["in_progress", "completed"]);

export const choiceSchema = z.object({
  key: z.string(),
  label: z.string(),
});

export const difficultySchema = z.enum(["easy", "medium", "hard"]);

export const questionPayloadSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  choices: z.array(choiceSchema).optional(),
  difficulty: difficultySchema.optional(),
  isReflection: z.boolean(),
});

export type CategorySlug = z.infer<typeof categorySlugSchema>;
export type AttemptStatus = z.infer<typeof attemptStatusSchema>;
export type Choice = z.infer<typeof choiceSchema>;
export type Difficulty = z.infer<typeof difficultySchema>;
export type QuestionPayload = z.infer<typeof questionPayloadSchema>;

export function parseCategorySlug(value: unknown): CategorySlug {
  return categorySlugSchema.parse(value);
}

export function parseAttemptStatus(value: unknown): AttemptStatus {
  return attemptStatusSchema.parse(value);
}

export function parseQuestionPayload(data: unknown): QuestionPayload {
  return questionPayloadSchema.parse(data);
}
