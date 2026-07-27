import { z } from "zod";

/** Shared verification ladder for ontology facts. */
export const verificationStates = [
  "imported",
  "inferred",
  "unconfirmed",
  "confirmed",
  "archived",
] as const;

export type VerificationState = (typeof verificationStates)[number];

export const evidenceSourceTypes = [
  "employment",
  "education",
  "volunteering",
  "freelance",
  "project",
  "competition",
  "other",
] as const;

export type EvidenceSourceType = (typeof evidenceSourceTypes)[number];

export const starReadinessValues = ["draft", "ready", "archived"] as const;
export type StarReadiness = (typeof starReadinessValues)[number];

export const skillCategories = [
  "technical",
  "soft",
  "domain",
  "tool",
  "language",
  "other",
] as const;

export type SkillCategory = (typeof skillCategories)[number];

export const seniorityKinds = [
  "years_experience",
  "level_label",
  "scope",
  "team_size",
  "other",
] as const;

export type SeniorityKind = (typeof seniorityKinds)[number];

export const linkStrengths = ["primary", "secondary", "mentioned"] as const;
export type LinkStrength = (typeof linkStrengths)[number];

export const verificationStateSchema = z.enum(verificationStates);
export const evidenceSourceTypeSchema = z.enum(evidenceSourceTypes);
export const starReadinessSchema = z.enum(starReadinessValues);
export const skillCategorySchema = z.enum(skillCategories);
export const seniorityKindSchema = z.enum(seniorityKinds);
export const linkStrengthSchema = z.enum(linkStrengths);

export const confidenceSchema = z.number().min(0).max(1);

export const skillRecordSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  name: z.string().trim().min(1).max(200),
  normalizedName: z.string().trim().min(1).max(200),
  category: skillCategorySchema.nullable().optional(),
  verification: verificationStateSchema,
  confidence: confidenceSchema,
  sourceType: z.string().max(40).nullable().optional(),
  sourceId: z.string().max(100).nullable().optional(),
  version: z.number().int().positive(),
});

export const careerEvidenceRecordSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  title: z.string().trim().min(1).max(300),
  sourceType: evidenceSourceTypeSchema,
  organization: z.string().max(300).nullable().optional(),
  roleTitle: z.string().max(300).nullable().optional(),
  startDate: z.string().max(40).nullable().optional(),
  endDate: z.string().max(40).nullable().optional(),
  responsibilities: z.string().max(20000).nullable().optional(),
  achievements: z.string().max(20000).nullable().optional(),
  metrics: z.string().max(5000).nullable().optional(),
  verification: verificationStateSchema,
  confidence: confidenceSchema,
  provenance: z.record(z.string(), z.unknown()).nullable().optional(),
  sourceNote: z.string().max(500).nullable().optional(),
  version: z.number().int().positive(),
});

export const achievementRecordSchema = z.object({
  id: z.string().min(1),
  evidenceId: z.string().min(1),
  userId: z.string().min(1),
  statement: z.string().trim().min(1).max(5000),
  metricLabel: z.string().max(200).nullable().optional(),
  metricValue: z.string().max(200).nullable().optional(),
  verification: verificationStateSchema,
  confidence: confidenceSchema,
});

export const starStoryRecordSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  evidenceId: z.string().min(1).nullable().optional(),
  title: z.string().trim().min(1).max(300),
  situation: z.string().trim().min(1).max(8000),
  task: z.string().trim().min(1).max(8000),
  action: z.string().trim().min(1).max(8000),
  result: z.string().trim().min(1).max(8000),
  readiness: starReadinessSchema,
  verification: verificationStateSchema,
  confidence: confidenceSchema,
  version: z.number().int().positive(),
});

export const senioritySignalRecordSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  kind: seniorityKindSchema,
  value: z.string().trim().min(1).max(300),
  verification: verificationStateSchema,
  confidence: confidenceSchema,
  sourceType: z.string().max(40).nullable().optional(),
  sourceId: z.string().max(100).nullable().optional(),
});

export const targetRoleRecordSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  title: z.string().trim().min(1).max(300),
  industry: z.string().max(200).nullable().optional(),
  priority: z.number().int(),
  sourceType: z.string().max(40).nullable().optional(),
  isPrimary: z.boolean(),
});

export const ontologySnapshotSchema = z.object({
  skills: z.array(skillRecordSchema),
  evidence: z.array(careerEvidenceRecordSchema),
  achievements: z.array(achievementRecordSchema),
  stories: z.array(starStoryRecordSchema),
  signals: z.array(senioritySignalRecordSchema),
  targets: z.array(targetRoleRecordSchema),
  generatedAt: z.string().min(1),
});

export type SkillRecord = z.infer<typeof skillRecordSchema>;
export type CareerEvidenceRecord = z.infer<typeof careerEvidenceRecordSchema>;
export type AchievementRecord = z.infer<typeof achievementRecordSchema>;
export type StarStoryRecord = z.infer<typeof starStoryRecordSchema>;
export type SenioritySignalRecord = z.infer<typeof senioritySignalRecordSchema>;
export type TargetRoleRecord = z.infer<typeof targetRoleRecordSchema>;
export type OntologySnapshot = z.infer<typeof ontologySnapshotSchema>;

export function parseVerificationState(value: unknown): VerificationState {
  return verificationStateSchema.parse(value);
}

export function isTrustedVerification(state: string): boolean {
  return state === "confirmed";
}

/** Create/update payloads used by future actions (JOB-82-style consumers). */
export const createSkillSchema = z.object({
  name: z.string().trim().min(1).max(200),
  category: skillCategorySchema.optional(),
  verification: verificationStateSchema.optional().default("unconfirmed"),
  confidence: confidenceSchema.optional(),
  sourceType: z.string().max(40).optional(),
  sourceId: z.string().max(100).optional(),
});

export const createCareerEvidenceSchema = z.object({
  title: z.string().trim().min(1).max(300),
  sourceType: evidenceSourceTypeSchema,
  organization: z.string().trim().max(300).optional(),
  roleTitle: z.string().trim().max(300).optional(),
  startDate: z.string().trim().max(40).optional(),
  endDate: z.string().trim().max(40).optional(),
  responsibilities: z.string().max(20000).optional(),
  achievements: z.string().max(20000).optional(),
  metrics: z.string().max(5000).optional(),
  verification: verificationStateSchema.optional().default("unconfirmed"),
  confidence: confidenceSchema.optional(),
  sourceNote: z.string().trim().max(500).optional(),
});

export const createStarStorySchema = z.object({
  title: z.string().trim().min(1).max(300),
  situation: z.string().trim().min(1).max(8000),
  task: z.string().trim().min(1).max(8000),
  action: z.string().trim().min(1).max(8000),
  result: z.string().trim().min(1).max(8000),
  readiness: starReadinessSchema.optional().default("draft"),
  verification: verificationStateSchema.optional().default("unconfirmed"),
  confidence: confidenceSchema.optional(),
  evidenceId: z.string().min(1).optional().nullable(),
});
