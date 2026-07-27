import { describe, expect, it } from "vitest";
import {
  buildCandidateOntologySnapshot,
  getActiveSkills,
  getReadyStarStories,
  getTrustedEvidence,
} from "@/lib/ontology";
import type {
  CareerEvidenceRecord,
  SkillRecord,
  StarStoryRecord,
} from "@/lib/validation/ontology";

function evidence(
  partial: Partial<CareerEvidenceRecord> & Pick<CareerEvidenceRecord, "id" | "verification">,
): CareerEvidenceRecord {
  return {
    userId: "u1",
    title: "Role",
    sourceType: "employment",
    confidence: 0.5,
    version: 1,
    ...partial,
  };
}

function story(
  partial: Partial<StarStoryRecord> &
    Pick<StarStoryRecord, "id" | "readiness" | "verification">,
): StarStoryRecord {
  return {
    userId: "u1",
    title: "Story",
    situation: "S",
    task: "T",
    action: "A",
    result: "R",
    confidence: 0.5,
    version: 1,
    ...partial,
  };
}

function skill(
  partial: Partial<SkillRecord> & Pick<SkillRecord, "id" | "verification">,
): SkillRecord {
  return {
    userId: "u1",
    name: "Skill",
    normalizedName: "skill",
    confidence: 0.5,
    version: 1,
    ...partial,
  };
}

describe("getTrustedEvidence", () => {
  it("returns only confirmed facts", () => {
    const items = [
      evidence({ id: "1", verification: "confirmed" }),
      evidence({ id: "2", verification: "inferred" }),
      evidence({ id: "3", verification: "imported" }),
      evidence({ id: "4", verification: "unconfirmed" }),
    ];
    expect(getTrustedEvidence(items).map((e) => e.id)).toEqual(["1"]);
  });

  it("never treats inferred as trusted", () => {
    expect(getTrustedEvidence([evidence({ id: "x", verification: "inferred" })])).toEqual(
      [],
    );
  });
});

describe("getReadyStarStories", () => {
  it("requires readiness ready and confirmed by default", () => {
    const items = [
      story({ id: "1", readiness: "ready", verification: "confirmed" }),
      story({ id: "2", readiness: "ready", verification: "unconfirmed" }),
      story({ id: "3", readiness: "draft", verification: "confirmed" }),
      story({ id: "4", readiness: "ready", verification: "inferred" }),
    ];
    expect(getReadyStarStories(items).map((s) => s.id)).toEqual(["1"]);
  });

  it("can include unconfirmed ready stories when opted in", () => {
    const items = [
      story({ id: "1", readiness: "ready", verification: "unconfirmed" }),
      story({ id: "2", readiness: "ready", verification: "inferred" }),
    ];
    expect(
      getReadyStarStories(items, { includeUnconfirmed: true }).map((s) => s.id),
    ).toEqual(["1"]);
  });
});

describe("getActiveSkills", () => {
  it("excludes archived", () => {
    expect(
      getActiveSkills([
        skill({ id: "1", verification: "confirmed", normalizedName: "a" }),
        skill({ id: "2", verification: "archived", normalizedName: "b" }),
      ]).map((s) => s.id),
    ).toEqual(["1"]);
  });
});

describe("buildCandidateOntologySnapshot", () => {
  it("filters to trusted-only when requested", () => {
    const snap = buildCandidateOntologySnapshot({
      trustedOnly: true,
      generatedAt: "2026-07-27T12:00:00.000Z",
      skills: [
        skill({
          id: "s1",
          verification: "confirmed",
          name: "Go",
          normalizedName: "go",
        }),
        skill({
          id: "s2",
          verification: "inferred",
          name: "Rust",
          normalizedName: "rust",
        }),
      ],
      evidence: [
        evidence({ id: "e1", verification: "confirmed", title: "Acme" }),
        evidence({ id: "e2", verification: "inferred", title: "Guess" }),
      ],
      stories: [
        story({ id: "st1", readiness: "ready", verification: "confirmed" }),
        story({ id: "st2", readiness: "ready", verification: "unconfirmed" }),
      ],
      achievements: [],
      signals: [],
      targets: [
        {
          id: "t1",
          userId: "u1",
          title: "Backend Engineer",
          priority: 1,
          isPrimary: true,
        },
      ],
    });
    expect(snap.skills.map((s) => s.id)).toEqual(["s1"]);
    expect(snap.evidence.map((e) => e.id)).toEqual(["e1"]);
    expect(snap.stories.map((s) => s.id)).toEqual(["st1"]);
    expect(snap.targets).toHaveLength(1);
    expect(snap.generatedAt).toBe("2026-07-27T12:00:00.000Z");
  });

  it("workspace mode excludes archived but keeps unconfirmed", () => {
    const snap = buildCandidateOntologySnapshot({
      trustedOnly: false,
      evidence: [
        evidence({ id: "e1", verification: "unconfirmed" }),
        evidence({ id: "e2", verification: "archived" }),
      ],
    });
    expect(snap.evidence.map((e) => e.id)).toEqual(["e1"]);
  });
});
