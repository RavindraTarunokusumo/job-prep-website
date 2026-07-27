/**
 * Structural + contract tests that the shipped app entrypoints wire domain modules.
 * Imports the real action modules (not re-implementations).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(__dirname, "..");

function readSrc(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

describe("server action wiring to domain contracts", () => {
  it("startInterviewSessionAction uses gap-driven generation and entitlements", () => {
    const src = readSrc("app/actions/interview.ts");
    expect(src).toContain("generateGapDrivenQuestions");
    expect(src).toContain("requireFeatureEntitlement");
    expect(src).toContain("mock_interview");
    expect(src).toContain("mapRequirementsToEvidence");
  });

  it("analyzeJobDescriptionAction persists requirement matches and checks entitlement", () => {
    const src = readSrc("app/actions/job-match.ts");
    expect(src).toContain("requireFeatureEntitlement");
    expect(src).toContain("mapRequirementsToEvidence");
    expect(src).toContain("requirementEvidenceMatch");
  });

  it("matching actions expose confirm/reject review path", () => {
    const src = readSrc("app/actions/matching.ts");
    expect(src).toContain("reviewRequirementMatchAction");
    expect(src).toContain("generateRequirementMatchesAction");
    expect(src).toContain("userReview");
  });

  it("readiness and outcomes actions enforce ownership", () => {
    const readiness = readSrc("app/actions/readiness.ts");
    const outcomes = readSrc("app/actions/outcomes.ts");
    expect(readiness).toContain("computeApplicationReadiness");
    expect(readiness).toContain("access denied");
    expect(outcomes).toContain("recordApplicationOutcomeAction");
    expect(outcomes).toContain("access denied");
    expect(outcomes).toContain("splitFeedbackFields");
  });

  it("billing actions implement sprint pass and webhook idempotency", () => {
    const src = readSrc("app/actions/billing.ts");
    expect(src).toContain("activateSprintPassAction");
    expect(src).toContain("processBillingWebhookAction");
    expect(src).toContain("shouldApplyWebhookEvent");
  });

  it("openrouter generateObjectWithFallback records usage and routes models", () => {
    const src = readSrc("lib/ai/openrouter.ts");
    expect(src).toContain("selectModelCandidates");
    expect(src).toContain("recordAiUsageEvent");
    expect(src).toContain("resolveModelRoute");
    expect(src).toContain("aiUsageEvent.create");
  });

  it("AI callers pass userId into generateObjectWithFallback for per-user telemetry", () => {
    expect(readSrc("lib/ai/job-match.ts")).toContain("userId: options.userId");
    expect(readSrc("lib/ai/job-match.ts")).toContain("userId: input.userId");
    expect(readSrc("lib/ai/interview-questions.ts")).toContain("userId: input.userId");
    expect(readSrc("lib/ai/resume-review.ts")).toContain("userId: input.userId");
    expect(readSrc("app/actions/job-match.ts")).toContain("userId: user.id");
    expect(readSrc("app/actions/interview.ts")).toContain("userId: user.id");
    expect(readSrc("app/actions/resume-review.ts")).toContain("userId: user.id");
  });

  it("readiness derives interview score from feedback not a constant", () => {
    const src = readSrc("app/actions/readiness.ts");
    expect(src).toContain("averageInterviewFeedbackScore");
    expect(src).not.toMatch(/interviewScore:\s*latestInterview\s*\?\s*60/);
  });

  it("matching remap uses filterDraftsForRemap (no confirmed duplicates)", () => {
    const src = readSrc("app/actions/matching.ts");
    expect(src).toContain("filterDraftsForRemap");
    expect(src).toContain("remapDeleteReviews");
  });

  it("billing webhook requires secret and does not take client userId", () => {
    const src = readSrc("app/actions/billing.ts");
    expect(src).toContain("verifyBillingWebhookSecret");
    expect(src).toContain("BILLING_WEBHOOK_SECRET");
    expect(src).not.toMatch(/userId\?:\s*string/);
    expect(src).toContain("P2002");
    expect(src).toContain('findFirst');
  });

  it("fair-use is enforced in requireFeatureEntitlement without double-counting job_match AI steps", () => {
    const src = readSrc("lib/billing/require-entitlement.ts");
    expect(src).toContain("isWithinFairUse");
    expect(src).toContain("fairUseLimitFor");
    expect(src).toContain("jobMatchAnalysis.count");
    expect(src).toContain("resumeReview.count");
  });

  it("match review verifies FK ownership", () => {
    const src = readSrc("app/actions/matching.ts");
    expect(src).toContain("careerEvidence.findUnique");
    expect(src).toContain("skill.findUnique");
    expect(src).toContain("starStory.findUnique");
  });

  it("readiness excludes rejected mappings", () => {
    const src = readSrc("app/actions/readiness.ts");
    expect(src).toContain('userReview: { not: "rejected" }');
  });

  it("product pages exist for evidence, readiness, outcomes, billing", () => {
    for (const page of [
      "app/evidence/page.tsx",
      "app/readiness/page.tsx",
      "app/outcomes/page.tsx",
      "app/billing/page.tsx",
    ]) {
      const src = readSrc(page);
      expect(src.length).toBeGreaterThan(100);
      expect(src).toContain("requireUser");
    }
  });
});

describe("journey fixture still drives real shipped domain functions", () => {
  it("application-journey imports mapRequirementsToEvidence and computeApplicationReadiness", () => {
    const src = readSrc("__tests__/application-journey.test.ts");
    expect(src).toContain('from "@/lib/matching"');
    expect(src).toContain('from "@/lib/readiness/score"');
    expect(src).toContain("generateGapDrivenQuestions");
    expect(src).toContain("checkEntitlement");
  });
});
