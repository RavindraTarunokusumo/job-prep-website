# Database and file persistence

## PostgreSQL (Prisma)

Schema: `web/prisma/schema.prisma`  
Migrations: `web/prisma/migrations/`

### Models (MVP to date)

| Model | Purpose |
|-------|---------|
| `User` | Mirrors Supabase `auth.users` id + email |
| `Profile` | Career onboarding fields |
| `ResumeDocument` | CV upload metadata, status, raw text, parsed JSON, storage key |
| `ResumeReview` | AI resume review runs; `result` JSON validated by `resumeReviewResultSchema` in `web/lib/validation/resume-review.ts`; `overallScore` denormalized 0–100 for lists |
| `JobDescription` | Pasted job postings; `extracted` JSON validated by `jobRequirementsSchema` in `web/lib/validation/job-match.ts` |
| `JobMatchAnalysis` | Resume-to-JD match runs; `result` JSON validated by `jobMatchResultSchema`; `matchScore` denormalized 0–100 (fit score, not hire probability) |
| `PreparationPlan` | Personalized prep plan with source snapshot IDs for staleness detection |
| `PreparationPlanItem` | Checklist items (`category`, `status`, `priority`, optional `href` deep link) |
| `ApplicationDraft` | Cover letters and short application messages; `type`/`status`/`tone`/`length` as strings; optional `sections`/`meta` JSON; version lineage via `supersedesId` + `version`; zod in `web/lib/validation/application-draft.ts` |
| `InterviewSession` | Text mock interview run; `status` as string (`active` \| `completed` \| `abandoned`); role/experience snapshot; optional resume/JD/plan-item ids; question-generation `model`; zod session/turn schemas in `web/lib/validation/interview.ts` |
| `InterviewTurn` | Ordered question/answer turn in a session; `kind` as string (`primary` \| `follow_up`); optional `category`, `parentTurnId`, answer timestamps; optional `feedback` JSON + `feedbackModel` (JOB-12) |
| `InterviewVideo` | Global curated interview video library (JOB-14); `title`, `url`, `categoryTags[]`, optional `targetRoles[]` / `targetIndustries[]` / `experienceLevels[]` filters (empty = all), `summary` / `transcript`, `published`, `sortOrder`; not user-owned. Human-made / external hosts only — no AI-generated video claims. MVP writes: any authenticated onboarded user via `/videos/admin` |
| `InterviewTurn` | Ordered question/answer turn in a session; `kind` as string (`primary` \| `follow_up`); optional `category`, `parentTurnId` (follow-up → primary, max one follow-up per primary); answer timestamps; optional `feedback` JSON validated by `interviewFeedbackSchema` + `feedbackModel` (JOB-12; coaching scores only, stored on primary after unit settles) |
| `AssessmentCategory` | Global aptitude practice categories (`slug` unique; `disclaimerKind` string, default `practice_only`); not user-owned |
| `AssessmentQuestion` | Global bank items per category; `choices` JSON `[{key,label}]`; `correctAnswer` nullable for reflection; optional `difficulty` string |
| `AssessmentAttempt` | User-owned practice run (`status`: `in_progress` \| `completed`); optional `score`/`maxScore`/`summary` JSON; `startedAt`/`completedAt` |
| `AssessmentAnswer` | One answer per question per attempt (`@@unique([attemptId, questionId])`); `selectedKey` and/or `freeText`; `isCorrect` nullable for reflection |
| `UserConsent` | User acknowledgments for upload and AI processing; `kind` is `upload` \| `ai_processing`; `version` matches `CONSENT_COPY_VERSION` in `web/lib/legal/copy.ts`; unique on `(userId, kind, version)` |
| `DataRequest` | User export/deletion requests from Settings; `type` is `export` \| `deletion`; `status` is `pending` \| `completed` \| `rejected` (default `pending`); optional `note` for operators; MVP does **not** auto-delete storage — rows are for operator handling. Immediate export JSON is metadata-only (profile + document meta + recent analysis ids; no file bytes) via `requestDataExportAction` |
| `AnalyticsEvent` | First-party product metrics (JOB-17); `userId` optional UUID FK (SET NULL on user delete); `name` event key from `web/lib/analytics/events.ts`; `props` JSON scalars only (ids, scores, rating — **never** resume/JD/answer body text); `createdAt`. Indexes on `userId`, `name`, `createdAt`, `(userId, name)`. Taxonomy: [analytics-taxonomy.md](./analytics-taxonomy.md) |

Zod enums/payloads for category slugs, attempt status, choices, and question payloads live in `web/lib/validation/assessment.ts`.

### Prisma client in Next.js dev

`web/lib/prisma.ts` caches a `PrismaClient` on `globalThis` in development. After schema changes, run:

```bash
cd web && npx prisma generate
```

and restart `npm run dev` if delegates are missing. The singleton also tracks a **schema version string** so stale clients without new models (e.g. `resumeDocument`) are discarded.

## Supabase Storage

See [ADR-001 in architecture.md](./architecture.md#adr-001-resume-file-storage--supabase-storage-not-vercel-blob).

| Item | Value |
|------|--------|
| Bucket | `resumes` (private) |
| Path | `{userId}/{documentId}/{safeFilename}` |
| Provider field | `ResumeDocument.storageProvider` (`supabase` default) |

Bucket may be auto-created via the service-role admin API on first upload (`ensureResumesBucket`).

## Environment

Never commit secrets. Use gitignored `.env.local` at repo root and/or `web/.env.local`.

| Variable | Use |
|----------|-----|
| `DATABASE_URL` | Prisma |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser/server user session |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only admin (storage bucket ensure/upload helpers) |
| `BLOB_READ_WRITE_TOKEN` | Optional future Vercel Blob adapter (not required for MVP storage) |
| `OPENROUTER_API_KEY` | Server-only OpenRouter API key (see `web/lib/ai/config.ts`) |
| `OPENROUTER_MODEL` | Optional primary model; default in config: `tencent/hy3:free` |
| `OPENROUTER_FALLBACK_MODEL` | Optional fallback; default in config: `nvidia/nemotron-3-ultra-550b-a55b:free` |
| `OPENROUTER_BASE_URL` | Optional API base; default `https://openrouter.ai/api/v1` |
