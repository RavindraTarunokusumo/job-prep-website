import { describe, expect, it } from "vitest";
import {
  narrativeContainsBannedHireabilityPhrases,
  parsePerformanceReportNarrative,
  parsePerformanceReportSections,
  parsePerformanceReportStatus,
  performanceReportNarrativeSchema,
  performanceReportSectionsSchema,
  performanceReportStatusSchema,
  reportSectionKeySchema,
  sectionsContainBannedHireabilityPhrases,
} from "@/lib/validation/performance-report";

const validSections = {
  sections: [
    {
      key: "profile" as const,
      title: "Profile",
      available: true,
      score: null,
      summary: "Targeting Backend Engineer in fintech.",
      bullets: ["Mid level", "Actively applying"],
      evidence: ["Onboarding completed"],
    },
    {
      key: "application_readiness" as const,
      title: "Application readiness",
      available: true,
      score: 72,
      bullets: ["Strong metrics in recent role"],
      evidence: ["Resume review overall 72"],
    },
    {
      key: "next_actions" as const,
      title: "Next actions",
      available: true,
      bullets: ["Complete a mock interview"],
      evidence: [],
    },
  ],
};

describe("performanceReportStatusSchema", () => {
  it("accepts generating, ready, failed", () => {
    expect(performanceReportStatusSchema.safeParse("generating").success).toBe(
      true
    );
    expect(performanceReportStatusSchema.safeParse("ready").success).toBe(true);
    expect(performanceReportStatusSchema.safeParse("failed").success).toBe(
      true
    );
    expect(parsePerformanceReportStatus("ready")).toBe("ready");
  });

  it("rejects invalid status", () => {
    expect(performanceReportStatusSchema.safeParse("done").success).toBe(false);
  });
});

describe("reportSectionKeySchema", () => {
  it("accepts known section keys", () => {
    for (const key of [
      "profile",
      "application_readiness",
      "job_fit",
      "interview",
      "assessments",
      "prep_plan",
      "next_actions",
    ]) {
      expect(reportSectionKeySchema.safeParse(key).success).toBe(true);
    }
  });

  it("rejects unknown keys", () => {
    expect(reportSectionKeySchema.safeParse("hire_score").success).toBe(false);
  });
});

describe("performanceReportSectionsSchema", () => {
  it("accepts a valid multi-section fixture", () => {
    const result = performanceReportSectionsSchema.safeParse(validSections);
    expect(result.success).toBe(true);
    expect(parsePerformanceReportSections(validSections).sections).toHaveLength(
      3
    );
  });

  it("defaults bullets and evidence to empty arrays", () => {
    const minimal = {
      sections: [
        {
          key: "profile" as const,
          title: "Profile",
          available: false,
          emptyHint: "Complete onboarding first.",
          href: "/onboarding",
        },
      ],
    };
    const parsed = parsePerformanceReportSections(minimal);
    expect(parsed.sections[0].bullets).toEqual([]);
    expect(parsed.sections[0].evidence).toEqual([]);
  });

  it("rejects empty sections array", () => {
    expect(
      performanceReportSectionsSchema.safeParse({ sections: [] }).success
    ).toBe(false);
  });

  it("rejects score outside 0–100", () => {
    const invalid = {
      sections: [
        {
          key: "job_fit" as const,
          title: "Job fit",
          available: true,
          score: 150,
        },
      ],
    };
    expect(performanceReportSectionsSchema.safeParse(invalid).success).toBe(
      false
    );
  });

  it("rejects more than 12 bullets", () => {
    const invalid = {
      sections: [
        {
          key: "next_actions" as const,
          title: "Next actions",
          available: true,
          bullets: Array.from({ length: 13 }, (_, i) => `Action ${i}`),
        },
      ],
    };
    expect(performanceReportSectionsSchema.safeParse(invalid).success).toBe(
      false
    );
  });
});

describe("performanceReportNarrativeSchema", () => {
  it("accepts summary with optional title", () => {
    const ok = parsePerformanceReportNarrative({
      summary: "Focus on interview practice next.",
      title: "Readiness snapshot",
    });
    expect(ok.summary).toContain("interview");
    expect(ok.title).toBe("Readiness snapshot");
  });

  it("rejects empty summary", () => {
    expect(
      performanceReportNarrativeSchema.safeParse({ summary: "" }).success
    ).toBe(false);
  });
});

describe("hireability safety helpers", () => {
  it("flags banned hire language in sections", () => {
    const bad = parsePerformanceReportSections({
      sections: [
        {
          key: "interview" as const,
          title: "Interview",
          available: true,
          summary: "You have a high hire probability.",
          bullets: [],
          evidence: [],
        },
      ],
    });
    expect(sectionsContainBannedHireabilityPhrases(bad)).toBe(true);
  });

  it("accepts clean coaching copy", () => {
    const clean = parsePerformanceReportSections(validSections);
    expect(sectionsContainBannedHireabilityPhrases(clean)).toBe(false);
  });

  it("flags banned hire language in narrative", () => {
    expect(
      narrativeContainsBannedHireabilityPhrases({
        summary: "This is a no-hire signal based on your answers.",
      })
    ).toBe(true);
  });

  it("accepts clean narrative", () => {
    expect(
      narrativeContainsBannedHireabilityPhrases({
        summary: "Practice structured STAR answers this week.",
      })
    ).toBe(false);
  });
});
