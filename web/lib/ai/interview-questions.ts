import {
  generateObjectWithFallback,
  getOpenRouterModelId,
} from "@/lib/ai/openrouter";
import {
  parseQuestionSet,
  questionSetSchema,
  type QuestionSet,
} from "@/lib/validation/interview";

export type InterviewQuestionsInput = {
  targetRole: string;
  experienceLevel?: string | null;
  targetIndustry?: string | null;
  resumeExcerpt?: string | null;
  jdExcerpt?: string | null;
  userId?: string | null;
};

const INTERVIEW_QUESTIONS_SYSTEM_PROMPT = `You are an expert interview coach creating a practice mock interview question set for a job seeker.

Rules:
- Generate an ordered list of 3–8 interview questions (prefer 5 when context is rich enough).
- Cover a MIX of categories across the set: behavioral, motivation, competency, and role_specific. Do not use the category "follow_up" for these primary questions.
- Align questions to the candidate's target role, experience level, and industry when provided.
- Ground role-specific and competency questions in the target role and any resume/JD excerpts provided.
- NEVER invent employers, job titles, projects, metrics, skills, certifications, education, or achievements the candidate did not provide.
- Do NOT phrase questions as if you already know a specific fact from their background unless that fact appears in the resume or JD excerpt. Prefer open prompts (e.g. "Tell me about a time you…") over fabricated specifics.
- If resume or JD context is missing, ask strong general questions for the target role — do not invent a fake resume.
- Questions must be clear, answerable in text, and suitable for practice coaching (not trick or illegal questions).
- title: short session title (role + company when known from JD, otherwise role only).
- Do not claim hire probability, pass rates, or personality diagnoses.`;

function buildInterviewQuestionsPrompt(input: InterviewQuestionsInput): string {
  const parts = [`Target role: ${input.targetRole.trim()}`];

  if (input.experienceLevel?.trim()) {
    parts.push(`Experience level: ${input.experienceLevel.trim()}`);
  }

  if (input.targetIndustry?.trim()) {
    parts.push(`Target industry: ${input.targetIndustry.trim()}`);
  }

  if (input.resumeExcerpt?.trim()) {
    parts.push("", "Resume excerpt (optional context — do not invent beyond this):", input.resumeExcerpt.trim());
  } else {
    parts.push(
      "",
      "No resume excerpt provided. Use role/level/industry only; do not invent candidate experience."
    );
  }

  if (input.jdExcerpt?.trim()) {
    parts.push(
      "",
      "Job description excerpt (optional context — tailor role_specific/competency questions when relevant):",
      input.jdExcerpt.trim()
    );
  } else {
    parts.push(
      "",
      "No job description excerpt provided. Tailor to the target role generally."
    );
  }

  parts.push(
    "",
    "Return JSON with: title, questions (array of { category, question }).",
    "category must be one of: behavioral, motivation, competency, role_specific.",
    "Include at least one behavioral and aim for coverage across the four primary categories when generating 4+ questions."
  );

  return parts.join("\n");
}

export async function generateInterviewQuestions(
  input: InterviewQuestionsInput
): Promise<QuestionSet> {
  const targetRole = input.targetRole?.trim();
  if (!targetRole) {
    throw new Error("Target role is required to generate interview questions.");
  }

  const { object } = await generateObjectWithFallback<QuestionSet>({
    schema: questionSetSchema,
    system: INTERVIEW_QUESTIONS_SYSTEM_PROMPT,
    prompt: buildInterviewQuestionsPrompt({
      ...input,
      targetRole,
    }),
    workflow: "mock_interview",
    taskClass: "interview_generation",
    userId: input.userId,
  });

  return parseQuestionSet(object);
}

export function getInterviewQuestionsModelId(): string {
  return getOpenRouterModelId();
}
