import { describe, expect, it } from "vitest";
import {
  confidenceAfterConfirm,
  mergeDuplicateSkills,
  normalizeSkillName,
  planSkillsFromProfile,
} from "@/lib/ontology/normalize";

describe("normalizeSkillName", () => {
  it("trims, collapses spaces, lowercases", () => {
    expect(normalizeSkillName("  Type  Script ")).toBe("type script");
    expect(normalizeSkillName("Python")).toBe("python");
  });
});

describe("mergeDuplicateSkills", () => {
  it("keeps confirmed over inferred for same normalized name", () => {
    const plans = mergeDuplicateSkills([
      { id: "a", normalizedName: "python", verification: "inferred", confidence: 0.9 },
      { id: "b", normalizedName: "python", verification: "confirmed", confidence: 0.5 },
      { id: "c", normalizedName: "go", verification: "unconfirmed" },
    ]);
    expect(plans).toHaveLength(1);
    expect(plans[0].keepId).toBe("b");
    expect(plans[0].mergeIds).toEqual(["a"]);
  });

  it("returns empty when no duplicates", () => {
    expect(
      mergeDuplicateSkills([
        { id: "a", normalizedName: "python", verification: "confirmed" },
        { id: "b", normalizedName: "go", verification: "confirmed" },
      ]),
    ).toEqual([]);
  });

  it("breaks ties with confidence then id", () => {
    const plans = mergeDuplicateSkills([
      { id: "z", normalizedName: "sql", verification: "unconfirmed", confidence: 0.4 },
      { id: "a", normalizedName: "sql", verification: "unconfirmed", confidence: 0.8 },
    ]);
    expect(plans[0].keepId).toBe("a");
    expect(plans[0].mergeIds).toEqual(["z"]);
  });
});

describe("confidenceAfterConfirm", () => {
  it("promotes to confirmed with confidence 1", () => {
    expect(confidenceAfterConfirm("inferred")).toEqual({
      verification: "confirmed",
      confidence: 1,
    });
  });

  it("does not revive archived", () => {
    expect(confidenceAfterConfirm("archived")).toEqual({
      verification: "archived",
      confidence: 0,
    });
  });
});

describe("planSkillsFromProfile", () => {
  it("dedupes case/whitespace variants and marks imported", () => {
    const planned = planSkillsFromProfile("user-1", [
      "Python",
      " python ",
      "Go",
      "",
      "  ",
    ]);
    expect(planned).toEqual([
      {
        name: "Python",
        normalizedName: "python",
        userId: "user-1",
        verification: "imported",
      },
      {
        name: "Go",
        normalizedName: "go",
        userId: "user-1",
        verification: "imported",
      },
    ]);
  });
});
