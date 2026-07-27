import { describe, expect, it } from "vitest";
import {
  fairUseLimitFor,
  featureToWorkflow,
  isWithinFairUse,
  utcDayStart,
} from "@/lib/billing/fair-use";
import { verifyBillingWebhookSecret } from "@/lib/billing/webhook-auth";

describe("fair-use limits", () => {
  it("maps features to AI workflows", () => {
    expect(featureToWorkflow("job_match")).toBe("job_match");
    expect(featureToWorkflow("resume_review")).toBe("resume_review");
    expect(featureToWorkflow("unlimited_match")).toBeNull();
  });

  it("reads free-tier daily limits from plan config", () => {
    expect(fairUseLimitFor("free", "mock_interview")).toBe(3);
    expect(fairUseLimitFor("free", "job_match")).toBe(5);
    expect(fairUseLimitFor("pro", "mock_interview")).toBeNull();
  });

  it("blocks when usage reaches the limit", () => {
    expect(isWithinFairUse(2, 3).allowed).toBe(true);
    expect(isWithinFairUse(3, 3).allowed).toBe(false);
    expect(isWithinFairUse(3, 3).reason).toBe("fair_use_exceeded");
    expect(isWithinFairUse(10, null).allowed).toBe(true);
  });

  it("utcDayStart is midnight UTC", () => {
    const d = utcDayStart(new Date("2026-07-27T15:30:00.000Z"));
    expect(d.toISOString()).toBe("2026-07-27T00:00:00.000Z");
  });
});

describe("billing webhook auth", () => {
  it("rejects missing configured secret", () => {
    const r = verifyBillingWebhookSecret("x", null);
    expect(r.ok).toBe(false);
  });

  it("rejects mismatched secret", () => {
    const r = verifyBillingWebhookSecret("wrong", "expected");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/Unauthorized/);
  });

  it("accepts matching secret", () => {
    expect(verifyBillingWebhookSecret("s3cret", "s3cret").ok).toBe(true);
  });
});
