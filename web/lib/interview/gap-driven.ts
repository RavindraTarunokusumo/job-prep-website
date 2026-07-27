import { selectGapDrivenTargets } from "@/lib/matching";
import type { RequirementMatchDraft } from "@/lib/validation/requirement-match";
import type { StarStoryRecord } from "@/lib/validation/ontology";
import { z } from "zod";

export const gapQuestionSchema = z.object({
  prompt: z.string().min(1).max(2000),
  category: z.enum(["behavioral", "competency", "technical", "concern"]),
  sourceRequirementKey: z.string().min(1),
  sourceRequirementText: z.string().min(1),
  sourceMatchType: z.string().min(1),
  groundingStoryId: z.string().nullable().optional(),
  followUpHint: z.string().max(1000).optional(),
});

export type GapQuestion = z.infer<typeof gapQuestionSchema>;

export const rehearsalPlanSchema = z.object({
  summary: z.string().min(1).max(2000),
  repeatQuestions: z.array(z.string()).max(10),
  evidenceActions: z.array(z.string()).max(10),
});

export type RehearsalPlan = z.infer<typeof rehearsalPlanSchema>;

const SENSITIVE =
  /\b(age|religion|pregnancy|disability|race|ethnicity|marital status|sexual orientation)\b/i;

/**
 * Generate interview questions from application gaps — not generic role banks only.
 * Grounding uses confirmed/ready STAR ids only when provided; never invents facts.
 */
export function generateGapDrivenQuestions(
  matches: Pick<
    RequirementMatchDraft,
    "matchType" | "importance" | "requirementText" | "requirementKey" | "starStoryId"
  >[],
  stories: Pick<StarStoryRecord, "id" | "title" | "readiness" | "verification">[] = [],
  options: { maxQuestions?: number } = {},
): GapQuestion[] {
  const maxQuestions = options.maxQuestions ?? 6;
  const targets = selectGapDrivenTargets(matches).slice(0, maxQuestions);
  const readyStories = stories.filter(
    (s) => s.readiness === "ready" && s.verification === "confirmed",
  );

  const questions: GapQuestion[] = [];
  for (const target of targets) {
    // Only ground on an explicitly linked STAR — never borrow an unrelated story.
    const story =
      (target.starStoryId
        ? readyStories.find((s) => s.id === target.starStoryId)
        : undefined) ?? null;
    const isTechnical =
      /sql|api|python|java|typescript|kubernetes|docker|system|code/i.test(
        target.requirementText,
      );
    const category = isTechnical
      ? "technical"
      : target.matchType === "gap"
        ? "concern"
        : "behavioral";

    const prompt =
      category === "technical"
        ? `Walk through a concrete example involving ${target.requirementText}. What did you personally do and what was the measurable result?`
        : category === "concern"
          ? `This role emphasises ${target.requirementText}, and your profile shows a gap. How would you ramp up using only experience you actually have?`
          : `Tell me about a time related to ${target.requirementText}. Use a real situation — do not invent details.`;

    if (SENSITIVE.test(prompt)) continue;

    questions.push(
      gapQuestionSchema.parse({
        prompt,
        category,
        sourceRequirementKey: target.requirementKey,
        sourceRequirementText: target.requirementText,
        sourceMatchType: target.matchType,
        groundingStoryId: story?.id ?? null,
        followUpHint:
          "Probe for metrics and personal ownership if the first answer is vague.",
      }),
    );
  }
  return questions;
}

export function buildRehearsalPlan(questions: GapQuestion[]): RehearsalPlan {
  return rehearsalPlanSchema.parse({
    summary:
      "Rehearse answers for the highest-risk gaps using only confirmed experience. Capture missing evidence before re-interviewing.",
    repeatQuestions: questions.slice(0, 5).map((q) => q.prompt),
    evidenceActions: [
      ...new Set(
        questions.map(
          (q) =>
            `Document real evidence for: ${q.sourceRequirementText} (source ${q.sourceRequirementKey})`,
        ),
      ),
    ].slice(0, 8),
  });
}
