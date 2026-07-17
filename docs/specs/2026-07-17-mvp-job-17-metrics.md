# Spec: JOB-17 — MVP success metrics and validation dashboard

| Field | Value |
|-------|--------|
| **Status** | Accepted (Autopilot grant — Wave 2) |
| **Date** | 2026-07-17 |
| **Branch** | `feat/job-17-metrics` |
| **Worktree** | `.worktree/wave2-job-17-metrics` |
| **Linear parent** | [JOB-17](https://linear.app/job-prep-website/issue/JOB-17) |
| **Children** | JOB-75…78 |
| **Depends on** | Auth, onboarding, resume, job match, prep plan, interview, cover letter |
| **Subagent model** | `grok-4.5` (high effort) |

## 1. Goal

Instrument the MVP funnel with first-party analytics so the team can validate product success without a third-party SaaS:

1. Document a clear **event taxonomy** for key workflow milestones
2. Persist **lightweight AnalyticsEvent rows** from server actions (no resume/JD body text)
3. Surface **per-user validation metrics** in-app (dashboard card)
4. Collect **post-workflow 1–5 feedback** after mock interview complete and prep plan generate

## 2. Scope

### JOB-75 — Event taxonomy doc

`docs/analytics-taxonomy.md` defining canonical event names, props (allowed keys only), when they fire, and privacy rules.

### JOB-76 — Analytics module + hooks

- Prisma `AnalyticsEvent` model
- `web/lib/analytics/track.ts` — server-safe logger
- Wire one-liners into success paths of existing actions (minimal diff)

### JOB-77 — Metrics card

Small **Validation metrics** card on dashboard (or settings) listing current-user counts per funnel event. Document team/global dashboard as follow-up (not admin multi-tenant UI this PR).

### JOB-78 — Feedback prompt

Client component: 1–5 rating + optional short comment; stored as `feedback_rating` AnalyticsEvent. Show after mock interview complete and after prep plan generate.

### Out of scope

- Third-party analytics (PostHog, Mixpanel, GA)
- Logging raw CV/resume text, full JD body, interview answers, or cover-letter content
- Multi-tenant admin operator console / cross-user PII
- Full JOB-15 compiled performance report (only document `report_gen` for later)

## 3. Data model

```prisma
model AnalyticsEvent {
  id        String   @id @default(cuid())
  userId    String?  @db.Uuid
  user      User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  name      String
  props     Json?
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([name])
  @@index([createdAt])
  @@index([userId, name])
}
```

## 4. Interfaces

```ts
// web/lib/analytics/events.ts
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
export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

// web/lib/analytics/track.ts
export async function trackEvent(input: {
  userId?: string | null;
  name: AnalyticsEventName | string;
  props?: Record<string, unknown> | null;
}): Promise<void>; // never throws; never stores forbidden keys

// web/app/actions/analytics.ts
export async function submitFeedbackAction(input: {
  context: "mock_interview" | "prep_plan";
  rating: number; // 1–5
  comment?: string;
  relatedId?: string;
}): Promise<{ ok: true } | { ok: false; error: string }>;

export async function getMyEventCountsAction(): Promise<Record<string, number>>;
```

## 5. Workflows

1. User completes a key action → server action success path calls `void trackEvent(...)` (fire-and-forget style; await inside try/catch so failures never break UX).
2. Dashboard loads → counts `AnalyticsEvent` for `userId` grouped by `name` for taxonomy funnel list.
3. After interview complete / plan generate → UI shows `WorkflowFeedbackPrompt` → `submitFeedbackAction` → `feedback_rating` row.

## 6. Privacy constraints

- **Never** put resume body, raw JD text, interview answers, or cover letter body in `props`.
- Allowed props examples: entity ids, mimeType, byteSize, scores (0–100), model id (optional), rating, short comment (≤500 chars), context string.
- `userId` optional for future anonymous events; MVP always passes signed-in user when available.

## 7. Success criteria

- [ ] Taxonomy doc exists and matches constants
- [ ] Migration + Prisma model
- [ ] Hooks on onboarding, CV upload, JD analysis, prep plan, interview start/complete, cover letter
- [ ] Dashboard validation metrics card
- [ ] Feedback prompt on interview complete + plan generate
- [ ] Unit tests for event name constants / sanitization
- [ ] `docs/database.md` + `TODO.md` updated
- [ ] Full suite: lint, typecheck, test, build

## 8. Risks

- Action files shared with other branches — keep track calls as tiny one-liners
- Analytics must not throw into user-facing errors
- Prisma client version bump after new model
