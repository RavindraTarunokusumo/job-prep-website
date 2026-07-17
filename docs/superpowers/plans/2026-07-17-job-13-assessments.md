# Lightweight plan: JOB-13 — Assessments practice

**Spec:** [docs/specs/2026-07-17-mvp-job-13-assessments.md](../../specs/2026-07-17-mvp-job-13-assessments.md)  
**Branch / worktree:** `feat/job-13-assessments` @ `.worktree/job-13-assessments`  
**Implementer:** grok handoff; **no git**  
**Tests:** intentionally simple (schema + seed integrity + scoring arithmetic).

---

## File structure

```
web/
  prisma/schema.prisma
  prisma/migrations/<ts>_job13_assessments/
  prisma/seed-assessments.ts   # or lib/assessment/seed-data.ts + seed script
  lib/validation/assessment.ts
  lib/assessment/score.ts
  lib/assessment/seed-data.ts  # original question bank as typed data
  app/actions/assessment.ts
  app/assessments/page.tsx
  components/assessments/category-list.tsx
  components/assessments/attempt-workspace.tsx
  components/assessments/results-summary.tsx
  __tests__/assessment-schema.test.ts
  __tests__/assessment-score.test.ts
docs/database.md
TODO.md
```

---

## Tasks

### T1 — JOB-59 Data model

Prisma models + migration + validation module + simple schema tests + database.md.

### T2 — JOB-60 Seed bank

Typed seed data (original questions). Idempotent seed function. Simple tests: every MCQ has correctKey ∈ choices; reflections have null correctKey; min counts per category.

### T3 — JOB-61 UI

Replace `/assessments` placeholder: category list, attempt flow, disclaimers.

### T4 — JOB-62 Scoring + summaries

`scoreAttempt` + complete action + results UI + tip blurbs.

---

## Build order

`T1 → T2 → T3 → T4` (strict). One commit per task.

## Risks

- Overbuilding psychometrics — **do not**; simple correctness is enough
- Do not add OpenRouter dependency
- Do not touch interview or privacy branches' exclusive files
