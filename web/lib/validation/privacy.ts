import { z } from "zod";

export const CONSENT_KINDS = ["upload", "ai_processing"] as const;

export type ConsentKind = (typeof CONSENT_KINDS)[number];

export const consentKindSchema = z.enum(CONSENT_KINDS);

export function parseConsentKind(value: unknown): ConsentKind | null {
  const parsed = consentKindSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
