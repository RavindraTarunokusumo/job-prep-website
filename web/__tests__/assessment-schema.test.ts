import { describe, expect, it } from "vitest";
import {
  attemptStatusSchema,
  categorySlugSchema,
  choiceSchema,
  parseCategorySlug,
  parseQuestionPayload,
  questionPayloadSchema,
} from "@/lib/validation/assessment";

describe("categorySlugSchema", () => {
  it("accepts known category slugs", () => {
    expect(categorySlugSchema.safeParse("numerical").success).toBe(true);
    expect(categorySlugSchema.safeParse("verbal").success).toBe(true);
    expect(categorySlugSchema.safeParse("logical").success).toBe(true);
    expect(categorySlugSchema.safeParse("situational_judgment").success).toBe(
      true
    );
    expect(categorySlugSchema.safeParse("work_style").success).toBe(true);
    expect(categorySlugSchema.safeParse("consulting_case").success).toBe(true);
    expect(parseCategorySlug("numerical")).toBe("numerical");
  });

  it("rejects unknown slugs", () => {
    expect(categorySlugSchema.safeParse("iq").success).toBe(false);
    expect(categorySlugSchema.safeParse("").success).toBe(false);
  });
});

describe("attemptStatusSchema", () => {
  it("accepts in_progress and completed", () => {
    expect(attemptStatusSchema.safeParse("in_progress").success).toBe(true);
    expect(attemptStatusSchema.safeParse("completed").success).toBe(true);
  });

  it("rejects other statuses", () => {
    expect(attemptStatusSchema.safeParse("pending").success).toBe(false);
  });
});

describe("choiceSchema", () => {
  it("accepts key/label pairs", () => {
    expect(
      choiceSchema.safeParse({ key: "a", label: "Option A" }).success
    ).toBe(true);
  });

  it("rejects missing fields", () => {
    expect(choiceSchema.safeParse({ key: "a" }).success).toBe(false);
    expect(choiceSchema.safeParse({ label: "Option A" }).success).toBe(false);
  });
});

describe("questionPayloadSchema", () => {
  const mcq = {
    id: "q1",
    prompt: "What is 2 + 2?",
    choices: [
      { key: "a", label: "3" },
      { key: "b", label: "4" },
    ],
    difficulty: "easy" as const,
    isReflection: false,
  };

  const reflection = {
    id: "q2",
    prompt: "Describe how you prefer to collaborate.",
    isReflection: true,
  };

  it("accepts MCQ and reflection payloads", () => {
    expect(questionPayloadSchema.safeParse(mcq).success).toBe(true);
    expect(questionPayloadSchema.safeParse(reflection).success).toBe(true);
    expect(parseQuestionPayload(mcq)).toEqual(mcq);
  });

  it("rejects invalid payloads", () => {
    expect(
      questionPayloadSchema.safeParse({
        ...mcq,
        difficulty: "extreme",
      }).success
    ).toBe(false);
    expect(
      questionPayloadSchema.safeParse({
        prompt: "missing id and isReflection",
      }).success
    ).toBe(false);
  });
});
