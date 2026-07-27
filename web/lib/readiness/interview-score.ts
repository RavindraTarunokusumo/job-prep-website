import { safeParseInterviewFeedback } from "@/lib/validation/interview";

/**
 * Derive a 0–100 interview readiness score from stored turn feedback JSON.
 * Returns null when no valid scores exist (never invent a default).
 */
export function averageInterviewFeedbackScore(
  feedbackPayloads: unknown[],
): number | null {
  const scores: number[] = [];
  for (const payload of feedbackPayloads) {
    const parsed = safeParseInterviewFeedback(payload);
    if (parsed && Number.isFinite(parsed.overallScore)) {
      scores.push(parsed.overallScore);
    }
  }
  if (scores.length === 0) return null;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}
