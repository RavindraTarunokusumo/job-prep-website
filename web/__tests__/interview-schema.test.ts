import { describe, expect, it } from "vitest";
import {
  followUpDecisionSchema,
  interviewCategorySchema,
  interviewSessionStatusSchema,
  interviewTurnKindSchema,
  parseFollowUpDecision,
  parseQuestionSet,
  questionSetSchema,
} from "@/lib/validation/interview";

const validQuestionSet = {
  title: "Backend Engineer mock interview",
  questions: [
    {
      category: "behavioral" as const,
      question: "Tell me about a time you improved a slow API endpoint.",
    },
    {
      category: "motivation" as const,
      question: "Why are you interested in this backend engineering role?",
    },
    {
      category: "competency" as const,
      question: "How do you design idempotent write endpoints?",
    },
    {
      category: "role_specific" as const,
      question: "Walk through how you would model a multi-tenant schema.",
    },
  ],
};

describe("interviewSessionStatusSchema / interviewTurnKindSchema / interviewCategorySchema", () => {
  it("accepts known enum values", () => {
    expect(interviewSessionStatusSchema.safeParse("active").success).toBe(true);
    expect(interviewSessionStatusSchema.safeParse("completed").success).toBe(
      true
    );
    expect(interviewSessionStatusSchema.safeParse("abandoned").success).toBe(
      true
    );
    expect(interviewTurnKindSchema.safeParse("primary").success).toBe(true);
    expect(interviewTurnKindSchema.safeParse("follow_up").success).toBe(true);
    expect(interviewCategorySchema.safeParse("behavioral").success).toBe(true);
    expect(interviewCategorySchema.safeParse("motivation").success).toBe(true);
    expect(interviewCategorySchema.safeParse("competency").success).toBe(true);
    expect(interviewCategorySchema.safeParse("role_specific").success).toBe(
      true
    );
    expect(interviewCategorySchema.safeParse("follow_up").success).toBe(true);
  });

  it("rejects bad enums", () => {
    expect(interviewSessionStatusSchema.safeParse("paused").success).toBe(
      false
    );
    expect(interviewTurnKindSchema.safeParse("secondary").success).toBe(false);
    expect(interviewCategorySchema.safeParse("technical").success).toBe(false);
  });
});

describe("questionSetSchema", () => {
  it("accepts a valid fixture", () => {
    const result = questionSetSchema.safeParse(validQuestionSet);
    expect(result.success).toBe(true);
    expect(parseQuestionSet(validQuestionSet)).toEqual(validQuestionSet);
  });

  it("rejects empty title or question text", () => {
    expect(
      questionSetSchema.safeParse({
        ...validQuestionSet,
        title: "",
      }).success
    ).toBe(false);
    expect(
      questionSetSchema.safeParse({
        title: validQuestionSet.title,
        questions: [
          { category: "behavioral", question: "" },
          { category: "motivation", question: "Why this role?" },
          { category: "competency", question: "Describe a hard bug." },
        ],
      }).success
    ).toBe(false);
    expect(() =>
      parseQuestionSet({ ...validQuestionSet, title: "" })
    ).toThrow();
  });

  it("rejects fewer than 3 or more than 8 questions", () => {
    expect(
      questionSetSchema.safeParse({
        title: validQuestionSet.title,
        questions: validQuestionSet.questions.slice(0, 2),
      }).success
    ).toBe(false);

    const tooMany = {
      title: validQuestionSet.title,
      questions: Array.from({ length: 9 }, (_, i) => ({
        category: "behavioral" as const,
        question: `Question ${i + 1}?`,
      })),
    };
    expect(questionSetSchema.safeParse(tooMany).success).toBe(false);
  });

  it("rejects invalid category values", () => {
    expect(
      questionSetSchema.safeParse({
        title: validQuestionSet.title,
        questions: [
          { category: "technical", question: "Explain CAP theorem." },
          { category: "motivation", question: "Why this company?" },
          { category: "competency", question: "Describe a hard bug." },
        ],
      }).success
    ).toBe(false);
  });
});

describe("followUpDecisionSchema", () => {
  it("accepts ask and skip decisions", () => {
    const ask = {
      askFollowUp: true,
      followUpQuestion: "Can you share a concrete metric for that outcome?",
      reason: "Answer lacked quantified impact.",
    };
    const skip = { askFollowUp: false };

    expect(followUpDecisionSchema.safeParse(ask).success).toBe(true);
    expect(parseFollowUpDecision(ask)).toEqual(ask);
    expect(followUpDecisionSchema.safeParse(skip).success).toBe(true);
    expect(parseFollowUpDecision(skip)).toEqual(skip);
  });

  it("rejects non-boolean askFollowUp", () => {
    expect(
      followUpDecisionSchema.safeParse({
        askFollowUp: "yes",
      }).success
    ).toBe(false);
    expect(() =>
      parseFollowUpDecision({ askFollowUp: "yes" })
    ).toThrow();
  });
});
