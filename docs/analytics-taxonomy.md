# Analytics event taxonomy (MVP)

**Parent:** JOB-17 · **Children:** JOB-75–78  
**Implementation:** `web/lib/analytics/events.ts`, `web/lib/analytics/track.ts`  
**Storage:** Prisma `AnalyticsEvent` (first-party only — no SaaS required)

## Privacy rules

1. **Never** store resume/CV body text, raw job-description body, mock-interview answers, or cover-letter content in `props`.
2. **Allowed** props: entity ids, mime type, byte size, scores (0–100), optional model id, feedback rating (1–5), short comment (≤500 chars), context labels, boolean flags.
3. Prefer `userId` on every signed-in event; leave null only for future anonymous instrumentation.
4. Comments are free text — treat as potentially sensitive; do not export wholesale without review.

## Funnel events (validation)

| Event name | When it fires | Typical props |
|------------|---------------|---------------|
| `onboarding_complete` | First successful profile save that sets `onboardingCompletedAt` | `{}` or `{ firstTime: true }` |
| `cv_upload` | Successful resume upload (after document row created) | `{ documentId, mimeType, byteSize }` |
| `jd_analysis` | Job match analysis completes successfully | `{ matchId, jobId, matchScore? }` |
| `prep_plan_gen` | Prep plan generated / refreshed successfully | `{ planId, itemCount? }` |
| `mock_interview_start` | Mock interview session created | `{ sessionId }` |
| `mock_interview_complete` | Session marked completed | `{ sessionId }` |
| `report_gen` | Compiled performance report generated (JOB-15; wire later) | `{ reportId? }` |
| `feedback_rating` | User submits post-workflow rating | `{ context, rating, comment?, relatedId? }` |
| `cover_letter_gen` | Cover letter draft generated successfully | `{ draftId }` |

Constants live in `web/lib/analytics/events.ts` (`ANALYTICS_EVENTS`). Keep this table and the constants in sync.

## Feedback contexts

| `context` value | Surface |
|-----------------|---------|
| `mock_interview` | After mock interview session status is `completed` |
| `prep_plan` | After successful prep plan generate/refresh |

## Per-user validation card

The dashboard **Validation metrics** card shows counts of the above events for the signed-in user (grouped by `name`). This is the MVP “validation dashboard.”

## Team / global dashboard (later)

Not built in this PR. Operators can query Postgres:

```sql
SELECT name, COUNT(*) AS n
FROM "AnalyticsEvent"
WHERE "createdAt" >= NOW() - INTERVAL '30 days'
GROUP BY name
ORDER BY n DESC;
```

Optional future work: internal `/admin/metrics` gated by allowlist email, daily rollups, conversion rates between funnel steps.

## Forbidden keys

`trackEvent` strips these (and nested) keys if present:  
`rawText`, `resumeText`, `text`, `content`, `answer`, `body`, `email`, `password`, `fileBytes`, `buffer`, `parsedData`.
