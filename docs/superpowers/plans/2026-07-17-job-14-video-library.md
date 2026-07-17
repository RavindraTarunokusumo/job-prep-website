# Lightweight plan: JOB-14 — Interview video library

**Spec:** [docs/specs/2026-07-17-mvp-job-14-video-library.md](../../specs/2026-07-17-mvp-job-14-video-library.md)  
**Branch / worktree:** `feat/job-14-videos` @ `.worktree/wave2-job-14-videos`  
**Implementer:** Wave 2 `grok-4.5`; **no git**  
**Tests:** simple (schema + seed + recommend pure functions).

---

## File structure

```
web/
  prisma/schema.prisma
  prisma/migrations/<ts>_job14_interview_videos/migration.sql
  lib/validation/video.ts
  lib/videos/seed-data.ts
  lib/videos/seed.ts
  lib/videos/recommend.ts
  scripts/seed-videos.ts
  app/actions/video.ts
  app/videos/page.tsx
  app/videos/admin/page.tsx
  components/videos/video-library.tsx
  components/videos/video-filters.tsx
  components/videos/video-admin-form.tsx
  __tests__/video-schema.test.ts
  __tests__/video-seed.test.ts
  __tests__/video-recommend.test.ts
  lib/prisma.ts                          # bump client version + delegate check
  lib/ai/prep-plan.ts                    # href hints for /videos
  components/plan/plan-checklist.tsx     # video recommend link when needed
docs/database.md
docs/specs/2026-07-17-mvp-job-14-video-library.md
docs/superpowers/plans/2026-07-17-job-14-video-library.md
TODO.md
```

---

## Tasks

### T1 — JOB-63 Data model

- Add `InterviewVideo` to Prisma schema + migration SQL
- `lib/validation/video.ts` + schema tests
- Update `docs/database.md`
- Bump `PRISMA_CLIENT_VERSION` / `hasRequiredDelegates` for `interviewVideo`

**Interfaces:** Consumes env `DATABASE_URL`; Produces Prisma delegate `prisma.interviewVideo`.

### T2 — Seed (sample human-made metadata)

- Typed seed data (public YT/Vimeo placeholders, disclaimer in comments)
- Idempotent `seedInterviewVideos(prisma)` by fixed ids
- `npm run seed:videos` script
- Seed integrity tests

**Interfaces:** `seedInterviewVideos(client) => { count: number }`

### T3 — JOB-64 Browse UI + actions list

- `listVideosAction(filters)` — published only; optional category/role/industry/experience query filters; seed-if-empty
- Replace `/videos` placeholder with filter + card list + human-made disclaimer
- External `url` opens in new tab

**Interfaces:** Consumes `VideoFilters`; Produces `VideoListItem[]`

### T4 — JOB-65 Admin form

- `/videos/admin` + `createVideoAction` (requireUser + onboardingCompletedAt)
- Form component; revalidate `/videos`
- Document MVP authz in page copy

**Interfaces:** `createVideoAction(unknown) => { ok, id?, error? }`

### T5 — JOB-66 Plan recommendations

- `videoHrefForPlanItem` / `matchVideosForPlanItem` pure helpers + tests
- Prep-plan system prompt: allow `/videos` and `/videos?category=…` hrefs for interview items
- Plan checklist: if interview category and missing/weak href, show link via recommend helper

**Interfaces:** pure functions; checklist consumes `item.category` / `title` / `href`

### T6 — Docs / TODO / suite

- TODO.md JOB-14 section (active work)
- Full suite from `web/`: lint, typecheck, test, build

---

## Build order

`T1 → T2 → T3 → T4 → T5 → T6` (T3/T4 can share actions file). Sequential in one worktree.

## Risks

- Overbuilding CMS — **create-only** admin is enough
- Empty library in prod without seed — seed-if-empty on list
- Filter performance — MVP row counts are tiny; in-memory/array-has filters OK
- Do not add AI video generation or OpenRouter video endpoints
