import { describe, expect, it } from "vitest";
import {
  aggregateOutcomeInsights,
  splitFeedbackFields,
} from "@/lib/outcomes/insights";

describe("aggregateOutcomeInsights", () => {
  it("withholds rates when sample size is low", () => {
    const insights = aggregateOutcomeInsights([
      { stage: "applied" },
      { stage: "interview" },
    ]);
    const interview = insights.find((i) => i.label === "interview_rate");
    expect(interview?.rate).toBeNull();
    expect(interview?.caveat).toMatch(/sample size/i);
  });

  it("computes descriptive rates with enough samples", () => {
    const rows = [
      { stage: "interview" },
      { stage: "offer" },
      { stage: "rejected" },
      { stage: "no_response" },
    ];
    const insights = aggregateOutcomeInsights(rows);
    const offer = insights.find((i) => i.label === "offer_rate");
    expect(offer?.rate).toBe(0.25);
    expect(offer?.caveat).toMatch(/not causal/i);
  });
});

describe("splitFeedbackFields", () => {
  it("keeps employer feedback separate from user interpretation", () => {
    const split = splitFeedbackFields({
      employerFeedback: "Needs more Java experience",
      userInterpretation: "I think culture was the issue",
    });
    expect(split.employerFeedback).toMatch(/Java/);
    expect(split.userInterpretation).toMatch(/culture/);
    expect(split.meta.sources.ai).toBe(false);
  });
});
