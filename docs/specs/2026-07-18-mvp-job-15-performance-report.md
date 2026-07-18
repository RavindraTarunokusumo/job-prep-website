# Spec: JOB-15 — Compiled performance report

| Field | Value |
|-------|--------|
| **Status** | Accepted (Autopilot grant) |
| **Date** | 2026-07-18 |
| **Branch** | `feat/job-15-performance-report` |
| **Worktree** | `.worktree/job-15-performance-report` |
| **Linear parent** | [JOB-15](https://linear.app/job-prep-website/issue/JOB-15) |
| **Children** | JOB-67, JOB-68, JOB-69, JOB-70 |
| **Depends on** | Profile, resume review, job match, interview feedback, assessments, prep plan (all on main) |
| **Subagent model** | `grok-4.5` (high effort) |
| **AI** | Optional narrative via OpenRouter; deterministic aggregation is the source of truth |

## 1. Goal

Authenticated, onboarded users can **generate a compiled readiness report** that pulls evidence from:

1. Profile / target role  
2. Latest completed resume review  
3. Latest completed job-match analysis  
4. Latest completed mock interview(s) with feedback  
5. Latest completed assessment attempts  
6. Active prep plan progress  

Outputs are **coaching guidance**, never hire/no-hire predictions.

## 2. Scope

### JOB-67 — Data model

Prisma `PerformanceReport`:

- `id`, `userId`, ownership cascade  
- `status`: `generating` | `ready` | `failed`  
- `version` Int (increment on regenerate; keep prior rows)  
- `title` String  
- `summary` Text? (AI or deterministic overview)  
- `sections` Json — structured sections (validated by zod)  
- Source snapshot ids (nullable FKs or string ids):  
  `resumeReviewId`, `jobMatchAnalysisId`, `interviewSessionId`, `preparationPlanId`  
- `model` String? (narrative model if used)  
- `errorMessage` String?  
- `createdAt`, `updatedAt`  
- Indexes on `userId`, `(userId, createdAt)`

Optional: store assessment attempt ids inside `sections` / `meta` Json rather than multi-FK.

### JOB-68 — Generation service

1. **Gather** latest owned inputs (graceful missing sections).  
2. **Aggregate** deterministically into section payloads with scores, bullets, evidence notes.  
3. **Optional AI** narrative for overall summary only (structured zod); fall back to template summary if AI fails.  
4. **Persist** new row (`version = max+1`), never silently overwrite.  
5. Track analytics `report_gen` if `ANALYTICS_EVENTS` / `trackEvent` exist.  
6. Call `requireAiConsent` only if AI narrative is requested/used; pure deterministic generate may skip AI consent but still require auth + onboarding.

### JOB-69 — UI (`/report`)

- Replace placeholder.  
- List recent reports; open one.  
- Generate / regenerate button.  
- Sections: summary first, then profile, application readiness, job fit, interview, assessments, prep plan, next actions.  
- Missing sources: clear placeholders (“No resume review yet — [link]”).  
- Print-friendly layout (`print:` styles or simple structure).  
- Coaching disclaimer banner.  
- Dashboard chip/link to latest report (lightweight).

### JOB-70 — Tests

- Zod schema accept/reject; safety (no hire phrases required empty).  
- Deterministic aggregator unit tests with fixture inputs (partial + full).  
- Simple ownership-shaped helpers if pure.  
- No live AI required.

### Out of scope

- PDF export pipeline  
- Admin multi-user dashboards  
- Hire probability / ranking users  
- JOB-79  

## 3. Data model (sketch)

```prisma
model PerformanceReport {
  id                   String   @id @default(cuid())
  userId               String   @db.Uuid
  user                 User     @relation(...)
  // generating | ready | failed
  status               String
  version              Int      @default(1)
  title                String
  summary              String?  @db.Text
  // PerformanceReportSections JSON
  sections             Json?
  // optional provenance
  meta                 Json?
  resumeReviewId       String?
  jobMatchAnalysisId   String?
  interviewSessionId   String?
  preparationPlanId    String?
  model                String?
  errorMessage         String?
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  @@index([userId])
  @@index([userId, createdAt])
}
```

## 4. Interfaces (contract)

```ts
// lib/validation/performance-report.ts
export const performanceReportStatusSchema = z.enum(["generating", "ready", "failed"]);
export const reportSectionKeySchema = z.enum([
  "profile",
  "application_readiness",
  "job_fit",
  "interview",
  "assessments",
  "prep_plan",
  "next_actions",
]);
export const reportSectionSchema = z.object({
  key: reportSectionKeySchema,
  title: z.string(),
  available: z.boolean(),
  score: z.number().int().min(0).max(100).nullable().optional(),
  summary: z.string().optional(),
  bullets: z.array(z.string()).max(12).default([]),
  evidence: z.array(z.string()).max(12).default([]),
  emptyHint: z.string().optional(),
  href: z.string().optional(),
});
export const performanceReportSectionsSchema = z.object({
  sections: z.array(reportSectionSchema).min(1),
});
export const performanceReportNarrativeSchema = z.object({
  summary: z.string().min(1),
  title: z.string().min(1).optional(),
});

// lib/report/aggregate.ts
export function aggregatePerformanceReportInput(input: GatheredSources): z.infer<typeof performanceReportSectionsSchema>;

// lib/ai/performance-report.ts (optional narrative)
export async function generateReportNarrative(...): Promise<{ summary: string; title?: string }>;

// app/actions/performance-report.ts
export async function generatePerformanceReportAction(): Promise<Result & { reportId?: string }>;
export async function listPerformanceReportsAction(): Promise<...>;
export async function getPerformanceReportAction(id: string): Promise<...>;
```

## 5. Workflows

1. User opens `/report` → list + Generate.  
2. Generate → gather sources → aggregate → optional AI summary → save `ready` row → show report.  
3. Regenerate → new version row.  
4. Open prior version from list.  

## 6. Edge cases

- No sources at all: still create report with all `available: false` placeholders + next actions to complete workflows.  
- Partial data: only filled sections show scores.  
- AI failure: save deterministic sections + template summary; status `ready` (not failed) unless gather/persist fails.  
- Failed persist: `failed` + error message.  
- Ownership on all reads.  

## 7. Success criteria

- [ ] User can generate and view a report with missing-section placeholders  
- [ ] Regenerate creates a new version  
- [ ] No hire/no-hire language in UI or prompts  
- [ ] Full `web/` lint, typecheck, test, build  

## 8. Constraints

- String status fields (repo style)  
- OpenRouter only via config; no hard-coded model ids  
- Single trailing newline; no git from implementers  
- Prefer print CSS over new PDF deps  
