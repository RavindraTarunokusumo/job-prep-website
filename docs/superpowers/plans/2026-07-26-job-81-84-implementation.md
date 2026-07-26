# Lightweight plan: JOB-81–84

**Status:** Accepted (Autopilot grant)  
**Spec:** `docs/specs/2026-07-26-job-81-84-workspace-evidence-progress-cv.md`  
**Branch:** `feat/job-81-84-workspace-evidence-progress-cv`

## File structure (new)

```
web/prisma/schema.prisma                    # + JobApplication, CareerEvidence, StarStory, CvDocument, CvVersion
web/prisma/migrations/20260726120000_job_81_84_.../
web/lib/validation/application.ts
web/lib/validation/evidence.ts
web/lib/validation/cv.ts
web/lib/applications/stage.ts
web/lib/evidence/verification.ts
web/lib/progress/compare.ts
web/lib/cv/rewrite-guards.ts
web/lib/cv/versioning.ts
web/lib/cv/pdf.ts
web/app/actions/application.ts
web/app/actions/evidence.ts
web/app/actions/progress.ts
web/app/actions/cv.ts
web/app/applications/page.tsx
web/app/evidence/page.tsx
web/app/progress/page.tsx
web/app/cv/page.tsx
web/components/applications/*
web/components/evidence/*
web/components/progress/*
web/components/cv/*
web/__tests__/application-*.test.ts
web/__tests__/evidence-*.test.ts
web/__tests__/progress-*.test.ts
web/__tests__/cv-*.test.ts
web/middleware.ts                           # auth prefixes
```

## Task decomposition

### T0 — Spec/TODO (this plan + spec + TODO.md)
### T1 — JOB-81
- Schema JobApplication + migration
- Domain stage/urgency + zod
- Server actions
- UI workspace
- Tests
### T2 — JOB-82
- Schema CareerEvidence + StarStory
- Domain verification + STAR gates
- Actions + UI + tests
### T3 — JOB-83
- Domain compare/trends (no new tables)
- Actions + UI + tests
### T4 — JOB-84
- Schema CvDocument/CvVersion
- Rewrite guards, versioning, PDF
- Actions + UI + tests
### T5 — Dashboard links + middleware + PR

## Per-task interfaces

### T1 Consumes / Produces
- **Consumes:** `requireUser`, prisma User, optional JobDescription ids
- **Produces:** `createApplicationAction`, `updateApplicationAction`, `moveApplicationStageAction`, `archiveApplicationAction`, `listApplicationsAction`, `getWorkspaceActionsAction`

### T2
- **Produces:** `createEvidenceAction`, `updateEvidenceAction`, `confirmEvidenceAction`, `archiveEvidenceAction`, `createStarStoryAction`, `updateStarStoryAction`, `listConfirmedEvidenceForPrep`, `listReadyStarStories`

### T3
- **Produces:** `listProgressHistoryAction`, `compareProgressAttemptsAction`, pure `compareAttempts`, `buildTrendInsights`

### T4
- **Produces:** `createCvDocumentAction`, `saveCvVersionAction`, `duplicateCvVersionAction`, `restoreCvVersionAction`, `exportCvPdfAction`, pure rewrite/PDF helpers

## Build order

1. Spec/plan/TODO commit  
2. Shared schema migration for all new models (one migration) — then feature slices can land independently  
3. T1 → T2 → T3 → T4 (T3 independent of T1/T2 data; T4 may read evidence)  
4. Middleware + dashboard nav  
5. Full suite + PR  

## Risks

- Large surface: keep UI functional MVP, not design polish.
- PDF without heavy browser: pure PDF writer for selectable text.
- Prisma client regenerate required after schema change.
