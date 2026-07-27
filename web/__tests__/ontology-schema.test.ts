import { describe, expect, it } from "vitest";
import {
  careerEvidenceRecordSchema,
  createCareerEvidenceSchema,
  createSkillSchema,
  createStarStorySchema,
  isTrustedVerification,
  ontologySnapshotSchema,
  parseVerificationState,
  skillRecordSchema,
  verificationStateSchema,
} from "@/lib/validation/ontology";

describe("ontology verification enums", () => {
  it("accepts all verification states", () => {
    for (const state of [
      "imported",
      "inferred",
      "unconfirmed",
      "confirmed",
      "archived",
    ]) {
      expect(verificationStateSchema.parse(state)).toBe(state);
      expect(parseVerificationState(state)).toBe(state);
    }
  });

  it("rejects unknown verification", () => {
    expect(() => verificationStateSchema.parse("trusted")).toThrow();
  });

  it("only confirmed is trusted", () => {
    expect(isTrustedVerification("confirmed")).toBe(true);
    expect(isTrustedVerification("inferred")).toBe(false);
    expect(isTrustedVerification("imported")).toBe(false);
    expect(isTrustedVerification("unconfirmed")).toBe(false);
  });
});

describe("ontology record schemas", () => {
  it("accepts a valid skill record", () => {
    const skill = skillRecordSchema.parse({
      id: "sk1",
      userId: "u1",
      name: "TypeScript",
      normalizedName: "typescript",
      category: "technical",
      verification: "confirmed",
      confidence: 1,
      version: 1,
    });
    expect(skill.normalizedName).toBe("typescript");
  });

  it("rejects confidence outside 0–1", () => {
    expect(() =>
      skillRecordSchema.parse({
        id: "sk1",
        userId: "u1",
        name: "X",
        normalizedName: "x",
        verification: "confirmed",
        confidence: 1.5,
        version: 1,
      }),
    ).toThrow();
  });

  it("accepts career evidence with provenance", () => {
    const row = careerEvidenceRecordSchema.parse({
      id: "ev1",
      userId: "u1",
      title: "Backend Engineer",
      sourceType: "employment",
      organization: "Acme",
      verification: "confirmed",
      confidence: 1,
      provenance: { importedFrom: "resume", parser: "heuristic" },
      version: 1,
    });
    expect(row.provenance).toEqual({ importedFrom: "resume", parser: "heuristic" });
  });

  it("rejects invalid evidence sourceType", () => {
    expect(() =>
      createCareerEvidenceSchema.parse({
        title: "X",
        sourceType: "internship",
      }),
    ).toThrow();
  });

  it("defaults skill verification to unconfirmed", () => {
    const created = createSkillSchema.parse({ name: "React" });
    expect(created.verification).toBe("unconfirmed");
  });

  it("requires STAR body fields", () => {
    expect(() =>
      createStarStorySchema.parse({
        title: "Led launch",
        situation: "Deadline",
        task: "",
        action: "Coordinated",
        result: "Shipped",
      }),
    ).toThrow();
  });

  it("accepts empty ontology snapshot", () => {
    const snap = ontologySnapshotSchema.parse({
      skills: [],
      evidence: [],
      achievements: [],
      stories: [],
      signals: [],
      targets: [],
      generatedAt: "2026-07-27T00:00:00.000Z",
    });
    expect(snap.skills).toEqual([]);
  });
});
