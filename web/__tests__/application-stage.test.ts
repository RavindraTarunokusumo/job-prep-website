import { describe, expect, it } from "vitest";
import {
  assertStageTransition,
  canTransitionStage,
  classifyActionUrgency,
  isTerminalStage,
  listWorkspaceActions,
  stageLabel,
} from "@/lib/applications/stage";
import {
  buildApplicationUpdatePayload,
  emptyToNullId,
  hasAttachments,
} from "@/lib/applications/update-fields";
import {
  applicationStageSchema,
  createApplicationSchema,
  updateApplicationSchema,
} from "@/lib/validation/application";

describe("applicationStageSchema", () => {
  it("accepts pipeline stages", () => {
    for (const s of [
      "interested",
      "preparing",
      "applied",
      "interview",
      "offer",
      "rejected",
      "withdrawn",
    ]) {
      expect(applicationStageSchema.safeParse(s).success).toBe(true);
    }
  });

  it("rejects unknown stages", () => {
    expect(applicationStageSchema.safeParse("phone_screen").success).toBe(
      false
    );
  });
});

describe("createApplicationSchema", () => {
  it("requires company and role", () => {
    expect(createApplicationSchema.safeParse({}).success).toBe(false);
    expect(
      createApplicationSchema.safeParse({
        company: "Acme",
        role: "Engineer",
      }).success
    ).toBe(true);
  });
});

describe("update + attach payload (workspace edit path)", () => {
  it("buildApplicationUpdatePayload includes next action and all attach IDs", () => {
    const payload = buildApplicationUpdatePayload("app-1", {
      nextAction: "Follow up recruiter",
      nextActionDue: "2026-08-01T12:00:00.000Z",
      notes: "Warm intro",
      jobDescriptionId: "jd-1",
      jobMatchAnalysisId: "match-1",
      applicationDraftId: "draft-1",
      interviewSessionId: "int-1",
      preparationPlanId: "plan-1",
    });
    expect(payload).toEqual({
      id: "app-1",
      nextAction: "Follow up recruiter",
      nextActionDue: "2026-08-01T12:00:00.000Z",
      notes: "Warm intro",
      jobDescriptionId: "jd-1",
      jobMatchAnalysisId: "match-1",
      applicationDraftId: "draft-1",
      interviewSessionId: "int-1",
      preparationPlanId: "plan-1",
    });
    expect(updateApplicationSchema.safeParse(payload).success).toBe(true);
  });

  it("empty attach strings clear to null", () => {
    expect(emptyToNullId("")).toBeNull();
    expect(emptyToNullId("  ")).toBeNull();
    expect(emptyToNullId("abc")).toBe("abc");
    const payload = buildApplicationUpdatePayload("app-2", {
      nextAction: null,
      nextActionDue: null,
      notes: null,
      jobDescriptionId: "",
      jobMatchAnalysisId: "  ",
      applicationDraftId: null,
      interviewSessionId: null,
      preparationPlanId: null,
    });
    expect(payload.jobDescriptionId).toBeNull();
    expect(payload.jobMatchAnalysisId).toBeNull();
  });

  it("hasAttachments detects linked prep records", () => {
    expect(
      hasAttachments({
        jobDescriptionId: null,
        jobMatchAnalysisId: "m1",
        applicationDraftId: null,
        interviewSessionId: null,
        preparationPlanId: null,
      })
    ).toBe(true);
    expect(
      hasAttachments({
        jobDescriptionId: null,
        jobMatchAnalysisId: null,
        applicationDraftId: null,
        interviewSessionId: null,
        preparationPlanId: null,
      })
    ).toBe(false);
  });
});

describe("stage transitions", () => {
  it("allows any known stage move including skips", () => {
    expect(canTransitionStage("interested", "applied")).toBe(true);
    expect(canTransitionStage("rejected", "interested")).toBe(true);
    expect(canTransitionStage("interview", "interview")).toBe(true);
  });

  it("assertStageTransition rejects unknown", () => {
    const bad = assertStageTransition("interested", "ghosted");
    expect(bad.ok).toBe(false);
  });

  it("marks offer/rejected/withdrawn as terminal", () => {
    expect(isTerminalStage("offer")).toBe(true);
    expect(isTerminalStage("rejected")).toBe(true);
    expect(isTerminalStage("applied")).toBe(false);
  });

  it("labels stages for UI", () => {
    expect(stageLabel("preparing")).toBe("Preparing");
  });
});

describe("classifyActionUrgency + listWorkspaceActions", () => {
  const now = new Date("2026-07-26T12:00:00.000Z");

  it("classifies overdue, upcoming, and none", () => {
    expect(
      classifyActionUrgency(new Date("2026-07-20T12:00:00.000Z"), now)
    ).toBe("overdue");
    expect(
      classifyActionUrgency(new Date("2026-07-28T12:00:00.000Z"), now)
    ).toBe("upcoming");
    expect(
      classifyActionUrgency(new Date("2026-09-01T12:00:00.000Z"), now)
    ).toBe("none");
    expect(classifyActionUrgency(null, now)).toBe("none");
  });

  it("lists overdue before upcoming and ignores archived", () => {
    const items = listWorkspaceActions(
      [
        {
          id: "1",
          company: "A",
          role: "R",
          stage: "applied",
          status: "active",
          nextAction: "Follow up",
          nextActionDue: "2026-07-28T12:00:00.000Z",
          updatedAt: now,
        },
        {
          id: "2",
          company: "B",
          role: "R",
          stage: "applied",
          status: "active",
          nextAction: "Submit",
          nextActionDue: "2026-07-20T12:00:00.000Z",
          updatedAt: now,
        },
        {
          id: "3",
          company: "C",
          role: "R",
          stage: "applied",
          status: "archived",
          nextAction: "Old",
          nextActionDue: "2026-07-20T12:00:00.000Z",
          updatedAt: now,
        },
        {
          id: "4",
          company: "D",
          role: "R",
          stage: "interested",
          status: "active",
          nextAction: null,
          nextActionDue: null,
          updatedAt: now,
        },
      ],
      now
    );
    expect(items.map((i) => i.id)).toEqual(["2", "1"]);
    expect(items[0].urgency).toBe("overdue");
    expect(items[1].urgency).toBe("upcoming");
  });
});
