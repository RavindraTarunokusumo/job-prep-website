import {
  generateObjectWithFallback,
  getOpenRouterModelId,
} from "@/lib/ai/openrouter";
import {
  followUpDecisionSchema,
  parseFollowUpDecision,
  type FollowUpDecision,
} from "@/lib/validation/interview";

export type DecideFollowUpInput = {
  question: string;
  answer: string;
  targetRole: string;
  category?: string | null;
};

const FOLLOW_UP_SYSTEM_PROMPT = `You are an expert interview coach deciding whether to ask ONE short contextual follow-up after a practice answer.

Rules:
- Set askFollowUp=true only when the answer is vague, lacks concrete evidence/metrics, skips key STAR pieces (situation/action/result), or needs one clarifying probe to be coachable.
- Set askFollowUp=false when the answer is already specific enough for useful coaching (even if imperfect).
- Prefer NOT asking a follow-up when the answer is empty of substance but still clear (feedback can cover it) OR when a follow-up would not add value.
- When askFollowUp=true, provide a single, concise followUpQuestion (one sentence) that probes for a missing detail (metric, action, result, ownership, or trade-off). Do not introduce a new unrelated topic.
- reason: brief internal note (optional) explaining why you asked or skipped.
- NEVER invent employers, projects, metrics, or skills the candidate did not mention.
- Do NOT use hireability labels, pass/fail language, or personality diagnoses.
- This is practice coaching only — not a real interview decision.`;

function buildFollowUpPrompt(input: DecideFollowUpInput): string {
  const parts = [
    `Target role: ${input.targetRole.trim()}`,
    input.category?.trim()
      ? `Question category: ${input.category.trim()}`
      : null,
    "",
    "Primary question:",
    input.question.trim(),
    "",
    "Candidate answer:",
    input.answer.trim(),
    "",
    "Return JSON: { askFollowUp: boolean, followUpQuestion?: string, reason?: string }.",
    "If askFollowUp is true, followUpQuestion is required and must be a single clear question.",
  ];

  return parts.filter((p) => p != null).join("\n");
}

export async function decideFollowUp(
  input: DecideFollowUpInput
): Promise<FollowUpDecision> {
  const question = input.question?.trim();
  const answer = input.answer?.trim();
  const targetRole = input.targetRole?.trim();

  if (!question) {
    throw new Error("Question is required to decide on a follow-up.");
  }
  if (!answer) {
    throw new Error("Answer is required to decide on a follow-up.");
  }
  if (!targetRole) {
    throw new Error("Target role is required to decide on a follow-up.");
  }

  const { object } = await generateObjectWithFallback<FollowUpDecision>({
    schema: followUpDecisionSchema,
    system: FOLLOW_UP_SYSTEM_PROMPT,
    prompt: buildFollowUpPrompt({
      ...input,
      question,
      answer,
      targetRole,
    }),
  });

  const decision = parseFollowUpDecision(object);

  // Defense in depth: never return an ask without a usable question.
  if (decision.askFollowUp) {
    const q = decision.followUpQuestion?.trim() ?? "";
    if (!q) {
      return { askFollowUp: false, reason: "Model omitted follow-up text." };
    }
    return {
      ...decision,
      followUpQuestion: q,
    };
  }

  return { askFollowUp: false, reason: decision.reason };
}

export function getInterviewFollowUpModelId(): string {
  return getOpenRouterModelId();
}
