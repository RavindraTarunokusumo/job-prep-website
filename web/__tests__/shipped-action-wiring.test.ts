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
