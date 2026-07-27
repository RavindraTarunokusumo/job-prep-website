import { describe, expect, it } from "vitest";
import {
  buildUsageEventPayload,
  estimateCostUsd,
  resolveModelRoute,
  sanitizeTelemetryMeta,
} from "@/lib/ai/routing";

describe("resolveModelRoute", () => {
  it("tags workflow and task class with primary and fallback", () => {
    const route = resolveModelRoute("job_match", "matching");
    expect(route.workflow).toBe("job_match");
    expect(route.taskClass).toBe("matching");
    expect(route.primaryModel.length).toBeGreaterThan(0);
    expect(route.fallbackModel.length).toBeGreaterThan(0);
    expect(route.promptVersion).toBe("match-v1");
  });
});

describe("telemetry sanitization", () => {
  it("strips raw content keys", () => {
    const clean = sanitizeTelemetryMeta({
      resumeText: "SECRET CV",
      tokenEstimate: 120,
      ok: true,
    });
    expect(clean).toEqual({ tokenEstimate: 120, ok: true });
  });

  it("builds usage payload without raw bodies", () => {
    const payload = buildUsageEventPayload({
      workflow: "resume_review",
      taskClass: "feedback",
      model: "test-model",
      success: true,
      meta: { rawContent: "nope", latencyBucket: 2 },
    });
    expect(payload.meta).toEqual({ latencyBucket: 2 });
  });
});

describe("estimateCostUsd", () => {
  it("scales with tokens", () => {
    const cost = estimateCostUsd("m", 1_000_000, 1_000_000, {
      inputPerMTok: 1,
      outputPerMTok: 2,
    });
    expect(cost).toBe(3);
  });
});
