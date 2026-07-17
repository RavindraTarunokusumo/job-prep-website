import { describe, expect, it } from "vitest";
import {
  ALL_ANALYTICS_EVENT_NAMES,
  ANALYTICS_EVENTS,
  FEEDBACK_COMMENT_MAX_CHARS,
  FEEDBACK_CONTEXTS,
  FORBIDDEN_PROP_KEYS,
  FUNNEL_EVENT_NAMES,
} from "@/lib/analytics/events";
import { sanitizeAnalyticsProps } from "@/lib/analytics/track";

describe("analytics taxonomy constants", () => {
  it("exposes the JOB-75 funnel event names", () => {
    expect(ANALYTICS_EVENTS.ONBOARDING_COMPLETE).toBe("onboarding_complete");
    expect(ANALYTICS_EVENTS.CV_UPLOAD).toBe("cv_upload");
    expect(ANALYTICS_EVENTS.JD_ANALYSIS).toBe("jd_analysis");
    expect(ANALYTICS_EVENTS.PREP_PLAN_GEN).toBe("prep_plan_gen");
    expect(ANALYTICS_EVENTS.MOCK_INTERVIEW_START).toBe("mock_interview_start");
    expect(ANALYTICS_EVENTS.MOCK_INTERVIEW_COMPLETE).toBe(
      "mock_interview_complete"
    );
    expect(ANALYTICS_EVENTS.REPORT_GEN).toBe("report_gen");
    expect(ANALYTICS_EVENTS.FEEDBACK_RATING).toBe("feedback_rating");
    expect(ANALYTICS_EVENTS.COVER_LETTER_GEN).toBe("cover_letter_gen");
  });

  it("lists funnel events in validation order without duplicates", () => {
    expect(FUNNEL_EVENT_NAMES).toEqual([
      "onboarding_complete",
      "cv_upload",
      "jd_analysis",
      "prep_plan_gen",
      "mock_interview_start",
      "mock_interview_complete",
      "report_gen",
    ]);
    expect(new Set(FUNNEL_EVENT_NAMES).size).toBe(FUNNEL_EVENT_NAMES.length);
  });

  it("includes every constant value in ALL_ANALYTICS_EVENT_NAMES", () => {
    for (const name of Object.values(ANALYTICS_EVENTS)) {
      expect(ALL_ANALYTICS_EVENT_NAMES).toContain(name);
    }
    expect(ALL_ANALYTICS_EVENT_NAMES.length).toBe(
      Object.keys(ANALYTICS_EVENTS).length
    );
  });

  it("defines feedback contexts used by the prompt", () => {
    expect(FEEDBACK_CONTEXTS).toEqual(["mock_interview", "prep_plan"]);
    expect(FEEDBACK_COMMENT_MAX_CHARS).toBe(500);
  });

  it("declares privacy-sensitive forbidden prop keys", () => {
    expect(FORBIDDEN_PROP_KEYS).toContain("rawText");
    expect(FORBIDDEN_PROP_KEYS).toContain("resumeText");
    expect(FORBIDDEN_PROP_KEYS).toContain("answer");
    expect(FORBIDDEN_PROP_KEYS).toContain("content");
  });
});

describe("sanitizeAnalyticsProps", () => {
  it("keeps scalar allowed props", () => {
    expect(
      sanitizeAnalyticsProps({
        documentId: "doc_1",
        matchScore: 82,
        firstTime: true,
        note: null,
      })
    ).toEqual({
      documentId: "doc_1",
      matchScore: 82,
      firstTime: true,
      note: null,
    });
  });

  it("strips forbidden keys and nested objects", () => {
    const result = sanitizeAnalyticsProps({
      documentId: "doc_1",
      rawText: "SECRET RESUME BODY",
      resumeText: "also secret",
      answer: "my interview answer",
      content: "cover letter body",
      nested: { a: 1 },
      list: [1, 2],
    });
    expect(result).toEqual({ documentId: "doc_1" });
    expect(JSON.stringify(result)).not.toContain("SECRET");
    expect(JSON.stringify(result)).not.toContain("interview answer");
  });

  it("returns undefined for empty or null props", () => {
    expect(sanitizeAnalyticsProps(null)).toBeUndefined();
    expect(sanitizeAnalyticsProps(undefined)).toBeUndefined();
    expect(sanitizeAnalyticsProps({})).toBeUndefined();
    expect(
      sanitizeAnalyticsProps({ rawText: "only forbidden" })
    ).toBeUndefined();
  });
});
