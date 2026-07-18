import { z } from "zod";
import {
  BANNED_HIREABILITY_PHRASES,
  containsBannedHireabilityPhrases,
} from "@/lib/validation/interview";

export const performanceReportStatusSchema = z.enum([
  "generating",
  "ready",
  "failed",
]);

export const reportSectionKeySchema = z.enum([
  "profile",
  "application_readiness",
  "job_fit",
  "interview",
  "assessments",
  "prep_plan",
  "next_actions",
]);

export const reportSectionSchema = z.object({
  key: reportSectionKeySchema,
  title: z.string().min(1),
  available: z.boolean(),
  score: z.number().int().min(0).max(100).nullable().optional(),
  summary: z.string().optional(),
  bullets: z.array(z.string()).max(12).default([]),
  evidence: z.array(z.string()).max(12).default([]),
  emptyHint: z.string().optional(),
  href: z.string().optional(),
});

export const performanceReportSectionsSchema = z.object({
  sections: z.array(reportSectionSchema).min(1),
});

export const performanceReportNarrativeSchema = z.object({
  summary: z.string().min(1),
  title: z.string().min(1).optional(),
});

export type PerformanceReportStatus = z.infer<
  typeof performanceReportStatusSchema
>;
export type ReportSectionKey = z.infer<typeof reportSectionKeySchema>;
export type ReportSection = z.infer<typeof reportSectionSchema>;
export type PerformanceReportSections = z.infer<
  typeof performanceReportSectionsSchema
>;
export type PerformanceReportNarrative = z.infer<
  typeof performanceReportNarrativeSchema
>;

export function parsePerformanceReportStatus(
  data: unknown
): PerformanceReportStatus {
  return performanceReportStatusSchema.parse(data);
}

export function parsePerformanceReportSections(
  data: unknown
): PerformanceReportSections {
  return performanceReportSectionsSchema.parse(data);
}

export function safeParsePerformanceReportSections(
  data: unknown
): PerformanceReportSections | null {
  const result = performanceReportSectionsSchema.safeParse(data);
  return result.success ? result.data : null;
}

export function parsePerformanceReportNarrative(
  data: unknown
): PerformanceReportNarrative {
  return performanceReportNarrativeSchema.parse(data);
}

/** Re-export for schema/safety tests and report copy checks. */
export {
  BANNED_HIREABILITY_PHRASES,
  containsBannedHireabilityPhrases,
};

/**
 * True if any free-text field in sections contains banned hire language.
 */
export function sectionsContainBannedHireabilityPhrases(
  sections: PerformanceReportSections
): boolean {
  for (const section of sections.sections) {
    const parts = [
      section.title,
      section.summary,
      section.emptyHint,
      ...section.bullets,
      ...section.evidence,
    ].filter((p): p is string => typeof p === "string" && p.length > 0);
    if (parts.some((part) => containsBannedHireabilityPhrases(part))) {
      return true;
    }
  }
  return false;
}

/**
 * True if narrative summary/title contains banned hire language.
 */
export function narrativeContainsBannedHireabilityPhrases(
  narrative: PerformanceReportNarrative
): boolean {
  const parts = [narrative.summary, narrative.title].filter(
    (p): p is string => typeof p === "string" && p.length > 0
  );
  return parts.some((part) => containsBannedHireabilityPhrases(part));
}
