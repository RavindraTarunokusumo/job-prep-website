import {
  generateObjectWithFallback,
  getOpenRouterModelId,
} from "@/lib/ai/openrouter";
import type { JobMatchResult } from "@/lib/validation/job-match";
import {
  prepPlanGenerationSchema,
  type PrepPlanGeneration,
} from "@/lib/validation/prep-plan";
import type { ResumeReviewResult } from "@/lib/validation/resume-review";

export type PrepPlanProfile = {
  targetRole: string;
  experienceLevel: string;
  targetIndustry: string;
  skills: string[];
  certifications: string[];
  jobSearchStatus: string;
};

export type GeneratePrepPlanInput = {
  profile: PrepPlanProfile;
  review?: ResumeReviewResult | null;
  match?: JobMatchResult | null;
  resumeSummary?: string | null;
  hasJobMatch: boolean;
};

const PLAN_SYSTEM_PROMPT = `You are a job preparation coach creating a personalized, prioritized preparation plan.

Rules:
- Ground every item in the provided profile, resume review, and/or job match data.
- Never invent experience, employers, dates, or metrics the candidate did not provide.
- Do not claim hire probability or guaranteed outcomes.
- category must be one of: cv, application, interview, skills, other.
- priority: lower number = higher urgency (1 is most urgent).
- href: optional deep links — use /resume/check for CV fixes, /jobs/match for JD matching, /resume for uploads, /interview for mock practice, /videos or /videos?category=behavioral|technical|case|motivation for the human-made interview video library.
- For interview-category items, prefer href /interview and/or /videos with a relevant category query when helpful.
- If no job match was provided, include an application-category item suggesting they paste a JD at /jobs/match.
- Items must be specific and actionable, not generic boilerplate only.
- reason: explain why this item matters for this candidate.`;

function buildPlanPrompt(input: GeneratePrepPlanInput): string {
  const parts = [
    "Candidate profile:",
    JSON.stringify(input.profile, null, 2),
  ];

  if (input.resumeSummary) {
    parts.push("", "Resume summary:", input.resumeSummary);
  }

  if (input.review) {
    parts.push(
      "",
      "Latest resume review:",
      JSON.stringify(
        {
          overallScore: input.review.overallScore,
          strengths: input.review.strengths,
          weaknesses: input.review.weaknesses,
          priorityActions: input.review.priorityActions,
          summary: input.review.summary,
        },
        null,
        2
      )
    );
  } else {
    parts.push(
      "",
      "Note: No completed resume review yet. Include CV-category items to run a review at /resume/check."
    );
  }

  if (input.match) {
    parts.push(
      "",
      "Latest job match:",
      JSON.stringify(
        {
          matchScore: input.match.matchScore,
          matched: input.match.matched,
          missing: input.match.missing,
          nextActions: input.match.nextActions,
          summary: input.match.summary,
        },
        null,
        2
      )
    );
  } else if (!input.hasJobMatch) {
    parts.push(
      "",
      "Note: No job description match yet. Include an application-category item to paste a JD at /jobs/match."
    );
  }

  return parts.join("\n");
}

export async function generatePrepPlan(
  input: GeneratePrepPlanInput
): Promise<PrepPlanGeneration> {
  const { object } = await generateObjectWithFallback<PrepPlanGeneration>({
    schema: prepPlanGenerationSchema,
    system: PLAN_SYSTEM_PROMPT,
    prompt: buildPlanPrompt(input),
  });
  return object;
}

export function getPrepPlanModelId(): string {
  return getOpenRouterModelId();
}
