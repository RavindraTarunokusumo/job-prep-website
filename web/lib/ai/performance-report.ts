import {
  generateObjectWithFallback,
  getOpenRouterModelId,
} from "@/lib/ai/openrouter";
import type { GatheredProfile } from "@/lib/report/aggregate";
import {
  performanceReportNarrativeSchema,
  type PerformanceReportNarrative,
  type PerformanceReportSections,
} from "@/lib/validation/performance-report";

export type GenerateReportNarrativeInput = {
  profile: GatheredProfile | null;
  sections: PerformanceReportSections;
};

const NARRATIVE_SYSTEM_PROMPT = `You are a job preparation coach writing a short overall summary for a compiled readiness report.

Rules:
- Coaching guidance only. Never predict hire / no-hire outcomes, interview pass probability, or employment decisions.
- Never use phrases like "hire probability", "no-hire", "you will not be hired", "guaranteed to fail", or "pass probability".
- Ground every claim in the provided section evidence; do not invent employers, metrics, or experience.
- Be specific and actionable. Prefer what to practice or improve next.
- summary: 2–4 sentences, plain language.
- title: optional short report title (no score claims like "90% ready to hire").`;

function buildNarrativePrompt(input: GenerateReportNarrativeInput): string {
  const sectionDigest = input.sections.sections.map((s) => ({
    key: s.key,
    title: s.title,
    available: s.available,
    score: s.score ?? null,
    summary: s.summary ?? null,
    bullets: s.bullets.slice(0, 4),
    emptyHint: s.emptyHint ?? null,
  }));

  const parts = [
    "Write an overall readiness report narrative from this structured evidence.",
    "",
    "Candidate profile snapshot:",
    input.profile
      ? JSON.stringify(
          {
            targetRole: input.profile.targetRole,
            targetIndustry: input.profile.targetIndustry,
            experienceLevel: input.profile.experienceLevel,
            jobSearchStatus: input.profile.jobSearchStatus,
          },
          null,
          2
        )
      : "(no profile)",
    "",
    "Sections:",
    JSON.stringify(sectionDigest, null, 2),
  ];

  return parts.join("\n");
}

/**
 * Optional AI overall narrative. Call only when AI consent is present.
 * Throws on model failure — callers should fall back to deterministic summary.
 */
export async function generateReportNarrative(
  input: GenerateReportNarrativeInput
): Promise<PerformanceReportNarrative> {
  const { object } = await generateObjectWithFallback<PerformanceReportNarrative>(
    {
      schema: performanceReportNarrativeSchema,
      system: NARRATIVE_SYSTEM_PROMPT,
      prompt: buildNarrativePrompt(input),
    }
  );
  return object;
}

export function getPerformanceReportModelId(): string {
  return getOpenRouterModelId();
}
