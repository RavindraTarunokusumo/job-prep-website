import {
  generateObjectWithFallback,
  getOpenRouterModelId,
} from "@/lib/ai/openrouter";
import {
  interviewFeedbackSchema,
  parseInterviewFeedback,
  type InterviewFeedback,
} from "@/lib/validation/interview";

export type AnswerFeedbackInput = {
  question: string;
  answer: string;
  targetRole: string;
  category?: string | null;
  /** Optional follow-up Q&A when scoring a primary after follow-up resolved. */
  followUpQuestion?: string | null;
  followUpAnswer?: string | null;
};

const FEEDBACK_SYSTEM_PROMPT = `You are an expert interview coach giving structured practice feedback on a text mock-interview answer.

Rules:
- Score coaching quality only — overallScore is 0–100 practice guidance, NOT hire probability or pass chance.
- Dimension scores are integers 1–5: relevance, specificity, starStructure, clarity, roleAlignment.
- Ground every strength, improvement, missing detail, and rewrite in the provided question(s) and answer(s) plus target role.
- NEVER invent employers, projects, metrics, skills, or achievements the candidate did not state. You may suggest placeholders like [metric] in rewrites.
- rewriteSuggestion: one improved full answer the candidate could practice saying; must be non-empty and useful.
- strengths / improvements / missingDetails: short actionable bullets (max 6 each); empty arrays allowed when nothing fits.
- Do NOT use hireability labels (e.g. "unhireable", "will not get the job", "no-hire", hire/pass probability).
- Do NOT diagnose personality. Be specific and kind — practice coaching only.`;

function buildFeedbackPrompt(input: AnswerFeedbackInput): string {
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
  ];

  if (input.followUpQuestion?.trim() && input.followUpAnswer?.trim()) {
    parts.push(
      "",
      "Follow-up question:",
      input.followUpQuestion.trim(),
      "",
      "Follow-up answer:",
      input.followUpAnswer.trim()
    );
  }

  parts.push(
    "",
    "Return JSON with: overallScore (0-100 int), dimensions { relevance, specificity, starStructure, clarity, roleAlignment } each 1-5 int, strengths[], improvements[], missingDetails[], rewriteSuggestion (non-empty string).",
    "Coaching feedback only — not a hiring decision."
  );

  return parts.filter((p) => p != null).join("\n");
}

export async function generateAnswerFeedback(
  input: AnswerFeedbackInput
): Promise<InterviewFeedback> {
  const question = input.question?.trim();
  const answer = input.answer?.trim();
  const targetRole = input.targetRole?.trim();

  if (!question) {
    throw new Error("Question is required to generate answer feedback.");
  }
  if (!answer) {
    throw new Error("Answer is required to generate answer feedback.");
  }
  if (!targetRole) {
    throw new Error("Target role is required to generate answer feedback.");
  }

  const { object } = await generateObjectWithFallback<InterviewFeedback>({
    schema: interviewFeedbackSchema,
    system: FEEDBACK_SYSTEM_PROMPT,
    prompt: buildFeedbackPrompt({
      ...input,
      question,
      answer,
      targetRole,
    }),
  });

  return parseInterviewFeedback(object);
}

export function getInterviewFeedbackModelId(): string {
  return getOpenRouterModelId();
}
