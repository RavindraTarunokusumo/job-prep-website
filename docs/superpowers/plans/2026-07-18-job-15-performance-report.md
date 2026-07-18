# Lightweight plan: JOB-15 — Compiled performance report

**Spec:** [docs/specs/2026-07-18-mvp-job-15-performance-report.md](../../specs/2026-07-18-mvp-job-15-performance-report.md)  
**Branch / worktree:** `feat/job-15-performance-report` @ `.worktree/job-15-performance-report`  
**Implementer:** `HOME=/root grok -p … -m grok-4.5 --effort high --yolo --output-format json`  
**No git from implementers.**

Cross-task **contract** only.

---

## File structure

```
web/
  prisma/schema.prisma
  prisma/migrations/<ts>_job15_performance_report/
  lib/validation/performance-report.ts
  lib/report/aggregate.ts
  lib/ai/performance-report.ts          # optional narrative
  app/actions/performance-report.ts
  app/report/page.tsx
  components/report/report-view.tsx
  components/report/report-list.tsx
  components/report/generate-button.tsx
  app/dashboard/page.tsx                # latest report chip
  __tests__/performance-report-schema.test.ts
  __tests__/performance-report-aggregate.test.ts
  lib/prisma.ts                         # version + delegate
docs/database.md
docs/specs/README.md
TODO.md
```

---

## Tasks

### T1 — JOB-67 Data model (`15.1`)

**Consumes:** `User`  
**Produces:** `PerformanceReport` + migration; validation module; schema tests; `docs/database.md`

**Interfaces:** status/section schemas from spec §4.

### T2 — JOB-68 Generation service (`15.2`)

**Consumes:** T1, prisma sources (profile, ResumeReview, JobMatchAnalysis, InterviewSession+turns, AssessmentAttempt, PreparationPlan+items), OpenRouter helpers, optional consent/analytics  

**Produces:** `lib/report/aggregate.ts`, optional `lib/ai/performance-report.ts`, `generatePerformanceReportAction`, list/get actions  

**Rules:**

- Deterministic aggregation first  
- New version row on each generate  
- Graceful missing sections  
- Prompt: no hire predictions  
- `trackEvent(report_gen)` on success if available  

### T3 — JOB-69 UI (`15.3`)

**Consumes:** T2 actions  
**Produces:** `/report` page, report view/list/generate UI, dashboard link, print-friendly classes, coaching disclaimer  

### T4 — JOB-70 Tests (`15.4`)

**Consumes:** T1–T2  
**Produces:** aggregator fixtures (partial + full); schema safety tests  

---

## Build order

```
T1 → T2 → T3 → T4
```

One commit per task after orchestrator validation.

## Risks

- Shared `schema.prisma` / `prisma.ts` only in this branch  
- AI flakiness → always have deterministic fallback summary  
- Do not require all workflows complete to generate  
