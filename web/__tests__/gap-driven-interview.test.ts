import { describe, expect, it } from "vitest";
import {
  buildRehearsalPlan,
  generateGapDrivenQuestions,
} from "@/lib/interview/gap-driven";

describe("generateGapDrivenQuestions", () => {
  it("sources each question from a requirement gap", () => {
    const questions = generateGapDrivenQuestions([
      {
        matchType: "gap",
        importance: "required",
        requirementKey: "requiredSkills:kubernetes",
        requirementText: "Kubernetes",
      },
      {
        matchType: "strong",
        importance: "required",
        requirementKey: "requiredSkills:typescript",
        requirementText: "TypeScript",
      },
    ]);
    expect(questions.length).toBeGreaterThan(0);
    expect(questions.every((q) => q.sourceRequirementKey.includes("kubernetes") || q.sourceMatchType !== "strong")).toBe(
      true,
    );
    expect(questions[0].sourceRequirementKey).toBe("requiredSkills:kubernetes");
    expect(questions[0].prompt.toLowerCase()).not.toMatch(/invent/);
  });

  it("builds rehearsal plan linked to sources", () => {
    const questions = generateGapDrivenQuestions([
      {
        matchType: "partial",
        importance: "preferred",
        requirementKey: "preferredSkills:leadership",
        requirementText: "Leadership",
      },
    ]);
    const plan = buildRehearsalPlan(questions);
    expect(plan.evidenceActions[0]).toMatch(/Leadership/);
    expect(plan.repeatQuestions.length).toBeGreaterThan(0);
  });

  it("handles sparse matches without throwing", () => {
    expect(generateGapDrivenQuestions([])).toEqual([]);
  });
});
