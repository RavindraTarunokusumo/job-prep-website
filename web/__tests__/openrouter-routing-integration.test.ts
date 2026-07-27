import { describe, expect, it } from "vitest";
import { selectModelCandidates } from "@/lib/ai/openrouter";
import { resolveModelRoute } from "@/lib/ai/routing";
import { buildUsageEventPayload } from "@/lib/ai/routing";

describe("openrouter selectModelCandidates (JOB-90 shipped path)", () => {
  it("uses resolveModelRoute for workflow-tagged candidates", () => {
    const { candidates, promptVersion, route } = selectModelCandidates(
      "job_match",
      "matching",
    );
    const expected = resolveModelRoute("job_match", "matching");
    expect(route.workflow).toBe("job_match");
    expect(route.taskClass).toBe("matching");
    expect(candidates[0]).toBe(expected.primaryModel);
    expect(promptVersion).toBe(expected.promptVersion);
    expect(candidates.length).toBeGreaterThanOrEqual(1);
  });

  it("tags interview generation separately from matching", () => {
    const match = selectModelCandidates("job_match", "matching");
    const interview = selectModelCandidates(
      "mock_interview",
      "interview_generation",
    );
    expect(match.route.taskClass).toBe("matching");
    expect(interview.route.taskClass).toBe("interview_generation");
    expect(interview.promptVersion).toBe("interview-v1");
  });
});

describe("usage payload never keeps raw content", () => {
  it("sanitizes meta via buildUsageEventPayload used by recordAiUsageEvent", () => {
    const payload = buildUsageEventPayload({
      workflow: "resume_review",
      taskClass: "feedback",
      model: "test",
      success: true,
      meta: { rawContent: "SECRET", latencyBucket: 1 },
    });
    expect(payload.meta).toEqual({ latencyBucket: 1 });
  });
});
