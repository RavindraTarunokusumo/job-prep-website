import { describe, expect, it } from "vitest";
import {
  mapRequirementsToEvidence,
  selectGapDrivenTargets,
  summarizeMatchTypes,
} from "@/lib/matching";
import { buildCandidateOntologySnapshot } from "@/lib/ontology";
import { assertSafeActionText } from "@/lib/validation/requirement-match";
import type { JobRequirements } from "@/lib/validation/job-match";

const baseRequirements: JobRequirements = {
  requiredSkills: ["TypeScript", "PostgreSQL"],
  preferredSkills: ["Kubernetes"],
  responsibilities: ["Own API reliability"],
  experienceLevel: "mid",
  keywords: ["fintech"],
  tools: ["Docker"],
  certifications: [],
  interviewTopics: [],
  inferredNotes: [],
};

describe("mapRequirementsToEvidence", () => {
  it("maps confirmed skill to strong match", () => {
    const snapshot = buildCandidateOntologySnapshot({
      skills: [
        {
          id: "sk-ts",
          userId: "u1",
          name: "TypeScript",
          normalizedName: "typescript",
          verification: "confirmed",
          confidence: 1,
          version: 1,
        },
      ],
      evidence: [],
      stories: [],
      achievements: [],
      signals: [],
      targets: [],
    });
    const drafts = mapRequirementsToEvidence("jd1", "u1", baseRequirements, snapshot);
    const ts = drafts.find((d) => d.requirementKey === "requiredSkills:typescript");
    expect(ts?.matchType).toBe("strong");
    expect(ts?.skillId).toBe("sk-ts");
    expect(ts?.userReview).toBe("suggested");
  });

  it("never treats inferred skill as strong", () => {
    const snapshot = buildCandidateOntologySnapshot({
      skills: [
        {
          id: "sk-pg",
          userId: "u1",
          name: "PostgreSQL",
          normalizedName: "postgresql",
          verification: "inferred",
          confidence: 0.9,
          version: 1,
        },
      ],
    });
    const drafts = mapRequirementsToEvidence("jd1", "u1", baseRequirements, snapshot);
    const pg = drafts.find((d) => d.requirementKey === "requiredSkills:postgresql");
    expect(pg?.matchType).toBe("keyword_only");
    expect(pg?.userReview).toBe("suggested");
  });

  it("emits gap with non-fabricating safe action for missing required skill", () => {
    const snapshot = buildCandidateOntologySnapshot({});
    const drafts = mapRequirementsToEvidence("jd1", "u1", baseRequirements, snapshot);
    const k8s = drafts.find((d) => d.requirementKey === "preferredSkills:kubernetes");
    expect(k8s?.matchType).toBe("gap");
    expect(k8s?.safeAction?.toLowerCase()).not.toMatch(/invent|fabricate|make up/);
  });

  it("partial match against confirmed evidence text", () => {
    const snapshot = buildCandidateOntologySnapshot({
      evidence: [
        {
          id: "ev1",
          userId: "u1",
          title: "Platform engineer",
          sourceType: "employment",
          responsibilities: "Owned API reliability and on-call for payment services",
          verification: "confirmed",
          confidence: 1,
          version: 1,
        },
      ],
    });
    const drafts = mapRequirementsToEvidence("jd1", "u1", baseRequirements, snapshot);
    const resp = drafts.find((d) => d.requirementKey.startsWith("responsibilities:"));
    expect(resp?.matchType === "partial" || resp?.matchType === "transferable").toBe(
      true,
    );
    expect(resp?.evidenceId).toBe("ev1");
  });

  it("selectGapDrivenTargets prioritizes weak required/preferred items", () => {
    const snapshot = buildCandidateOntologySnapshot({});
    const drafts = mapRequirementsToEvidence("jd1", "u1", baseRequirements, snapshot);
    const gaps = selectGapDrivenTargets(drafts);
    expect(gaps.length).toBeGreaterThan(0);
    expect(gaps.every((g) => g.matchType !== "strong")).toBe(true);
  });

  it("summarizeMatchTypes counts classifications", () => {
    const counts = summarizeMatchTypes([
      { matchType: "strong" },
      { matchType: "gap" },
      { matchType: "gap" },
    ]);
    expect(counts.strong).toBe(1);
    expect(counts.gap).toBe(2);
  });
});

describe("assertSafeActionText", () => {
  it("rejects fabrication language", () => {
    expect(() => assertSafeActionText("Just invent experience for this skill")).toThrow(
      /fabricat/i,
    );
  });
});
