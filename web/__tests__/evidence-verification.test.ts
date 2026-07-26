import { describe, expect, it } from "vitest";
import {
  assertStarFromConfirmedEvidence,
  canConfirmEvidence,
  listConfirmedEvidence,
  listReadyStars,
  starPersistFieldsFromSeed,
  transitionVerification,
} from "@/lib/evidence/verification";
import {
  createEvidenceSchema,
  createStarStorySchema,
} from "@/lib/validation/evidence";

describe("evidence schemas", () => {
  it("accepts valid evidence create", () => {
    const r = createEvidenceSchema.safeParse({
      title: "Backend at Acme",
      sourceType: "employment",
      organization: "Acme",
      metrics: "p95 latency -30%",
    });
    expect(r.success).toBe(true);
  });

  it("rejects invalid source type", () => {
    expect(
      createEvidenceSchema.safeParse({
        title: "x",
        sourceType: "internship",
      }).success
    ).toBe(false);
  });

  it("requires STAR fields", () => {
    expect(
      createStarStorySchema.safeParse({
        title: "Story",
        situation: "S",
        task: "T",
        action: "A",
        result: "R",
      }).success
    ).toBe(true);
    expect(
      createStarStorySchema.safeParse({ title: "Story" }).success
    ).toBe(false);
  });
});

describe("verification transitions", () => {
  it("allows confirm from unconfirmed/imported/inferred", () => {
    expect(canConfirmEvidence("unconfirmed")).toBe(true);
    expect(canConfirmEvidence("imported")).toBe(true);
    expect(canConfirmEvidence("inferred")).toBe(true);
    expect(canConfirmEvidence("confirmed")).toBe(false);
    expect(canConfirmEvidence("archived")).toBe(false);
  });

  it("transitionVerification enforces allowed edges", () => {
    expect(transitionVerification("unconfirmed", "confirmed").ok).toBe(true);
    expect(transitionVerification("confirmed", "archived").ok).toBe(true);
    // invalid invent
    expect(transitionVerification("confirmed", "imported").ok).toBe(false);
  });
});

describe("assertStarFromConfirmedEvidence", () => {
  it("refuses unconfirmed evidence", () => {
    const r = assertStarFromConfirmedEvidence({
      id: "1",
      title: "Acme work",
      verification: "unconfirmed",
      achievements: "Shipped API",
      metrics: "99.9% uptime",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/confirmed/i);
  });

  it("seeds only from provided fields — does not invent metrics", () => {
    const r = assertStarFromConfirmedEvidence({
      id: "1",
      title: "Latency project",
      verification: "confirmed",
      organization: "Acme",
      roleTitle: "Engineer",
      responsibilities: "Own API reliability",
      achievements: "Reduced p95 latency",
      metrics: "",
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.seed.situation).toContain("Engineer");
      expect(r.seed.situation).toContain("Acme");
      expect(r.seed.task).toBe("Own API reliability");
      expect(r.seed.result).toBe("Reduced p95 latency");
      // empty metrics must not become fabricated numbers
      expect(r.seed.result).not.toMatch(/\d+%/);
    }
  });

  it("listConfirmedEvidence and listReadyStars filter correctly", () => {
    expect(
      listConfirmedEvidence([
        { id: "a", title: "A", verification: "confirmed" },
        { id: "b", title: "B", verification: "inferred" },
      ]).map((x) => x.id)
    ).toEqual(["a"]);
    expect(
      listReadyStars([
        { readiness: "draft" },
        { readiness: "ready" },
      ])
    ).toHaveLength(1);
  });
});

describe("starPersistFieldsFromSeed (shipped createStarFromEvidenceAction path)", () => {
  it("leaves empty task/action/result empty — no invent filler prompts", () => {
    const gate = assertStarFromConfirmedEvidence({
      id: "1",
      title: "Latency work",
      verification: "confirmed",
      organization: "Acme",
      roleTitle: "Engineer",
      responsibilities: "",
      achievements: "",
      metrics: "",
    });
    expect(gate.ok).toBe(true);
    if (!gate.ok) return;

    // Same mapping used by createStarFromEvidenceAction before prisma.create
    const fields = starPersistFieldsFromSeed(gate.seed);
    expect(fields.task).toBe("");
    expect(fields.action).toBe("");
    expect(fields.result).toBe("");
    expect(fields.readiness).toBe("draft");
    expect(fields.task).not.toMatch(/Describe the task/i);
    expect(fields.action).not.toMatch(/Describe the actions/i);
    expect(fields.result).not.toMatch(/Describe the outcome/i);
    expect(fields.situation).toContain("Engineer");
    expect(fields.situation).toContain("Acme");
  });

  it("preserves only user-provided achievements/metrics without inventing numbers", () => {
    const gate = assertStarFromConfirmedEvidence({
      id: "2",
      title: "API project",
      verification: "confirmed",
      responsibilities: "Own reliability",
      achievements: "Reduced p95",
      metrics: "",
    });
    expect(gate.ok).toBe(true);
    if (!gate.ok) return;
    const fields = starPersistFieldsFromSeed(gate.seed);
    expect(fields.task).toBe("Own reliability");
    expect(fields.action).toBe("Reduced p95");
    expect(fields.result).toBe("Reduced p95");
    expect(fields.result).not.toMatch(/\d+%/);
  });
});
