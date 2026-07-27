import { describe, expect, it } from "vitest";
import {
  applyPlanChange,
  checkEntitlement,
  shouldApplyWebhookEvent,
  sprintPassWindow,
} from "@/lib/billing/entitlements";

describe("checkEntitlement", () => {
  it("allows free-tier features without subscription", () => {
    const d = checkEntitlement("resume_review", null);
    expect(d.allowed).toBe(true);
    expect(d.planCode).toBe("free");
  });

  it("denies mock interview on free", () => {
    const d = checkEntitlement("mock_interview", null);
    expect(d.allowed).toBe(false);
    expect(d.reason).toBe("plan_lacks_feature");
  });

  it("allows mock interview on active sprint pass before expiry", () => {
    const ends = new Date("2026-08-26T00:00:00.000Z");
    const d = checkEntitlement(
      "mock_interview",
      { planCode: "sprint_pass", status: "active", currentPeriodEnd: ends },
      new Date("2026-08-01T00:00:00.000Z"),
    );
    expect(d.allowed).toBe(true);
  });

  it("falls back to free after expiry", () => {
    const ends = new Date("2026-07-01T00:00:00.000Z");
    const d = checkEntitlement(
      "mock_interview",
      { planCode: "sprint_pass", status: "active", currentPeriodEnd: ends },
      new Date("2026-07-15T00:00:00.000Z"),
    );
    expect(d.allowed).toBe(false);
    expect(d.reason).toBe("subscription_expired");
  });
});

describe("sprintPassWindow", () => {
  it("activates for configured duration", () => {
    const start = new Date("2026-07-01T00:00:00.000Z");
    const { endsAt } = sprintPassWindow(start, 30);
    expect(endsAt.toISOString()).toBe("2026-07-31T00:00:00.000Z");
  });
});

describe("webhook idempotency", () => {
  it("rejects duplicate provider events", () => {
    const seen = new Set(["evt_1"]);
    expect(shouldApplyWebhookEvent("evt_1", seen).apply).toBe(false);
    expect(shouldApplyWebhookEvent("evt_2", seen).apply).toBe(true);
  });
});

describe("applyPlanChange", () => {
  it("handles plan upgrades with duration", () => {
    const next = applyPlanChange(
      { planCode: "free", status: "active", currentPeriodEnd: null },
      "sprint_pass",
      new Date("2026-07-01T00:00:00.000Z"),
    );
    expect(next.planCode).toBe("sprint_pass");
    expect(next.status).toBe("active");
    expect(next.currentPeriodEnd?.toISOString()).toBe("2026-07-31T00:00:00.000Z");
  });
});
