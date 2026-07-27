import type { RequirementMatchDraft } from "@/lib/validation/requirement-match";
import {
  readinessDimensionsSchema,
  readinessScoreRecordSchema,
  readinessTextIsSafe,
  type ReadinessDimension,
  type ReadinessScoreRecord,
} from "@/lib/validation/readiness";
import { summarizeMatchTypes } from "@/lib/matching";

export type ReadinessInputs = {
  userId: string;
  jobDescriptionId?: string | null;
  matches: Pick<
    RequirementMatchDraft,
    "matchType" | "importance" | "evidenceStrength" | "requirementKey"
  >[];
  /** 0–100 from latest resume review, if any */
  cvScore?: number | null;
  /** fraction of prep plan items done 0–1 */
  prepCompletion?: number | null;
  /** average interview feedback score 0–100 if any */
  interviewScore?: number | null;
  /** application stage progress 0–100 if tracker exists */
  executionScore?: number | null;
  sourceTimestamps?: Record<string, string>;
};

function clampScore(n: number | null): number | null {
  if (n == null || Number.isNaN(n)) return null;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function coverageFromMatches(
  matches: ReadinessInputs["matches"],
): { score: number | null; confidence: number; explanation: string } {
  if (matches.length === 0) {
    return {
      score: null,
      confidence: 0.2,
      explanation: "No requirement mappings yet — score confidence is low.",
    };
  }
  const required = matches.filter((m) => m.importance === "required");
  const pool = required.length > 0 ? required : matches;
  const strongish = pool.filter(
    (m) => m.matchType === "strong" || m.matchType === "partial" || m.matchType === "transferable",
  ).length;
  const score = Math.round((strongish / pool.length) * 100);
  const counts = summarizeMatchTypes(matches);
  return {
    score,
    confidence: Math.min(0.95, 0.4 + pool.length * 0.05),
    explanation: `Requirement coverage from mappings: ${counts.strong} strong, ${counts.partial} partial, ${counts.gap} gaps.`,
  };
}

function evidenceStrengthFromMatches(
  matches: ReadinessInputs["matches"],
): { score: number | null; confidence: number; explanation: string } {
  if (matches.length === 0) {
    return {
      score: null,
      confidence: 0.2,
      explanation: "Missing mapping data lowers confidence rather than inventing precision.",
    };
  }
  const avg =
    matches.reduce((sum, m) => sum + m.evidenceStrength, 0) / Math.max(matches.length, 1);
  return {
    score: Math.round(avg),
    confidence: 0.6,
    explanation: `Average mapped evidence strength is ${Math.round(avg)}/100 across ${matches.length} requirements.`,
  };
}

/**
 * Deterministic readiness dimensions. Never claims hire probability.
 */
export function computeApplicationReadiness(input: ReadinessInputs): ReadinessScoreRecord {
  const coverage = coverageFromMatches(input.matches);
  const evidence = evidenceStrengthFromMatches(input.matches);

  const dimensions: ReadinessDimension[] = [
    {
      key: "requirement_coverage",
      score: coverage.score,
      confidence: coverage.confidence,
      explanation: coverage.explanation,
      sourceRefs: input.matches.slice(0, 5).map((m) => m.requirementKey),
      highestImpactAction:
        coverage.score != null && coverage.score < 70
          ? "Confirm evidence for required gaps or add verified career facts."
          : "Maintain coverage; refresh mapping after CV updates.",
    },
    {
      key: "evidence_strength",
      score: evidence.score,
      confidence: evidence.confidence,
      explanation: evidence.explanation,
      sourceRefs: [],
      highestImpactAction:
        "Strengthen weak mappings with confirmed STAR stories and metrics.",
    },
    {
      key: "cv_readiness",
      score: clampScore(input.cvScore ?? null),
      confidence: input.cvScore == null ? 0.25 : 0.75,
      explanation:
        input.cvScore == null
          ? "No resume review yet — CV dimension confidence is low."
          : `Latest resume review score ${Math.round(input.cvScore)}.`,
      sourceRefs: input.cvScore != null ? ["resume_review"] : [],
      highestImpactAction: "Run or update a resume review against this role.",
    },
    {
      key: "interview_readiness",
      score: clampScore(input.interviewScore ?? null),
      confidence: input.interviewScore == null ? 0.25 : 0.7,
      explanation:
        input.interviewScore == null
          ? "No mock interview feedback yet."
          : `Recent interview practice score ${Math.round(input.interviewScore)}.`,
      sourceRefs: input.interviewScore != null ? ["interview_session"] : [],
      highestImpactAction: "Start a gap-driven mock interview for remaining weak requirements.",
    },
    {
      key: "preparation_completion",
      score:
        input.prepCompletion == null
          ? null
          : clampScore(input.prepCompletion * 100),
      confidence: input.prepCompletion == null ? 0.25 : 0.8,
      explanation:
        input.prepCompletion == null
          ? "No preparation plan progress available."
          : `Prep plan completion ${Math.round(input.prepCompletion * 100)}%.`,
      sourceRefs: input.prepCompletion != null ? ["preparation_plan"] : [],
      highestImpactAction: "Complete high-priority prep plan items linked to gaps.",
    },
    {
      key: "application_execution",
      score: clampScore(input.executionScore ?? null),
      confidence: input.executionScore == null ? 0.2 : 0.65,
      explanation:
        input.executionScore == null
          ? "Application execution not tracked yet."
          : `Execution progress ${Math.round(input.executionScore)}.`,
      sourceRefs: [],
      highestImpactAction: "Record application stage and next actions.",
    },
  ];

  for (const d of dimensions) {
    if (!readinessTextIsSafe(d.explanation)) {
      throw new Error("Readiness explanations must not claim hire probability.");
    }
  }

  const scored = dimensions.map((d) => d.score).filter((s): s is number => s != null);
  const overallScore =
    scored.length === 0
      ? null
      : Math.round(scored.reduce((a, b) => a + b, 0) / scored.length);

  const avgConf =
    dimensions.reduce((a, d) => a + d.confidence, 0) / Math.max(dimensions.length, 1);
  const confidenceBand =
    scored.length < 3 || avgConf < 0.4
      ? "sparse"
      : avgConf < 0.65 || (overallScore != null && overallScore < 55)
        ? "partial"
        : "ready";

  const dims = readinessDimensionsSchema.parse({ dimensions });
  return readinessScoreRecordSchema.parse({
    userId: input.userId,
    jobDescriptionId: input.jobDescriptionId ?? null,
    confidenceBand,
    dimensions: dims,
    overallScore,
    explanations: {
      disclaimer:
        "Coaching readiness only — not hire probability or employer judgement.",
    },
    sourceTimestamps: input.sourceTimestamps ?? {},
    version: 1,
  });
}
