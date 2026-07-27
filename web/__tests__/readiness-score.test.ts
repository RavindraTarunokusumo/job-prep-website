import { describe, expect, it } from "vitest";
import { computeApplicationReadiness } from "@/lib/readiness/score";
import { readinessTextIsSafe } from "@/lib/validation/readiness";

describe("computeApplicationReadiness", () => {
  it("produces dimension scores with low confidence when sparse", () => {
    const score = computeApplicationReadiness({
      userId: "u1",
      matches: [],
    });
    expect(score.confidenceBand).toBe("sparse");
    expect(score.dimensions.dimensions).toHaveLength(6);
    expect(score.explanations?.disclaimer).toMatch(/not hire probability/i);
  });

  it("raises coverage when required matches are strong", () => {
    const score = computeApplicationReadiness({
      userId: "u1",
      jobDescriptionId: "jd1",
      matches: [
        {
          matchType: "strong",
          importance: "required",
          evidenceStrength: 90,
          requirementKey: "requiredSkills:ts",
        },
        {
          matchType: "strong",
          importance: "required",
          evidenceStrength: 85,
          requirementKey: "requiredSkills:sql",
        },
      ],
      cvScore: 70,
      prepCompletion: 0.5,
      interviewScore: 60,
      executionScore: 40,
    });
    const coverage = score.dimensions.dimensions.find(
      (d) => d.key === "requirement_coverage",
    );
    expect(coverage?.score).toBe(100);
    expect(score.overallScore).not.toBeNull();
    expect(["partial", "ready"]).toContain(score.confidenceBand);
  });

  it("never embeds hire-probability language", () => {
    const score = computeApplicationReadiness({
      userId: "u1",
      matches: [
        {
          matchType: "gap",
          importance: "required",
          evidenceStrength: 0,
          requirementKey: "x",
        },
      ],
    });
    for (const d of score.dimensions.dimensions) {
      expect(readinessTextIsSafe(d.explanation)).toBe(true);
    }
  });
});
