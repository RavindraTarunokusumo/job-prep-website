import { describe, expect, it } from "vitest";
import { isPlanStale } from "@/lib/plan/staleness";
import {
  parsePrepPlanGeneration,
  prepPlanGenerationSchema,
  prepPlanItemStatusSchema,
} from "@/lib/validation/prep-plan";

const validPlan = {
  summary: "Focus on CV metrics and a targeted JD match before applying.",
  items: [
    {
      category: "cv" as const,
      title: "Add quantified outcomes",
      description: "Strengthen impact bullets in latest role.",
      reason: "Resume review flagged missing metrics.",
      priority: 1,
      href: "/resume/check",
    },
    {
      category: "application" as const,
      title: "Paste target JD",
      reason: "No job match yet for tailoring.",
      priority: 2,
      href: "/jobs/match",
    },
  ],
};

describe("prepPlanGenerationSchema", () => {
  it("accepts a valid fixture", () => {
    const result = prepPlanGenerationSchema.safeParse(validPlan);
    expect(result.success).toBe(true);
    expect(parsePrepPlanGeneration(validPlan)).toEqual(validPlan);
  });

  it("rejects empty items array", () => {
    const invalid = { ...validPlan, items: [] };
    expect(prepPlanGenerationSchema.safeParse(invalid).success).toBe(false);
    expect(() => parsePrepPlanGeneration(invalid)).toThrow();
  });

  it("rejects invalid category", () => {
    const invalid = {
      ...validPlan,
      items: [{ ...validPlan.items[0], category: "invalid" }],
    };
    expect(prepPlanGenerationSchema.safeParse(invalid).success).toBe(false);
  });
});

describe("prepPlanItemStatusSchema", () => {
  it("accepts todo, done, and skipped", () => {
    expect(prepPlanItemStatusSchema.safeParse("todo").success).toBe(true);
    expect(prepPlanItemStatusSchema.safeParse("done").success).toBe(true);
    expect(prepPlanItemStatusSchema.safeParse("skipped").success).toBe(true);
  });

  it("rejects invalid status", () => {
    expect(prepPlanItemStatusSchema.safeParse("pending").success).toBe(false);
  });
});

describe("isPlanStale", () => {
  const baseSources = {
    profileUpdatedAt: new Date("2026-07-10T12:00:00Z"),
    latestReviewId: "review-1",
    latestMatchId: "match-1",
  };

  it("returns false when sources match plan snapshot", () => {
    expect(
      isPlanStale(
        {
          sourceProfileUpdatedAt: new Date("2026-07-10T12:00:00Z"),
          sourceResumeReviewId: "review-1",
          sourceJobMatchId: "match-1",
        },
        baseSources
      )
    ).toBe(false);
  });

  it("returns true when profile updatedAt changed", () => {
    expect(
      isPlanStale(
        {
          sourceProfileUpdatedAt: new Date("2026-07-09T12:00:00Z"),
          sourceResumeReviewId: "review-1",
          sourceJobMatchId: "match-1",
        },
        baseSources
      )
    ).toBe(true);
  });

  it("returns true when latest review id changed", () => {
    expect(
      isPlanStale(
        {
          sourceProfileUpdatedAt: new Date("2026-07-10T12:00:00Z"),
          sourceResumeReviewId: "review-old",
          sourceJobMatchId: "match-1",
        },
        baseSources
      )
    ).toBe(true);
  });

  it("returns true when latest match id changed", () => {
    expect(
      isPlanStale(
        {
          sourceProfileUpdatedAt: new Date("2026-07-10T12:00:00Z"),
          sourceResumeReviewId: "review-1",
          sourceJobMatchId: "match-old",
        },
        baseSources
      )
    ).toBe(true);
  });

  it("returns true when plan had no review but a review now exists", () => {
    expect(
      isPlanStale(
        {
          sourceProfileUpdatedAt: new Date("2026-07-10T12:00:00Z"),
          sourceResumeReviewId: null,
          sourceJobMatchId: null,
        },
        baseSources
      )
    ).toBe(true);
  });

  it("returns true when plan had no match but a match now exists", () => {
    expect(
      isPlanStale(
        {
          sourceProfileUpdatedAt: new Date("2026-07-10T12:00:00Z"),
          sourceResumeReviewId: "review-1",
          sourceJobMatchId: null,
        },
        {
          ...baseSources,
          latestMatchId: "match-new",
        }
      )
    ).toBe(true);
  });

  it("returns false when both plan and sources lack optional ids", () => {
    expect(
      isPlanStale(
        {
          sourceProfileUpdatedAt: new Date("2026-07-10T12:00:00Z"),
          sourceResumeReviewId: null,
          sourceJobMatchId: null,
        },
        {
          profileUpdatedAt: new Date("2026-07-10T12:00:00Z"),
          latestReviewId: null,
          latestMatchId: null,
        }
      )
    ).toBe(false);
  });
});