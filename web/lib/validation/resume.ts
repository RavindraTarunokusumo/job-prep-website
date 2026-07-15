import { z } from "zod";

export const RESUME_MAX_BYTES = 5 * 1024 * 1024;

export const RESUME_ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
] as const;

export type ResumeMimeType = (typeof RESUME_ALLOWED_MIME_TYPES)[number];

export const resumeDocumentStatuses = [
  "uploaded",
  "extracting",
  "parsed",
  "failed",
] as const;

export type ResumeDocumentStatus = (typeof resumeDocumentStatuses)[number];

export const contactSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  linkedin: z.string().optional(),
  website: z.string().optional(),
});

export const educationEntrySchema = z.object({
  institution: z.string().optional(),
  degree: z.string().optional(),
  field: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  description: z.string().optional(),
});

export const experienceEntrySchema = z.object({
  company: z.string().optional(),
  title: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  description: z.string().optional(),
});

export const projectEntrySchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  technologies: z.array(z.string()).optional(),
});

export const parsedResumeSchema = z.object({
  contact: contactSchema.default({}),
  summary: z.string().optional(),
  education: z.array(educationEntrySchema).default([]),
  experience: z.array(experienceEntrySchema).default([]),
  skills: z.array(z.string()).default([]),
  projects: z.array(projectEntrySchema).default([]),
  certifications: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
});

export type ParsedResume = z.infer<typeof parsedResumeSchema>;

export const emptyParsedResume = (): ParsedResume =>
  parsedResumeSchema.parse({
    contact: {},
    education: [],
    experience: [],
    skills: [],
    projects: [],
    certifications: [],
    languages: [],
  });

export function isAllowedResumeMimeType(
  mimeType: string
): mimeType is ResumeMimeType {
  return (RESUME_ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType);
}

export function validateResumeUpload(file: {
  name: string;
  type: string;
  size: number;
}): { ok: true } | { ok: false; error: string } {
  if (!isAllowedResumeMimeType(file.type)) {
    return {
      ok: false,
      error: "Only PDF and Word documents (.pdf, .docx, .doc) are supported.",
    };
  }

  if (file.size <= 0) {
    return { ok: false, error: "The selected file is empty." };
  }

  if (file.size > RESUME_MAX_BYTES) {
    return {
      ok: false,
      error: `File must be ${RESUME_MAX_BYTES / (1024 * 1024)}MB or smaller.`,
    };
  }

  return { ok: true };
}

export function sanitizeResumeFilename(filename: string): string {
  const base = filename.split(/[/\\]/).pop() ?? "resume";
  const sanitized = base
    .replace(/[^\w.\-() ]+/g, "_")
    .replace(/\s+/g, "_")
    .slice(0, 120);

  return sanitized.length > 0 ? sanitized : "resume";
}

export function parseResumeFormData(formData: FormData): ParsedResume {
  const raw = formData.get("parsedData");
  if (typeof raw !== "string" || raw.trim().length === 0) {
    throw new Error("Missing parsed resume data.");
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error("Invalid parsed resume JSON.");
  }

  return parsedResumeSchema.parse(json);
}