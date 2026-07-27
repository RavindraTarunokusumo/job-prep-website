import { describe, expect, it } from "vitest";
import { filterDraftsForRemap, remapDeleteReviews } from "@/lib/matching";
import type { RequirementMatchDraft } from "@/lib/validation/requirement-match";

function draft(key: string): RequirementMatchDraft {
  return {
    userId: "u1",
    jobDescriptionId: "jd1",
    requirementKey: key,
    requirementText: key,
    importance: "required",
    matchType: "gap",
    evidenceStrength: 0,
    confidence: 0.2,
    explanation: "gap",
    userReview: "suggested",
    version: 1,
  };
}

describe("filterDraftsForRemap", () => {
  it("skips keys already confirmed or replaced", () => {
    const drafts = [draft("requiredSkills:ts"), draft("requiredSkills:go")];
    const existing = [
      { requirementKey: "requiredSkills:ts", userReview: "confirmed" },
      { requirementKey: "requiredSkills:py", userReview: "suggested" },
    ];
    const filtered = filterDraftsForRemap(drafts, existing);
    expect(filtered.map((d) => d.requirementKey)).toEqual([
      "requiredSkills:go",
    ]);
  });

  it("allows re-suggesting rejected keys", () => {
    const drafts = [draft("requiredSkills:k8s")];
    const existing = [
      { requirementKey: "requiredSkills:k8s", userReview: "rejected" },
    ];
    expect(filterDraftsForRemap(drafts, existing)).toHaveLength(1);
  });
});

describe("remapDeleteReviews", () => {
  it("only deletes suggested and rejected rows", () => {
    expect(remapDeleteReviews()).toEqual(["suggested", "rejected"]);
  });
});
