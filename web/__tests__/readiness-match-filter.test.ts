import { describe, expect, it } from "vitest";
import { computeApplicationReadiness } from "@/lib/readiness/score";

/**
 * Documents readiness scoring contract: callers must exclude rejected mappings.
 * Action layer filters userReview !== rejected before calling this scorer.
 */
describe("readiness match filtering contract", () => {
  it("rejected-style gaps would lower score if included — callers exclude them", () => {
    const withGap = computeApplicationReadiness({
      userId: "u1",
      matches: [
        {
          matchType: "gap",
          importance: "required",
          evidenceStrength: 0,
          requirementKey: "k-rejected",
        },
      ],
    });
    const without = computeApplicationReadiness({
      userId: "u1",
      matches: [
        {
          matchType: "strong",
          importance: "required",
          evidenceStrength: 90,
          requirementKey: "k-ok",
        },
      ],
    });
    const covWith = withGap.dimensions.dimensions.find(
      (d) => d.key === "requirement_coverage",
    )?.score;
    const covWithout = without.dimensions.dimensions.find(
      (d) => d.key === "requirement_coverage",
    )?.score;
    expect(covWith).toBe(0);
    expect(covWithout).toBe(100);
  });
});
