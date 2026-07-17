import { z } from "zod";
import {
  generateObjectWithFallback,
  getOpenRouterModelId,
} from "@/lib/ai/openrouter";
import {
  composeContentFromSections,
  coverLetterGenerationSchema,
  parseCoverLetterGeneration,
  type CoverLetterGeneration,
  type CoverLetterSections,
  type Length,
  type Tone,
} from "@/lib/validation/application-draft";

export type CoverLetterInput = {
  targetRole: string;
  experienceLevel: string;
  targetIndustry?: string;
  skills?: string[];
  resumeText: string;
  jobTitle?: string | null;
  company?: string | null;
  jobText?: string | null;
  tone: Tone;
  length: Length;
};

const sectionTextSchema = z.object({
  text: z.string().min(1),
});

const LENGTH_GUIDANCE: Record<Length, string> = {
  short: "Target ~150–250 words total for the full letter.",
  medium: "Target ~250–400 words total for the full letter.",
  long: "Target ~400–600 words total for the full letter.",
};

const TONE_GUIDANCE: Record<Tone, string> = {
  professional:
    "Professional and confident: clear, polished, business-appropriate language.",
  enthusiastic:
    "Enthusiastic but credible: genuine interest without hype or exaggeration.",
  formal:
    "Formal and reserved: traditional business letter register; avoid casual phrasing.",
  concise:
    "Concise: tight sentences, minimal filler; still complete intro/body/closing.",
};

const COVER_LETTER_SYSTEM_PROMPT = `You are an expert career writing coach drafting cover letters for job seekers.

Rules:
- Ground EVERY claim in the provided profile, resume text, and optional job description only.
- NEVER invent experience, employers, job titles, dates, metrics, skills, certifications, education, or achievements the candidate did not provide.
- If a detail is unknown but needed (e.g. a specific metric or contact name), use a bracket placeholder like [your detail] — do not fabricate a value.
- Do not claim hire probability, guaranteed interviews, or outcomes.
- Output structured sections: intro, body, and closing.
- content must be the full letter composed from intro, body, and closing (separated by blank lines).
- title: a short working title for the draft (role + company when known, or role only).
- evidenceNotes (optional): brief notes listing which resume/JD facts you used — not shown as the letter body.
- Match the requested tone and length guidance exactly.
- Tailor to the job description when provided; otherwise tailor to the target role/industry from the profile.
- Prefer concrete, evidence-backed phrasing over generic fluff.`;

const SECTION_REGEN_SYSTEM_PROMPT = `You are an expert career writing coach rewriting ONE section of a cover letter.

Rules:
- Rewrite ONLY the requested section (intro, body, or closing).
- Keep consistency with the other sections provided as context.
- Ground EVERY claim in the provided profile, resume text, and optional job description only.
- NEVER invent experience, employers, job titles, dates, metrics, skills, or achievements not in the inputs.
- If a needed detail is missing, use a bracket placeholder like [your detail].
- Match the requested tone and overall length guidance for that section's share of the letter.
- Return only the new text for that section (no labels like "Intro:").`;

function buildCoverLetterPrompt(input: CoverLetterInput): string {
  const parts = [
    `Target role: ${input.targetRole}`,
    `Experience level: ${input.experienceLevel}`,
  ];

  if (input.targetIndustry?.trim()) {
    parts.push(`Target industry: ${input.targetIndustry.trim()}`);
  }

  if (input.skills && input.skills.length > 0) {
    parts.push(`Profile skills: ${input.skills.join(", ")}`);
  }

  parts.push(
    `Tone: ${input.tone} — ${TONE_GUIDANCE[input.tone]}`,
    `Length: ${input.length} — ${LENGTH_GUIDANCE[input.length]}`,
    "",
    "Resume text:",
    input.resumeText
  );

  if (input.jobTitle || input.company || input.jobText) {
    parts.push("", "Target job description:");
    if (input.jobTitle?.trim()) {
      parts.push(`Job title: ${input.jobTitle.trim()}`);
    }
    if (input.company?.trim()) {
      parts.push(`Company: ${input.company.trim()}`);
    }
    if (input.jobText?.trim()) {
      parts.push("", input.jobText.trim());
    }
  } else {
    parts.push(
      "",
      "No specific job description provided. Write a tailored general cover letter for the target role."
    );
  }

  parts.push(
    "",
    "Return JSON with: title, sections { intro, body, closing }, content (full letter), optional evidenceNotes."
  );

  return parts.join("\n");
}

function buildSectionRegenPrompt(
  input: CoverLetterInput & {
    section: "intro" | "body" | "closing";
    currentSections: CoverLetterSections;
  }
): string {
  const sectionRole =
    input.section === "intro"
      ? "Opening: who you are, role interest, hook grounded in evidence."
      : input.section === "body"
        ? "Body: 1–2 paragraphs linking resume evidence to the role/JD needs."
        : "Closing: polite call to action and professional sign-off setup (no invented contact details).";

  const parts = [
    `Rewrite ONLY the "${input.section}" section.`,
    `Section guidance: ${sectionRole}`,
    `Tone: ${input.tone} — ${TONE_GUIDANCE[input.tone]}`,
    `Overall letter length target: ${input.length} — ${LENGTH_GUIDANCE[input.length]}`,
    "",
    "Current sections (for consistency — do not rewrite the others):",
    `intro:\n${input.currentSections.intro}`,
    "",
    `body:\n${input.currentSections.body}`,
    "",
    `closing:\n${input.currentSections.closing}`,
    "",
    `Target role: ${input.targetRole}`,
    `Experience level: ${input.experienceLevel}`,
  ];

  if (input.targetIndustry?.trim()) {
    parts.push(`Target industry: ${input.targetIndustry.trim()}`);
  }

  if (input.skills && input.skills.length > 0) {
    parts.push(`Profile skills: ${input.skills.join(", ")}`);
  }

  parts.push("", "Resume text:", input.resumeText);

  if (input.jobTitle || input.company || input.jobText) {
    parts.push("", "Target job description:");
    if (input.jobTitle?.trim()) {
      parts.push(`Job title: ${input.jobTitle.trim()}`);
    }
    if (input.company?.trim()) {
      parts.push(`Company: ${input.company.trim()}`);
    }
    if (input.jobText?.trim()) {
      parts.push("", input.jobText.trim());
    }
  }

  parts.push("", `Return JSON with a single "text" field: the new ${input.section} only.`);

  return parts.join("\n");
}

export async function generateCoverLetter(
  input: CoverLetterInput
): Promise<CoverLetterGeneration> {
  const { object } = await generateObjectWithFallback<CoverLetterGeneration>({
    schema: coverLetterGenerationSchema,
    system: COVER_LETTER_SYSTEM_PROMPT,
    prompt: buildCoverLetterPrompt(input),
  });

  const validated = parseCoverLetterGeneration(object);
  return {
    ...validated,
    content: composeContentFromSections(validated.sections),
  };
}

export async function regenerateCoverLetterSection(
  input: CoverLetterInput & {
    section: "intro" | "body" | "closing";
    currentSections: CoverLetterSections;
  }
): Promise<CoverLetterSections> {
  const { object } = await generateObjectWithFallback<{ text: string }>({
    schema: sectionTextSchema,
    system: SECTION_REGEN_SYSTEM_PROMPT,
    prompt: buildSectionRegenPrompt(input),
  });

  return {
    ...input.currentSections,
    [input.section]: object.text.trim(),
  };
}

export function getCoverLetterModelId(): string {
  return getOpenRouterModelId();
}
