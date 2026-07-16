import { describe, expect, it } from "vitest";
import {
  parseResumeReviewResult,
  resumeReviewResultSchema,
} from "@/lib/validation/resume-review";

const validFixture = {
  overallScore: 72,
  sectionScores: [
    { section: "Experience", score: 80, note: "Strong impact bullets" },
    { section: "Skills", score: 65 },
  ],
  strengths: ["Clear career progression", "Relevant technical skills"],
  weaknesses: ["Summary is generic"],
  atsRisks: ["Missing keywords for target role"],
  missingMetrics: ["No quantified outcomes in latest role"],
  priorityActions: [
    {
      title: "Add metrics to recent role",
      detail: "Include % or $ impact where possible.",
      priority: 1,
    },
  ],
  rewriteSuggestions: [
    {
      original: "Worked on backend services.",
      suggested: "Built backend services handling 2M requests/day.",
      rationale: "Adds scale without inventing employers.",
    },
  ],
  summary: "Solid foundation; strengthen metrics and ATS keywords.",
};

describe("resumeReviewResultSchema", () => {
  it("accepts a valid fixture", () => {
    const result = resumeReviewResultSchema.safeParse(validFixture);
    expect(result.success).toBe(true);
    expect(parseResumeReviewResult(validFixture)).toEqual(validFixture);
  });

  it("rejects out-of-range overallScore", () => {
    const result = resumeReviewResultSchema.safeParse({
      ...validFixture,
      overallScore: 101,
    });
    expect(result.success).toBe(false);
    expect(() =>
      parseResumeReviewResult({ ...validFixture, overallScore: 101 })
    ).toThrow();
  });

  it("rejects missing summary", () => {
    const withoutSummary = { ...validFixture };
    delete (withoutSummary as { summary?: string }).summary;
    const result = resumeReviewResultSchema.safeParse(withoutSummary);
    expect(result.success).toBe(false);
    expect(() => parseResumeReviewResult(withoutSummary)).toThrow();
  });
});
