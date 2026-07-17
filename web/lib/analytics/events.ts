/**
 * Canonical MVP analytics event names (JOB-75 / JOB-17).
 * Keep in sync with docs/analytics-taxonomy.md.
 */
export const ANALYTICS_EVENTS = {
  ONBOARDING_COMPLETE: "onboarding_complete",
  CV_UPLOAD: "cv_upload",
  JD_ANALYSIS: "jd_analysis",
  PREP_PLAN_GEN: "prep_plan_gen",
  MOCK_INTERVIEW_START: "mock_interview_start",
  MOCK_INTERVIEW_COMPLETE: "mock_interview_complete",
  REPORT_GEN: "report_gen",
  FEEDBACK_RATING: "feedback_rating",
  COVER_LETTER_GEN: "cover_letter_gen",
} as const;

export type AnalyticsEventName =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

/** Ordered funnel for validation UI (excludes feedback / optional cover letter). */
export const FUNNEL_EVENT_NAMES: readonly AnalyticsEventName[] = [
  ANALYTICS_EVENTS.ONBOARDING_COMPLETE,
  ANALYTICS_EVENTS.CV_UPLOAD,
  ANALYTICS_EVENTS.JD_ANALYSIS,
  ANALYTICS_EVENTS.PREP_PLAN_GEN,
  ANALYTICS_EVENTS.MOCK_INTERVIEW_START,
  ANALYTICS_EVENTS.MOCK_INTERVIEW_COMPLETE,
  ANALYTICS_EVENTS.REPORT_GEN,
] as const;

export const FEEDBACK_CONTEXTS = ["mock_interview", "prep_plan"] as const;
export type FeedbackContext = (typeof FEEDBACK_CONTEXTS)[number];

export const ALL_ANALYTICS_EVENT_NAMES = Object.values(
  ANALYTICS_EVENTS
) as AnalyticsEventName[];

/** Keys never allowed in AnalyticsEvent.props (privacy). */
export const FORBIDDEN_PROP_KEYS = [
  "rawText",
  "resumeText",
  "text",
  "content",
  "answer",
  "body",
  "email",
  "password",
  "fileBytes",
  "buffer",
  "parsedData",
] as const;

export const FEEDBACK_COMMENT_MAX_CHARS = 500;
