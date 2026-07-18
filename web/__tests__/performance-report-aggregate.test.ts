import { describe, expect, it } from "vitest";
import {
  aggregatePerformanceReportInput,
  buildDeterministicReportSummary,
  type GatheredSources,
} from "@/lib/report/aggregate";
import {
  sectionsContainBannedHireabilityPhrases,
} from "@/lib/validation/performance-report";

const emptySources: GatheredSources = {
  profile: null,
  resumeReview: null,
  jobMatch: null,
  interview: null,
  assessments: [],
  prepPlan: null,
};

const fullSources: GatheredSources = {
  profile: {
    targetRole: "Backend Engineer",
    targetIndustry: "Fintech",
    experienceLevel: "mid",
    jobSearchStatus: "actively_applying",
    skills: ["TypeScript", "Postgres", "Node.js"],
    certifications: ["AWS SAA"],
    preferredLocation: "Remote",
    educationBackground: "BS Computer Science",
  },
  resumeReview: {
    id: "review-1",
    overallScore: 74,
    result: {
      overallScore: 74,
      sectionScores: [{ section: "impact", score: 70 }],
      strengths: ["Clear ownership language"],
      weaknesses: ["Sparse metrics on last role"],
      atsRisks: ["Two-column header"],
      missingMetrics: ["Latency improvement %"],
      priorityActions: [
        {
          title: "Add latency metrics",
          detail: "Quantify p99 wins",
          priority: 1,
        },
      ],
      rewriteSuggestions: [],
      summary: "Solid mid-level CV with metric gaps.",
    },
  },
  jobMatch: {
    id: "match-1",
    matchScore: 68,
    result: {
      matchScore: 68,
      matched: [{ item: "TypeScript", evidence: "Skills list" }],
      missing: [
        {
          item: "Kubernetes",
          importance: "preferred",
          suggestion: "Add a lab project",
        },
      ],
      keywordGaps: ["k8s"],
      strengths: ["Backend stack alignment"],
      gaps: ["Ops tooling"],
      nextActions: [
        {
          title: "Study container orchestration basics",
          detail: "Map to preferred skill",
          priority: 1,
        },
      ],
      summary: "Good core match with ops gaps.",
    },
  },
  interview: {
    id: "session-1",
    title: "Behavioral practice",
    targetRole: "Backend Engineer",
    turnFeedbacks: [
      {
        overallScore: 70,
        strengths: ["Clear situation setup"],
        improvements: ["Quantify the result"],
      },
      {
        overallScore: 80,
        strengths: ["Role-aligned trade-offs"],
        improvements: ["Tighten the STAR action"],
      },
    ],
  },
  assessments: [
    {
      id: "attempt-1",
      categoryName: "Logical reasoning",
      score: 8,
      maxScore: 10,
    },
    {
      id: "attempt-2",
      categoryName: "Workplace judgment",
      score: 6,
      maxScore: 10,
    },
  ],
  prepPlan: {
    id: "plan-1",
    title: "My prep plan",
    summary: "Focus metrics and mock interviews this week.",
    items: [
      {
        title: "Add metrics to CV",
        status: "done",
        category: "cv",
        priority: 1,
      },
      {
        title: "Practice STAR answers",
        status: "todo",
        category: "interview",
        priority: 2,
      },
      {
        title: "Paste target JD",
        status: "todo",
        category: "application",
        priority: 3,
      },
    ],
  },
};

