import { describe, expect, it } from "vitest";
import { averageInterviewFeedbackScore } from "@/lib/readiness/interview-score";

const sampleFeedback = {
  overallScore: 72,
  dimensions: {
    relevance: 4,
    specificity: 3,
    starStructure: 4,
    clarity: 4,
    roleAlignment: 3,
  },
  strengths: ["Clear structure"],
  improvements: ["Add metrics"],
  missingDetails: ["Team size"],
  rewriteSuggestion: "Led X resulting in Y.",
};

describe("averageInterviewFeedbackScore", () => {
  it("returns null when no valid feedback", () => {
    expect(averageInterviewFeedbackScore([])).toBeNull();
    expect(averageInterviewFeedbackScore([null, {}, "x"])).toBeNull();
  });

  it("averages real overallScore values only", () => {
    const avg = averageInterviewFeedbackScore([
      sampleFeedback,
      { ...sampleFeedback, overallScore: 80 },
    ]);
    expect(avg).toBe(76);
  });

  it("never invents a default score when feedback is missing", () => {
    expect(averageInterviewFeedbackScore([{ not: "feedback" }])).toBeNull();
  });
});
