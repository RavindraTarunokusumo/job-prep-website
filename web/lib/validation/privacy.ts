import { z } from "zod";

export const CONSENT_KINDS = ["upload", "ai_processing"] as const;

export type ConsentKind = (typeof CONSENT_KINDS)[number];

export const consentKindSchema = z.enum(CONSENT_KINDS);

export function parseConsentKind(value: unknown): ConsentKind | null {
  const parsed = consentKindSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export const DATA_REQUEST_TYPES = ["export", "deletion"] as const;

export type DataRequestType = (typeof DATA_REQUEST_TYPES)[number];

export const dataRequestTypeSchema = z.enum(DATA_REQUEST_TYPES);

export function parseDataRequestType(value: unknown): DataRequestType | null {
  const parsed = dataRequestTypeSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export const DATA_REQUEST_STATUSES = [
  "pending",
  "completed",
  "rejected",
] as const;

export type DataRequestStatus = (typeof DATA_REQUEST_STATUSES)[number];

export const dataRequestStatusSchema = z.enum(DATA_REQUEST_STATUSES);
