/**
 * JOB-92 — End-to-end application journey (unit/integration fixtures).
 * Drives real shipped functions: ontology → mapping → readiness → gap interview → outcomes.
 */
import { describe, expect, it } from "vitest";
import { buildCandidateOntologySnapshot } from "@/lib/ontology";
import { mapRequirementsToEvidence, selectGapDrivenTargets } from "@/lib/matching";
import { computeApplicationReadiness } from "@/lib/readiness/score";
import {
  buildRehearsalPlan,
  generateGapDrivenQuestions,
} from "@/lib/interview/gap-driven";
import { aggregateOutcomeInsights, splitFeedbackFields } from "@/lib/outcomes/insights";
import { checkEntitlement } from "@/lib/billing/entitlements";
import type { JobRequirements } from "@/lib/validation/job-match";

const graduateRequirements: JobRequirements = {
  requiredSkills: ["Python", "Communication"],
  preferredSkills: ["React"],
  responsibilities: ["Collaborate with product"],
  keywords: ["graduate"],
  tools: [],
  certifications: [],
  interviewTopics: ["behavioral"],
  inferredNotes: [],
};

const experiencedRequirements: JobRequirements = {
  requiredSkills: ["TypeScript", "System design", "Leadership"],
  preferredSkills: ["Kubernetes"],
  responsibilities: ["Lead platform reliability"],
  keywords: ["senior"],
  tools: ["Docker"],
  certifications: [],
  interviewTopics: ["system design"],
  inferredNotes: [],
};

describe("application journey fixtures", () => {
  it("graduate sparse profile: gaps dominate, readiness sparse, questions sourced", () => {
    const snapshot = buildCandidateOntologySnapshot({
      skills: [
        {
          id: "s1",
          userId: "grad",
          name: "Python",
          normalizedName: "python",
          verification: "confirmed",
          confidence: 1,
          version: 1,
        },
      ],
    });
    const matches = mapRequirementsToEvidence(
      "jd-grad",
      "grad",
      graduateRequirements,
      snapshot,
    );
    expect(matches.some((m) => m.matchType === "strong")).toBe(true);
    expect(matches.some((m) => m.matchType === "gap")).toBe(true);

    const readiness = computeApplicationReadiness({
      userId: "grad",
      jobDescriptionId: "jd-grad",
      matches,
    });
    expect(readiness.userId).toBe("grad");
    expect(readiness.dimensions.dimensions.length).toBe(6);

    const questions = generateGapDrivenQuestions(selectGapDrivenTargets(matches));
    for (const q of questions) {
      expect(q.sourceRequirementKey.length).toBeGreaterThan(0);
    }
    const plan = buildRehearsalPlan(questions);
    expect(plan.evidenceActions.length).toBeGreaterThan(0);

    // Cross-user: mapping always stamps userId
    expect(matches.every((m) => m.userId === "grad")).toBe(true);
  });

  it("experienced profile: stronger coverage and outcome loop", () => {
    const snapshot = buildCandidateOntologySnapshot({
      skills: [
        {
          id: "s1",
          userId: "exp",
          name: "TypeScript",
          normalizedName: "typescript",
          verification: "confirmed",
          confidence: 1,
          version: 1,
        },
        {
          id: "s2",
          userId: "exp",
          name: "Leadership",
          normalizedName: "leadership",
          verification: "confirmed",
          confidence: 1,
          version: 1,
        },
      ],
      evidence: [
        {
          id: "e1",
          userId: "exp",
          title: "Staff engineer",
          sourceType: "employment",
          responsibilities: "Lead platform reliability and system design reviews",
          verification: "confirmed",
          confidence: 1,
          version: 1,
        },
      ],
      stories: [
        {
          id: "st1",
          userId: "exp",
          title: "Cut latency 40%",
          situation: "Latency crisis",
          task: "Lead fix",
          action: "Coordinated redesign",
          result: "40% improvement",
          readiness: "ready",
          verification: "confirmed",
          confidence: 1,
          version: 1,
        },
      ],
    });

    const matches = mapRequirementsToEvidence(
      "jd-exp",
      "exp",
      experiencedRequirements,
      snapshot,
    );
    const readiness = computeApplicationReadiness({
      userId: "exp",
      matches,
      cvScore: 80,
      interviewScore: 75,
      prepCompletion: 0.8,
      executionScore: 70,
    });
    expect(readiness.overallScore).not.toBeNull();
    expect(readiness.overallScore! > 40).toBe(true);

    const feedback = splitFeedbackFields({
      employerFeedback: "Strong systems knowledge",
      userInterpretation: "Maybe levelled too senior",
    });
    expect(feedback.meta.sources.employer).toBe(true);

    const insights = aggregateOutcomeInsights([
      { stage: "interview" },
      { stage: "interview" },
      { stage: "offer" },
      { stage: "rejected" },
    ]);
    expect(insights.find((i) => i.label === "offer_rate")?.rate).toBe(0.25);

    // Entitlement gate for mock interview (server-side decision function)
    expect(checkEntitlement("mock_interview", null).allowed).toBe(false);
    expect(
      checkEntitlement("mock_interview", {
        planCode: "pro",
        status: "active",
        currentPeriodEnd: null,
      }).allowed,
    ).toBe(true);
  });

  it("career-switch sparse: inferred skills never trusted as strong", () => {
    const snapshot = buildCandidateOntologySnapshot({
      skills: [
        {
          id: "s1",
          userId: "switch",
          name: "React",
          normalizedName: "react",
          verification: "inferred",
          confidence: 0.8,
          version: 1,
        },
      ],
    });
    const matches = mapRequirementsToEvidence(
      "jd-sw",
      "switch",
      graduateRequirements,
      snapshot,
    );
    const react = matches.find((m) => m.requirementKey.includes("react"));
    if (react) {
      expect(react.matchType).not.toBe("strong");
      expect(react.userReview).toBe("suggested");
    }
  });
});