describe("aggregatePerformanceReportInput — empty / partial", () => {
  it("returns all section keys with available false when no sources", () => {
    const result = aggregatePerformanceReportInput(emptySources);
    expect(result.sections).toHaveLength(7);
    const keys = result.sections.map((s) => s.key);
    expect(keys).toEqual([
      "profile",
      "application_readiness",
      "job_fit",
      "interview",
      "assessments",
      "prep_plan",
      "next_actions",
    ]);

    for (const section of result.sections) {
      if (section.key === "next_actions") {
        expect(section.available).toBe(true);
        expect(section.bullets.length).toBeGreaterThan(0);
      } else {
        expect(section.available).toBe(false);
        expect(section.emptyHint).toBeTruthy();
        expect(section.href).toBeTruthy();
      }
    }
  });

  it("fills only present sections for partial profile + resume review", () => {
    const partial: GatheredSources = {
      ...emptySources,
      profile: fullSources.profile,
      resumeReview: fullSources.resumeReview,
    };
    const result = aggregatePerformanceReportInput(partial);
    const byKey = Object.fromEntries(
      result.sections.map((s) => [s.key, s])
    );

    expect(byKey.profile.available).toBe(true);
    expect(byKey.profile.summary).toContain("Backend Engineer");
    expect(byKey.application_readiness.available).toBe(true);
    expect(byKey.application_readiness.score).toBe(74);
    expect(byKey.job_fit.available).toBe(false);
    expect(byKey.interview.available).toBe(false);
    expect(byKey.assessments.available).toBe(false);
    expect(byKey.prep_plan.available).toBe(false);
    expect(byKey.next_actions.bullets.some((b) => /job|match|JD/i.test(b))).toBe(
      true
    );
  });

  it("marks interview unavailable when session has no scored feedback", () => {
    const partial: GatheredSources = {
      ...emptySources,
      interview: {
        id: "session-empty",
        title: "Empty",
        targetRole: "Engineer",
        turnFeedbacks: [],
      },
    };
    const result = aggregatePerformanceReportInput(partial);
    const interview = result.sections.find((s) => s.key === "interview");
    expect(interview?.available).toBe(false);
  });
});

describe("aggregatePerformanceReportInput — full fixture", () => {
  it("scores interview as average of turn feedbacks", () => {
    const result = aggregatePerformanceReportInput(fullSources);
    const interview = result.sections.find((s) => s.key === "interview");
    expect(interview?.available).toBe(true);
    expect(interview?.score).toBe(75); // (70+80)/2
  });

  it("scores assessments as average percent", () => {
    const result = aggregatePerformanceReportInput(fullSources);
    const assessments = result.sections.find((s) => s.key === "assessments");
    expect(assessments?.available).toBe(true);
    // (80 + 60) / 2 = 70
    expect(assessments?.score).toBe(70);
    expect(assessments?.bullets.some((b) => b.includes("Logical"))).toBe(true);
  });

  it("scores prep plan as done ratio", () => {
    const result = aggregatePerformanceReportInput(fullSources);
    const plan = result.sections.find((s) => s.key === "prep_plan");
    expect(plan?.available).toBe(true);
    // 1/3 done → 33
    expect(plan?.score).toBe(33);
    expect(plan?.bullets.some((b) => b.includes("STAR"))).toBe(true);
  });

  it("includes job fit match score and matched/missing bullets", () => {
    const result = aggregatePerformanceReportInput(fullSources);
    const jobFit = result.sections.find((s) => s.key === "job_fit");
    expect(jobFit?.score).toBe(68);
    expect(jobFit?.bullets.some((b) => b.includes("TypeScript"))).toBe(true);
    expect(jobFit?.bullets.some((b) => b.includes("Kubernetes"))).toBe(true);
  });

  it("next actions pull from plan todos and review priorities", () => {
    const result = aggregatePerformanceReportInput(fullSources);
    const next = result.sections.find((s) => s.key === "next_actions");
    expect(next?.available).toBe(true);
    expect(next?.bullets.some((b) => /metrics|STAR|Plan/i.test(b))).toBe(true);
  });

  it("does not emit banned hire language in aggregated copy", () => {
    const result = aggregatePerformanceReportInput(fullSources);
    expect(sectionsContainBannedHireabilityPhrases(result)).toBe(false);
  });
});

describe("buildDeterministicReportSummary", () => {
  it("mentions missing sources when partially filled", () => {
    const sections = aggregatePerformanceReportInput({
      ...emptySources,
      profile: fullSources.profile,
      resumeReview: fullSources.resumeReview,
    });
    const { title, summary } = buildDeterministicReportSummary(
      sections,
      fullSources.profile
    );
    expect(title).toContain("Backend Engineer");
    expect(summary.toLowerCase()).toContain("coaching");
    expect(summary).toMatch(/missing/i);
    expect(summary.toLowerCase()).not.toContain("hire probability");
  });

  it("uses getting-started title when nothing available", () => {
    const sections = aggregatePerformanceReportInput(emptySources);
    const { title, summary } = buildDeterministicReportSummary(sections, null);
    expect(title.toLowerCase()).toContain("getting started");
    expect(summary.toLowerCase()).toContain("no workflow");
  });
});
