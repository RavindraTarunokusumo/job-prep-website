import {
  generateObjectWithFallback,
  getOpenRouterModelId,
} from "@/lib/ai/openrouter";
import {
  parseShortMessageGeneration,
  shortMessageGenerationSchema,
  type ShortMessageGeneration,
  type Tone,
} from "@/lib/validation/application-draft";

export type ShortMessageType =
  | "recruiter_dm"
  | "referral_request"
  | "application_note";

export type ShortMessageInput = {
  messageType: ShortMessageType;
  targetRole: string;
  experienceLevel: string;
  targetIndustry?: string;
  skills?: string[];
  resumeText: string;
  jobTitle?: string | null;
  company?: string | null;
  jobText?: string | null;
  tone: Tone;
};

const TONE_GUIDANCE: Record<Tone, string> = {
  professional:
    "Professional and confident: clear, polished, business-appropriate language.",
  enthusiastic:
    "Enthusiastic but credible: genuine interest without hype or exaggeration.",
  formal:
    "Formal and reserved: traditional business register; avoid casual phrasing.",
  concise:
    "Concise: tight sentences, minimal filler; still complete and polite.",
};

const MESSAGE_TYPE_GUIDANCE: Record<ShortMessageType, string> = {
  recruiter_dm:
    "Recruiter DM: a short LinkedIn/email-style outreach to a recruiter or hiring contact. Warm intro, role interest, one concrete evidence point, polite ask to connect or chat. Target ~60–100 words.",
  referral_request:
    "Referral request: a short message asking a contact for a referral or intro. Be specific about the role/company when known, why you fit (from resume evidence), and make the ask easy. Target ~50–90 words.",
  application_note:
    "Application note: a brief note for an application form or “anything else we should know” field. Highlight fit with 1–2 evidence-backed points; no full letter structure. Target ~40–80 words.",
};

const SHORT_MESSAGE_SYSTEM_PROMPT = `You are an expert career writing coach drafting short application messages for job seekers.

Rules:
- Ground EVERY claim in the provided profile, resume text, and optional job description only.
- NEVER invent experience, employers, job titles, dates, metrics, skills, certifications, education, or achievements the candidate did not provide.
- If a detail is unknown but needed (e.g. a contact name), use a bracket placeholder like [Name] or [your detail] — do not fabricate a value.
- Do not claim hire probability, guaranteed interviews, or outcomes.
- Output a single short message (not a multi-section cover letter).
- title: a short working title for the draft (message type + role/company when known).
- content: the full message ready for the user to edit and send.
- evidenceNotes (optional): brief notes listing which resume/JD facts you used — not part of the message body.
- Match the requested tone and message-type guidance (length and purpose).
- Tailor to the job description when provided; otherwise tailor to the target role from the profile.
- Prefer concrete, evidence-backed phrasing over generic fluff.`;

function buildShortMessagePrompt(input: ShortMessageInput): string {
  const parts = [
    `Message type: ${input.messageType}`,
    `Type guidance: ${MESSAGE_TYPE_GUIDANCE[input.messageType]}`,
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
      "No specific job description provided. Write a tailored short message for the target role."
    );
  }

  parts.push(
    "",
    "Return JSON with: title, content (the full short message), optional evidenceNotes."
  );

  return parts.join("\n");
}

export async function generateShortMessage(
  input: ShortMessageInput
): Promise<ShortMessageGeneration> {
  const { object } = await generateObjectWithFallback<ShortMessageGeneration>({
    schema: shortMessageGenerationSchema,
    system: SHORT_MESSAGE_SYSTEM_PROMPT,
    prompt: buildShortMessagePrompt(input),
  });

  return parseShortMessageGeneration(object);
}

export function getApplicationMessageModelId(): string {
  return getOpenRouterModelId();
}
