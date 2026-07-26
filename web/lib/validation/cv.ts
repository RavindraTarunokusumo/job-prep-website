import { z } from "zod";

export const cvSectionKeys = [
  "contact",
  "summary",
  "experience",
  "education",
  "skills",
  "projects",
  "certifications",
  "languages",
] as const;

export type CvSectionKey = (typeof cvSectionKeys)[number];

export const cvContactSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  linkedin: z.string().optional(),
  website: z.string().optional(),
});

export const cvExperienceEntrySchema = z.object({
  company: z.string().optional(),
  title: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  description: z.string().optional(),
  bullets: z.array(z.string()).optional(),
  /** When true, employer/dates/core facts are user-verified and protected. */
  verified: z.boolean().optional(),
});

export const cvEducationEntrySchema = z.object({
  institution: z.string().optional(),
  degree: z.string().optional(),
  field: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  description: z.string().optional(),
  verified: z.boolean().optional(),
});

export const cvProjectEntrySchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  technologies: z.array(z.string()).optional(),
  verified: z.boolean().optional(),
});

export const structuredCvSchema = z.object({
  contact: cvContactSchema.default({}),
  summary: z.string().optional(),
  experience: z.array(cvExperienceEntrySchema).default([]),
  education: z.array(cvEducationEntrySchema).default([]),
  skills: z.array(z.string()).default([]),
  projects: z.array(cvProjectEntrySchema).default([]),
  certifications: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
});

export type StructuredCv = z.infer<typeof structuredCvSchema>;

export const cvSectionConfigSchema = z.object({
  order: z.array(z.enum(cvSectionKeys)).default([...cvSectionKeys]),
  hidden: z.array(z.enum(cvSectionKeys)).default([]),
});

export type CvSectionConfig = z.infer<typeof cvSectionConfigSchema>;

export const emptyStructuredCv = (): StructuredCv =>
  structuredCvSchema.parse({
    contact: {},
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    languages: [],
  });

export const defaultSectionConfig = (): CvSectionConfig =>
  cvSectionConfigSchema.parse({
    order: [...cvSectionKeys],
    hidden: [],
  });

export const rewriteSuggestionSchema = z.object({
  /** section key or path like experience.0.bullets.1 */
  path: z.string().min(1),
  proposedText: z.string().min(1),
  /** If true, apply even when target is marked verified (user explicit accept). */
  force: z.boolean().optional().default(false),
});

export type RewriteSuggestion = z.infer<typeof rewriteSuggestionSchema>;

export function parseStructuredCv(data: unknown): StructuredCv {
  return structuredCvSchema.parse(data);
}

export function safeParseStructuredCv(data: unknown) {
  return structuredCvSchema.safeParse(data);
}
