import { generateObject } from "ai";
import { z } from "zod";
import { getOpenRouterModel, getOpenRouterModelId } from "@/lib/ai/openrouter";
import {
  resumeReviewResultSchema,
  type ResumeReviewResult,
} from "@/lib/validation/resume-review";

export type ReviewInput = {
  targetRole: string;
  experienceLevel: string;
  resumeText: string;
  parsedJson?: unknown;
};

const bulletRewriteSchema = z.object({
  suggestions: z.array(z.string()).min(1).max(3),
});

const REVIEW_SYSTEM_PROMPT = `You are a practical CV/resume coach helping job seekers improve their application materials.

Rules:
- Ground all feedback in the provided resume text and target role only.
- Never invent experience, employers, dates, titles, or metrics the candidate did not provide.
- Scores are 0-100 integers. Do not claim hire probability or guaranteed interview outcomes.
- Be specific: reference actual sections, skills, or gaps visible in the resume.
- priorityActions: lower priority number = more urgent (1 is highest).
- rewriteSuggestions: each must include an original bullet taken verbatim from the resume; suggested rewrites may rephrase or add placeholder metrics only when the resume already implies scale (e.g. "improved performance" → suggest adding a metric the user should fill in, marked with [your metric]).
- sectionScores: cover relevant sections (e.g. Summary, Experience, Skills, Education) with brief notes.`;

const REWRITE_SYSTEM_PROMPT = `You are a resume bullet coach. Rewrite the given bullet for clarity and impact.

Rules:
- Return 1-3 alternative bullet phrasings as strings.
- Do not invent employers, dates, technologies, or metrics not supported by the original bullet or surrounding context.
- You may use [metric] placeholders when quantification is missing but would help.
- Keep each suggestion concise and ATS-friendly.`;

function buildReviewPrompt(input: ReviewInput): string {
  const parts = [
    `Target role: ${input.targetRole}`,
    `Experience level: ${input.experienceLevel}`,
    "",
    "Resume text:",
    input.resumeText,
  ];

  if (input.parsedJson != null) {
    parts.push(
      "",
      "Structured resume JSON (for reference):",
      JSON.stringify(input.parsedJson, null, 2)
    );
  }

  return parts.join("\n");
}

export async function generateResumeReview(
  input: ReviewInput
): Promise<ResumeReviewResult> {
  const model = getOpenRouterModel();

  const { object } = await generateObject({
    model,
    schema: resumeReviewResultSchema,
    system: REVIEW_SYSTEM_PROMPT,
    prompt: buildReviewPrompt(input),
  });

  return object;
}

export function getReviewModelId(): string {
  return getOpenRouterModelId();
}

export async function rewriteResumeBullet(input: {
  original: string;
  surroundingContext?: string;
}): Promise<string[]> {
  const trimmed = input.original.trim();
  if (!trimmed) {
    throw new Error("Original bullet text is required.");
  }

  const model = getOpenRouterModel();

  const contextBlock = input.surroundingContext?.trim()
    ? `\n\nSurrounding context:\n${input.surroundingContext.trim()}`
    : "";

  const { object } = await generateObject({
    model,
    schema: bulletRewriteSchema,
    system: REWRITE_SYSTEM_PROMPT,
    prompt: `Original bullet:\n${trimmed}${contextBlock}`,
  });

  return object.suggestions;
}