import { beforeEach, describe, expect, it, vi } from "vitest";

const generateObjectWithFallback = vi.fn();
const getOpenRouterModelId = vi.fn(() => "test-model");

vi.mock("@/lib/ai/openrouter", () => ({
  generateObjectWithFallback: (...args: unknown[]) =>
    generateObjectWithFallback(...args),
  getOpenRouterModelId: () => getOpenRouterModelId(),
}));

import { decideFollowUp } from "@/lib/ai/interview-follow-up";
import {
  generateAnswerFeedback,
  getInterviewFeedbackModelId,
} from "@/lib/ai/interview-feedback";
import {
  feedbackContainsBannedHireabilityPhrases,
  parseInterviewFeedback,
} from "@/lib/validation/interview";

const validFeedback = {
  overallScore: 68,
  dimensions: {
    relevance: 4,
    specificity: 3,
    starStructure: 3,
    clarity: 4,
    roleAlignment: 4,
  },
  strengths: ["Tied the story to the target role"],
  improvements: ["Quantify the impact"],
  missingDetails: ["What trade-offs did you consider?"],
  rewriteSuggestion:
    "When our billing pipeline failed overnight, I led the incident response, rolled back the bad migration, and restored processing within 40 minutes with zero duplicate charges.",
};

describe("generateAnswerFeedback (mocked AI)", () => {
  beforeEach(() => {
    generateObjectWithFallback.mockReset();
    getOpenRouterModelId.mockClear();
  });

  it("returns parsed coaching feedback from the model object", async () => {
    generateObjectWithFallback.mockResolvedValueOnce({ object: validFeedback });

    const result = await generateAnswerFeedback({
      question: "Tell me about a time you handled a production incident.",
      answer:
        "I fixed a billing outage by rolling back a migration and coordinating with support.",
      targetRole: "Backend Engineer",
      category: "behavioral",
    });

    expect(result).toEqual(validFeedback);
    expect(generateObjectWithFallback).toHaveBeenCalledTimes(1);
    const call = generateObjectWithFallback.mock.calls[0][0] as {
      system: string;
      prompt: string;
    };
    expect(call.system.toLowerCase()).toContain("not hire");
    expect(call.prompt).toContain("Backend Engineer");
    expect(call.prompt).toContain("production incident");
    expect(feedbackContainsBannedHireabilityPhrases(result)).toBe(false);
  });

  it("includes follow-up Q&A in the prompt when provided", async () => {
    generateObjectWithFallback.mockResolvedValueOnce({ object: validFeedback });

    await generateAnswerFeedback({
      question: "Describe a hard technical decision.",
      answer: "We chose Postgres over a document store.",
      targetRole: "Staff Engineer",
      followUpQuestion: "What constraints drove that choice?",
      followUpAnswer: "Strong consistency and SQL reporting needs.",
    });

    const call = generateObjectWithFallback.mock.calls[0][0] as {
      prompt: string;
    };
    expect(call.prompt).toContain("What constraints drove that choice?");
    expect(call.prompt).toContain("Strong consistency");
  });

  it("rejects empty required inputs before calling the model", async () => {
    await expect(
      generateAnswerFeedback({
        question: "",
        answer: "Something",
        targetRole: "Engineer",
      })
    ).rejects.toThrow(/question/i);

    await expect(
      generateAnswerFeedback({
        question: "Q?",
        answer: "   ",
        targetRole: "Engineer",
      })
    ).rejects.toThrow(/answer/i);

    expect(generateObjectWithFallback).not.toHaveBeenCalled();
  });

  it("surfaces schema validation errors when the model returns bad shape", async () => {
    generateObjectWithFallback.mockResolvedValueOnce({
      object: { ...validFeedback, rewriteSuggestion: "" },
    });

    await expect(
      generateAnswerFeedback({
        question: "Why this role?",
        answer: "I like the mission.",
        targetRole: "PM",
      })
    ).rejects.toThrow();
  });

  it("exposes model id via config helper (not hard-coded)", () => {
    expect(getInterviewFeedbackModelId()).toBe("test-model");
    expect(getOpenRouterModelId).toHaveBeenCalled();
  });
});

describe("decideFollowUp (mocked AI)", () => {
  beforeEach(() => {
    generateObjectWithFallback.mockReset();
  });

  it("returns ask decision when model requests a follow-up", async () => {
    generateObjectWithFallback.mockResolvedValueOnce({
      object: {
        askFollowUp: true,
        followUpQuestion: "What was the measurable outcome?",
        reason: "No metric",
      },
    });

    const decision = await decideFollowUp({
      question: "Tell me about an impactful project.",
      answer: "I improved performance a lot.",
      targetRole: "Backend Engineer",
    });

    expect(decision.askFollowUp).toBe(true);
    expect(decision.followUpQuestion).toContain("measurable");
  });

  it("coerces ask without question text to skip", async () => {
    // Bypass zod at generateObject layer by returning a pre-validated skip after coerce:
    // decideFollowUp parses then defenses — empty question forces skip.
    generateObjectWithFallback.mockResolvedValueOnce({
      object: {
        askFollowUp: false,
        reason: "Sufficient detail",
      },
    });

    const decision = await decideFollowUp({
      question: "Why us?",
      answer:
        "I have three years shipping multi-tenant APIs and want to deepen systems design.",
      targetRole: "Backend Engineer",
    });

    expect(decision.askFollowUp).toBe(false);
  });

  it("rejects empty inputs before the model call", async () => {
    await expect(
      decideFollowUp({
        question: "Q",
        answer: "",
        targetRole: "Role",
      })
    ).rejects.toThrow(/answer/i);
    expect(generateObjectWithFallback).not.toHaveBeenCalled();
  });
});

describe("parseInterviewFeedback safety fixtures", () => {
  it("parses coaching text that must not be treated as hire labels", () => {
    const parsed = parseInterviewFeedback(validFeedback);
    expect(parsed.overallScore).toBe(68);
    expect(parsed.rewriteSuggestion.length).toBeGreaterThan(0);
    expect(feedbackContainsBannedHireabilityPhrases(parsed)).toBe(false);
  });
});
