import { describe, expect, it } from "vitest";
import {
  buildTrendInsights,
  compareAttempts,
  normalizeScore,
  sortAttemptsNewestFirst,
  type ProgressAttempt,
} from "@/lib/progress/compare";

const base = (over: Partial<ProgressAttempt>): ProgressAttempt => ({
  id: "x",
  kind: "resume_review",
  label: "Review",
  score: 70,
  completedAt: "2026-07-01T00:00:00.000Z",
  ...over,
});

describe("normalizeScore", () => {
  it("passes through 0-100 scores", () => {
    expect(normalizeScore(72)).toBe(72);
  });

  it("normalizes assessment raw/max", () => {
    expect(normalizeScore(8, 10)).toBe(80);
  });

  it("returns null for missing", () => {
    expect(normalizeScore(null)).toBeNull();
  });
});

describe("compareAttempts", () => {
  it("flags incompatible kinds", () => {
    const r = compareAttempts(
      base({ kind: "resume_review", id: "a" }),
      base({ kind: "interview", id: "b", score: 80 })
    );
    expect(r.compatible).toBe(false);
    if (!r.compatible) expect(r.reason).toMatch(/kinds must match/i);
  });

  it("flags assessment maxScore mismatch", () => {
    const r = compareAttempts(
      base({
        kind: "assessment",
        id: "a",
        score: 8,
        maxScore: 10,
      }),
      base({
        kind: "assessment",
        id: "b",
        score: 15,
        maxScore: 20,
        completedAt: "2026-07-10T00:00:00.000Z",
      })
    );
    expect(r.compatible).toBe(false);
  });

  it("computes positive delta with explanation", () => {
    const r = compareAttempts(
      base({ id: "a", score: 60, completedAt: "2026-06-01T00:00:00.000Z" }),
      base({ id: "b", score: 75, completedAt: "2026-07-01T00:00:00.000Z" })
    );
    expect(r.compatible).toBe(true);
    if (r.compatible) {
      expect(r.delta).toBe(15);
      expect(r.explanation).toMatch(/improved by 15/i);
      expect(r.explanation).toMatch(/60 → 75/);
    }
  });

  it("handles missing scores without inventing delta", () => {
    const r = compareAttempts(
      base({ id: "a", score: null }),
      base({ id: "b", score: 80 })
    );
    expect(r.compatible).toBe(true);
    if (r.compatible) {
      expect(r.delta).toBeNull();
      expect(r.explanation).toMatch(/cannot be computed/i);
    }
  });
});

describe("buildTrendInsights", () => {
  it("returns partial message when insufficient data", () => {
    const r = buildTrendInsights([
      base({ id: "1", score: 70 }),
    ]);
    expect(r.partial).toBe(true);
    expect(r.insights[0]).toMatch(/Not enough comparable/i);
  });

  it("surfaces improvement across scored attempts", () => {
    const r = buildTrendInsights([
      base({
        id: "1",
        score: 50,
        completedAt: "2026-05-01T00:00:00.000Z",
      }),
      base({
        id: "2",
        score: 70,
        completedAt: "2026-06-01T00:00:00.000Z",
      }),
      base({
        id: "3",
        score: 80,
        completedAt: "2026-07-01T00:00:00.000Z",
      }),
    ]);
    expect(r.partial).toBe(false);
    expect(r.insights.some((i) => /improved 30/i.test(i))).toBe(true);
  });

  it("filters by role and date range", () => {
    const r = buildTrendInsights(
      [
        base({
          id: "1",
          score: 40,
          targetRole: "Backend Engineer",
          completedAt: "2026-01-01T00:00:00.000Z",
        }),
        base({
          id: "2",
          score: 90,
          targetRole: "Backend Engineer",
          completedAt: "2026-07-01T00:00:00.000Z",
        }),
        base({
          id: "3",
          score: 10,
          targetRole: "Designer",
          completedAt: "2026-07-01T00:00:00.000Z",
        }),
      ],
      {
        role: "Backend",
        from: "2026-06-01T00:00:00.000Z",
        to: "2026-08-01T00:00:00.000Z",
      }
    );
    // only one attempt in range for that role → partial
    expect(r.partial).toBe(true);
  });
});

describe("sortAttemptsNewestFirst", () => {
  it("orders by completedAt desc", () => {
    const sorted = sortAttemptsNewestFirst([
      base({ id: "old", completedAt: "2026-01-01T00:00:00.000Z" }),
      base({ id: "new", completedAt: "2026-07-01T00:00:00.000Z" }),
    ]);
    expect(sorted[0].id).toBe("new");
  });
});
