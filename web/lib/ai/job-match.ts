import {
  generateObjectWithFallback,
  getOpenRouterModelId,
} from "@/lib/ai/openrouter";
import {
  jobMatchResultSchema,
  jobRequirementsSchema,
  type JobMatchResult,
  type JobRequirements,
} from "@/lib/validation/job-match";

const EXTRACT_SYSTEM_PROMPT = `You are a job description analyst. Extract structured requirements from pasted job postings.

Rules:
- Extract only what is stated or clearly implied in the posting text.
- Put ambiguous extractions in inferredNotes with a brief explanation.
- requiredSkills: must-have skills explicitly stated.
- preferredSkills: nice-to-have or bonus skills.
- keywords: ATS-relevant terms, technologies, methodologies.
- tools: software, platforms, frameworks mentioned.
- Do not invent requirements not supported by the text.`;

const MATCH_SYSTEM_PROMPT = `You are a resume-to-job fit analyst. Score how well a candidate's resume and profile align with job requirements.

Rules:
- matchScore is a 0-100 FIT score — how well the resume/profile matches the JD. It is NOT hire probability or interview chance.
- Ground matched items in actual resume/profile evidence. Include evidence quotes or paraphrases when possible.
- Never invent experience, employers, dates, or metrics the candidate did not provide.
- missing items: list gaps with importance (required vs preferred) and actionable suggestions.
- nextActions: lower priority number = more urgent (1 is highest).
- Be specific: reference actual skills, keywords, and gaps from the inputs.`;

export async function extractJobRequirements(
  rawText: string
): Promise<{ requirements: JobRequirements; modelId: string }> {
  const { object, modelId } = await generateObjectWithFallback<JobRequirements>({
    schema: jobRequirementsSchema,
    system: EXTRACT_SYSTEM_PROMPT,
    prompt: `Job description text:\n\n${rawText}`,
  });

  return { requirements: object, modelId };
}

export type ScoreJobMatchInput = {
  requirements: JobRequirements;
  resumeText: string;
  targetRole: string;
  experienceLevel: string;
  skills: string[];
  certifications: string[];
};

export async function scoreJobMatch(
  input: ScoreJobMatchInput
): Promise<{ result: JobMatchResult; modelId: string }> {
  const parts = [
    `Target role (profile): ${input.targetRole}`,
    `Experience level (profile): ${input.experienceLevel}`,
    `Profile skills: ${input.skills.join(", ") || "(none listed)"}`,
    `Profile certifications: ${input.certifications.join(", ") || "(none listed)"}`,
    "",
    "Extracted job requirements:",
    JSON.stringify(input.requirements, null, 2),
    "",
    "Resume text:",
    input.resumeText,
  ];

  const { object, modelId } = await generateObjectWithFallback<JobMatchResult>({
    schema: jobMatchResultSchema,
    system: MATCH_SYSTEM_PROMPT,
    prompt: parts.join("\n"),
  });

  return { result: object, modelId };
}

export function getJobMatchModelId(): string {
  return getOpenRouterModelId();
}
