import { z } from "zod";

export const matchTypes = [
  "strong",
  "partial",
  "keyword_only",
  "transferable",
  "gap",
] as const;
export type MatchType = (typeof matchTypes)[number];

export const requirementImportances = ["required", "preferred", "other"] as const;
export type RequirementImportance = (typeof requirementImportances)[number];

export const userReviewStates = [
  "suggested",
  "confirmed",
  "rejected",
  "replaced",
] as const;
export type UserReviewState = (typeof userReviewStates)[number];

export const matchTypeSchema = z.enum(matchTypes);
export const requirementImportanceSchema = z.enum(requirementImportances);
export const userReviewStateSchema = z.enum(userReviewStates);

export const requirementMatchDraftSchema = z.object({
  userId: z.string().min(1),
  jobDescriptionId: z.string().min(1),
  requirementKey: z.string().min(1).max(300),
  requirementText: z.string().min(1).max(2000),
  importance: requirementImportanceSchema,
  matchType: matchTypeSchema,
  evidenceStrength: z.number().int().min(0).max(100),
  confidence: z.number().min(0).max(1),
  explanation: z.string().min(1).max(4000),
  evidenceId: z.string().min(1).nullable().optional(),
  skillId: z.string().min(1).nullable().optional(),
  starStoryId: z.string().min(1).nullable().optional(),
  userReview: userReviewStateSchema,
  safeAction: z.string().max(2000).nullable().optional(),
  version: z.number().int().positive(),
});

export type RequirementMatchDraft = z.infer<typeof requirementMatchDraftSchema>;

export const reviewMatchInputSchema = z.object({
  id: z.string().min(1),
  userReview: z.enum(["confirmed", "rejected", "replaced"]),
  evidenceId: z.string().min(1).nullable().optional(),
  skillId: z.string().min(1).nullable().optional(),
  starStoryId: z.string().min(1).nullable().optional(),
  explanation: z.string().max(4000).optional(),
});

export type ReviewMatchInput = z.infer<typeof reviewMatchInputSchema>;

/** Safe actions must not encourage inventing experience. */
const FABRICATION_PATTERNS =
  /\b(just invent|you should invent|fabricate experience|make up experience|lie about your|claim experience you (do not|don't) have)\b/i;

export function assertSafeActionText(text: string | null | undefined): string | null {
  if (text == null || text.trim() === "") return null;
  if (FABRICATION_PATTERNS.test(text)) {
    throw new Error("Safe actions must not encourage fabricating experience.");
  }
  return text.trim();
}
