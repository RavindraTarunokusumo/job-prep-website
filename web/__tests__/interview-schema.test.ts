import { describe, expect, it } from "vitest";
import {
  containsBannedHireabilityPhrases,
  feedbackContainsBannedHireabilityPhrases,
  followUpDecisionSchema,
  interviewCategorySchema,
  interviewFeedbackSchema,
  interviewSessionStatusSchema,
  interviewTurnKindSchema,
  parseFollowUpDecision,
  parseInterviewFeedback,
  parseQuestionSet,
  questionSetSchema,
  safeParseInterviewFeedback,
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

const validFeedback = {
  overallScore: 72,
  dimensions: {
    relevance: 4,
    specificity: 3,
    starStructure: 4,
    clarity: 5,
    roleAlignment: 4,
  },
  strengths: ["Clear ownership of the problem", "Named a concrete result"],
  improvements: ["Add a metric for latency improvement"],
  missingDetails: ["Team size and your specific role"],
  rewriteSuggestion:
    "In my last role I owned a checkout API that p95 latency at 900ms. I profiled hot paths, added caching for catalog reads, and cut p95 to 220ms within two sprints.",
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

  it("rejects ask without a follow-up question", () => {
    expect(
      followUpDecisionSchema.safeParse({
        askFollowUp: true,
      }).success
    ).toBe(false);
    expect(
      followUpDecisionSchema.safeParse({
        askFollowUp: true,
        followUpQuestion: "   ",
      }).success
    ).toBe(false);
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

describe("interviewFeedbackSchema", () => {
  it("accepts a valid coaching fixture", () => {
    const result = interviewFeedbackSchema.safeParse(validFeedback);
    expect(result.success).toBe(true);
    expect(parseInterviewFeedback(validFeedback)).toEqual(validFeedback);
    expect(safeParseInterviewFeedback(validFeedback)).toEqual(validFeedback);
  });

  it("rejects empty rewriteSuggestion", () => {
    expect(
      interviewFeedbackSchema.safeParse({
        ...validFeedback,
        rewriteSuggestion: "",
      }).success
    ).toBe(false);
    expect(() =>
      parseInterviewFeedback({ ...validFeedback, rewriteSuggestion: "" })
    ).toThrow();
  });

  it("rejects out-of-range overallScore and dimension scores", () => {
    expect(
      interviewFeedbackSchema.safeParse({
        ...validFeedback,
        overallScore: 101,
      }).success
    ).toBe(false);
    expect(
      interviewFeedbackSchema.safeParse({
        ...validFeedback,
        overallScore: -1,
      }).success
    ).toBe(false);
    expect(
      interviewFeedbackSchema.safeParse({
        ...validFeedback,
        dimensions: { ...validFeedback.dimensions, clarity: 0 },
      }).success
    ).toBe(false);
    expect(
      interviewFeedbackSchema.safeParse({
        ...validFeedback,
        dimensions: { ...validFeedback.dimensions, relevance: 6 },
      }).success
    ).toBe(false);
  });

  it("rejects more than 6 bullets in list fields", () => {
    const tooMany = Array.from({ length: 7 }, (_, i) => `Item ${i + 1}`);
    expect(
      interviewFeedbackSchema.safeParse({
        ...validFeedback,
        strengths: tooMany,
      }).success
    ).toBe(false);
  });

  it("accepts empty optional bullet lists", () => {
    expect(
      interviewFeedbackSchema.safeParse({
        ...validFeedback,
        strengths: [],
        improvements: [],
        missingDetails: [],
      }).success
    ).toBe(true);
  });

  it("safeParse returns null for invalid payloads", () => {
    expect(safeParseInterviewFeedback(null)).toBeNull();
    expect(safeParseInterviewFeedback({ overallScore: 50 })).toBeNull();
  });
});

describe("hireability safety helpers", () => {
  it("detects banned hireability phrases in free text", () => {
    expect(containsBannedHireabilityPhrases("You are unhireable for this role.")).toBe(
      true
    );
    expect(
      containsBannedHireabilityPhrases("This will not get the job as written.")
    ).toBe(true);
    expect(
      containsBannedHireabilityPhrases(
        "Add a metric and clarify your ownership of the migration."
      )
    ).toBe(false);
  });

  it("allows normal coaching fixtures without banned labels", () => {
    expect(feedbackContainsBannedHireabilityPhrases(validFeedback)).toBe(false);
  });

  it("flags feedback objects that embed banned phrases", () => {
    const bad = {
      ...validFeedback,
      improvements: ["This answer makes you unhireable."],
    };
    expect(feedbackContainsBannedHireabilityPhrases(bad)).toBe(true);
  });
});

describe("turn ordering fixtures (session shape)", () => {
  it("orders primary then follow-up by orderIndex", () => {
    const turns = [
      {
        id: "p1",
        kind: "primary" as const,
        orderIndex: 0,
        parentTurnId: null as string | null,
      },
      {
        id: "f1",
        kind: "follow_up" as const,
        orderIndex: 1,
        parentTurnId: "p1",
      },
      {
        id: "p2",
        kind: "primary" as const,
        orderIndex: 2,
        parentTurnId: null,
      },
    ];

    const sorted = [...turns].sort((a, b) => a.orderIndex - b.orderIndex);
    expect(sorted.map((t) => t.id)).toEqual(["p1", "f1", "p2"]);

    const followUpsForP1 = sorted.filter(
      (t) => t.kind === "follow_up" && t.parentTurnId === "p1"
    );
    expect(followUpsForP1).toHaveLength(1);
  });
});
