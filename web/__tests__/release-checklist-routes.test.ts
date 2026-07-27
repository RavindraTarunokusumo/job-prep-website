/**
 * JOB-92 release checklist — structural + import checks for critical product routes.
 * Browser Playwright E2E remains optional; these assert shipped pages and action
 * entrypoints exist and reference the real domain modules.
 */
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { averageInterviewFeedbackScore } from "@/lib/readiness/interview-score";
import { filterDraftsForRemap } from "@/lib/matching";
import { isWithinFairUse, fairUseLimitFor } from "@/lib/billing/fair-use";
import { verifyBillingWebhookSecret } from "@/lib/billing/webhook-auth";
import { selectModelCandidates } from "@/lib/ai/openrouter";

const root = join(__dirname, "..");

const CRITICAL_PAGES = [
  "app/evidence/page.tsx",
  "app/readiness/page.tsx",
  "app/outcomes/page.tsx",
  "app/billing/page.tsx",
  "app/interview/page.tsx",
  "app/jobs/match/page.tsx",
] as const;

describe("JOB-92 release checklist — critical routes present", () => {
  for (const page of CRITICAL_PAGES) {
    it(`ships ${page}`, () => {
      const path = join(root, page);
      expect(existsSync(path)).toBe(true);
      const src = readFileSync(path, "utf8");
      expect(src).toContain("requireUser");
      expect(src.length).toBeGreaterThan(200);
    });
  }

  it("readiness page wires match review + readiness generate", () => {
    const src = readFileSync(join(root, "app/readiness/page.tsx"), "utf8");
    expect(src).toContain("MatchReviewList");
    expect(src).toContain("GenerateReadinessButton");
  });

  it("interview page accepts jobId for gap-driven start", () => {
    const src = readFileSync(join(root, "app/interview/page.tsx"), "utf8");
    expect(src).toContain("jobId");
    expect(src).toContain("initialJobDescriptionId");
  });
});

describe("JOB-92 release checklist — real domain functions execute", () => {
  it("interview score helper rejects empty feedback", () => {
    expect(averageInterviewFeedbackScore([])).toBeNull();
  });

  it("remap filter protects confirmed keys", () => {
    const filtered = filterDraftsForRemap(
      [
        {
          userId: "u",
          jobDescriptionId: "j",
          requirementKey: "k1",
          requirementText: "K1",
          importance: "required",
          matchType: "gap",
          evidenceStrength: 0,
          confidence: 0.2,
          explanation: "x",
          userReview: "suggested",
          version: 1,
        },
      ],
      [{ requirementKey: "k1", userReview: "confirmed" }],
    );
    expect(filtered).toEqual([]);
  });

  it("fair-use and webhook auth helpers work", () => {
    expect(isWithinFairUse(0, fairUseLimitFor("free", "mock_interview")).allowed).toBe(
      true,
    );
    expect(verifyBillingWebhookSecret("a", "b").ok).toBe(false);
  });

  it("model routing still resolves candidates", () => {
    const { candidates } = selectModelCandidates("job_match", "matching");
    expect(candidates.length).toBeGreaterThan(0);
  });
});
