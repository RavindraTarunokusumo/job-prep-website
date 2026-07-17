import { z } from "zod";

export const draftTypeSchema = z.enum([
  "cover_letter",
  "recruiter_dm",
  "referral_request",
  "application_note",
]);

export const toneSchema = z.enum([
  "professional",
  "enthusiastic",
  "formal",
  "concise",
]);

export const lengthSchema = z.enum(["short", "medium", "long"]);

export const sectionKeySchema = z.enum(["intro", "body", "closing"]);

export const coverLetterSectionsSchema = z.object({
  intro: z.string().min(1),
  body: z.string().min(1),
  closing: z.string().min(1),
});

export const coverLetterGenerationSchema = z.object({
  title: z.string().min(1),
  sections: coverLetterSectionsSchema,
  content: z.string().min(1),
  evidenceNotes: z.array(z.string()).max(12).optional(),
});

export const shortMessageGenerationSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  evidenceNotes: z.array(z.string()).max(8).optional(),
});

export type DraftType = z.infer<typeof draftTypeSchema>;
export type Tone = z.infer<typeof toneSchema>;
export type Length = z.infer<typeof lengthSchema>;
export type SectionKey = z.infer<typeof sectionKeySchema>;
export type CoverLetterSections = z.infer<typeof coverLetterSectionsSchema>;
export type CoverLetterGeneration = z.infer<typeof coverLetterGenerationSchema>;
export type ShortMessageGeneration = z.infer<
  typeof shortMessageGenerationSchema
>;

export function parseCoverLetterGeneration(
  data: unknown
): CoverLetterGeneration {
  return coverLetterGenerationSchema.parse(data);
}

export function parseShortMessageGeneration(
  data: unknown
): ShortMessageGeneration {
  return shortMessageGenerationSchema.parse(data);
}

export function composeContentFromSections(sections: {
  intro: string;
  body: string;
  closing: string;
}): string {
  return `${sections.intro}\n\n${sections.body}\n\n${sections.closing}`;
}
