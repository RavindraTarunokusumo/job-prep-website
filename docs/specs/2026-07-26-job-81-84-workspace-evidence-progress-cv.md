# Spec: JOB-81–84 — Application workspace, evidence/STAR, progress, CV editor

| Field | Value |
|-------|--------|
| **Status** | Accepted (Autopilot grant — no human acceptance required) |
| **Date** | 2026-07-26 |
| **Branch** | `feat/job-81-84-workspace-evidence-progress-cv` |
| **Worktree** | `.worktree/autopilot-job-81-84` |
| **Linear** | [JOB-81](https://linear.app/job-prep-website/issue/JOB-81), [JOB-82](https://linear.app/job-prep-website/issue/JOB-82), [JOB-83](https://linear.app/job-prep-website/issue/JOB-83), [JOB-84](https://linear.app/job-prep-website/issue/JOB-84) |
| **Depends on** | Profile, resume, job match, application drafts, interview, assessments, performance report (main) |
| **AI** | Not required for core paths; no invention of metrics/achievements |

## 1. Goals

1. **JOB-81** — Application tracker & job-search workspace for real applications (stages, attachments, next actions/deadlines).
2. **JOB-82** — Verified career evidence bank + STAR stories grounded only in user-confirmed facts.
3. **JOB-83** — Longitudinal readiness progress and side-by-side attempt comparison with honest partial-data handling.
4. **JOB-84** — Structured CV editor with named versions, rewrite guards, outdated warnings, and PDF export.

## 2. Shared constraints

- Auth + ownership via `userId` on every user-owned row; server actions use `requireUser` + ownership checks.
- Empty / loading / error UI patterns consistent with existing MVP pages.
- No external job-board scraping.
- System never invents employers, dates, metrics, achievements, or responsibilities.
- Deterministic domain helpers are pure and unit-tested offline (no live AI).
- Coaching product only — no hire/no-hire scoring.

## 3. JOB-81 — Application tracker

### Requirements

- CRUD + archive for application records.
- Stages: `interested` → `preparing` → `applied` → `interview` → `offer` | `rejected` | `withdrawn` (forward/sideways allowed; domain documents valid transitions).
- Fields: company, role, source URL, location, stage, applied/closing dates, next action + deadline, recruiter/contact, notes, archive flag.
- Optional links: `jobDescriptionId`, `jobMatchAnalysisId`, `applicationDraftId`, `interviewSessionId`, `preparationPlanId`.
- Workspace lists applications; surfaces **upcoming** and **overdue** next actions (deadline vs now).
- Routes: `/applications` (list/workspace), detail via query or nested path.

### Data model

```prisma
model JobApplication {
  id                 String    @id @default(cuid())
  userId             String    @db.Uuid
  company            String
  role               String
  stage              String    // interested|preparing|applied|interview|offer|rejected|withdrawn
  sourceUrl          String?
  location           String?
  appliedAt          DateTime?
  closingDate        DateTime?
  nextAction         String?
  nextActionDue      DateTime?
  contactName        String?
  contactEmail       String?
  notes              String?   @db.Text
  // active | archived
  status             String    @default("active")
  jobDescriptionId   String?
  jobMatchAnalysisId String?
  applicationDraftId String?
  interviewSessionId String?
  preparationPlanId  String?
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
  @@index([userId])
  @@index([userId, status])
  @@index([userId, nextActionDue])
}
```

### Domain helpers (`lib/applications/`)

- `APPLICATION_STAGES`, `canTransitionStage(from, to)`, `isTerminalStage(stage)`
- `classifyActionUrgency(due, now)` → `overdue` | `upcoming` | `none`
- `sortApplicationsForWorkspace(apps, now)`

### Success criteria

- Owned create/update/stage-move/archive; non-owner returns error.
- Workspace shows overdue before upcoming.
- Empty state when no applications.

## 4. JOB-82 — Career evidence & STAR bank

### Requirements

- Evidence records from employment, education, volunteering, freelance, projects, competitions, other.
- Verification states: `imported` | `inferred` | `unconfirmed` | `confirmed` | `archived`.
- User can confirm, edit, archive; confirmed facts are the only source for STAR construction helpers.
- STAR stories: Situation, Task, Action, Result + readiness (`draft` | `ready` | `archived`); optional `evidenceId` link.
- Query helpers return confirmed evidence / ready STAR for other workflows.

### Data model

```prisma
model CareerEvidence {
  id               String   @id @default(cuid())
  userId           String   @db.Uuid
  title            String
  // employment|education|volunteering|freelance|project|competition|other
  sourceType       String
  organization     String?
  roleTitle        String?
  startDate        String?
  endDate          String?
  responsibilities String?  @db.Text
  achievements     String?  @db.Text
  metrics          String?  @db.Text
  // imported|inferred|unconfirmed|confirmed|archived
  verification     String   @default("unconfirmed")
  sourceNote       String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  starStories      StarStory[]
  @@index([userId])
  @@index([userId, verification])
}

model StarStory {
  id          String   @id @default(cuid())
  userId      String   @db.Uuid
  evidenceId  String?
  title       String
  situation   String   @db.Text
  task        String   @db.Text
  action      String   @db.Text
  result      String   @db.Text
  // draft|ready|archived
  readiness   String   @default("draft")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  @@index([userId])
  @@index([userId, readiness])
}
```

### Domain helpers (`lib/evidence/`)

- `canConfirmEvidence(verification)`, `transitionVerification(from, to)`
- `assertStarFromConfirmedEvidence(evidence)` — refuses if not confirmed
- `listConfirmedEvidence(items)`, `listReadyStars(items)`

### Success criteria

- STAR builder rejects unconfirmed evidence linkage for “from evidence” path.
- Never auto-fills invented metrics.

## 5. JOB-83 — Longitudinal progress & comparison

### Requirements

- History view of completed resume reviews, interview sessions, assessment attempts, performance reports (and job matches where scored).
- Side-by-side comparison of two attempts of the **same kind** with shared score field; incompatible pairs flagged.
- Score deltas with textual explanations (e.g. “+8 points since prior review”).
- Trends/insights by target role and date range when enough data; otherwise explicit “insufficient data” — no invented conclusions.
- Route: `/progress`.

### Data model

No new tables required for MVP. Pure aggregation over existing models. Optional client-side filters only.

### Domain helpers (`lib/progress/`)

```ts
type AttemptKind = "resume_review" | "job_match" | "interview" | "assessment" | "report";
type ProgressAttempt = { id; kind; label; score: number | null; maxScore?: number | null; completedAt; targetRole?: string | null; meta? };

compareAttempts(a, b) → { compatible: boolean; reason?; delta?; explanation? }
buildTrendInsights(attempts, { role?, from?, to? }) → { insights: string[]; partial: boolean }
normalizeScore(score, maxScore?) → number | null  // 0–100 when possible
```

### Success criteria

- Incompatible kinds return `compatible: false` with reason.
- Partial history yields empty/guarded insights, never fabricated trends.

## 6. JOB-84 — Structured CV editor, versioning, export

### Requirements

- Create CV from confirmed structured data (profile + confirmed evidence + optional parsed resume).
- Sections: contact, summary, experience, education, skills, projects, certifications, languages — show/hide + reorder.
- Apply/reject rewrite suggestions at bullet/section level **without** silently mutating verified employers/dates/responsibilities/achievements/metrics (rewrite guards).
- Named versions: create, duplicate, compare, restore.
- Associate version with job description or job application.
- Outdated warning when source profile `updatedAt` (or evidence set fingerprint) is newer than version snapshot.
- Export readable selectable PDF consistent with structured preview; DOCX best-effort / optional.
- Routes: `/cv`, `/cv?versionId=`.

### Data model

```prisma
model CvDocument {
  id        String      @id @default(cuid())
  userId    String      @db.Uuid
  title     String
  // active | archived
  status    String      @default("active")
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt
  versions  CvVersion[]
  @@index([userId])
}

model CvVersion {
  id                 String      @id @default(cuid())
  documentId         String
  document           CvDocument  @relation(...)
  userId             String      @db.Uuid
  name               String
  // structured CV JSON (zod)
  content            Json
  // section order + visibility
  sectionConfig      Json?
  jobDescriptionId   String?
  jobApplicationId   String?
  // ISO timestamp of profile/evidence baseline when version created
  sourceFingerprint  String?
  isCurrent          Boolean     @default(false)
  createdAt          DateTime    @default(now())
  updatedAt          DateTime    @updatedAt
  @@index([documentId])
  @@index([userId])
}
```

### Domain helpers (`lib/cv/`)

- `structuredCvSchema` (zod)
- `applyRewriteSuggestion(content, suggestion, { protectVerified })` — rejects verified-field mutation
- `compareCvVersions(a, b)` → field-level diffs
- `isVersionOutdated(versionFingerprint, currentFingerprint)`
- `buildPdfBytes(content, sectionConfig)` → `Uint8Array` (non-empty PDF)
- `duplicateVersionContent(content)` deep clone

### Success criteria

- Restore sets `isCurrent` on restored version (and clears others).
- PDF export returns bytes starting with `%PDF`.
- Guards block verified-fact silent edits.

## 7. Interfaces (cross-task contract)

| Module | Consumes | Produces |
|--------|----------|----------|
| `lib/validation/application.ts` | zod | stage enums, create/update schemas |
| `lib/applications/stage.ts` | stage strings | transition rules, urgency |
| `app/actions/application.ts` | prisma, auth, validation | ActionResult CRUD |
| `lib/validation/evidence.ts` | zod | evidence + STAR schemas |
| `lib/evidence/verification.ts` | verification strings | transitions, confirm gates |
| `app/actions/evidence.ts` | prisma, auth | evidence + STAR CRUD |
| `lib/progress/compare.ts` | ProgressAttempt | compare + trends |
| `app/actions/progress.ts` | prisma, auth | history list + compare |
| `lib/validation/cv.ts` | zod | structured CV |
| `lib/cv/*` | structured CV | rewrite guards, version ops, PDF |
| `app/actions/cv.ts` | prisma, auth, cv helpers | document/version/export |
| Middleware | AUTH_ONLY_PREFIXES | `/applications`, `/evidence`, `/progress`, `/cv` |

## 8. Workflows

1. User opens `/applications` → create app → move stage → set next action → see overdue on workspace.
2. User opens `/evidence` → add evidence → confirm → create STAR from confirmed evidence → mark ready.
3. User opens `/progress` → see history → pick two same-kind attempts → view delta explanation.
4. User opens `/cv` → create from profile/evidence → edit sections → save named version → export PDF.

## 9. Edge cases

- Archive application hides from default list but remains fetchable by id for owner.
- Terminal stages still allow note edits.
- Unconfirmed evidence cannot be used as STAR “source evidence” in strict mode.
- Comparing assessment (score/max) vs resume review (0–100) → incompatible unless both normalize to 0–100 same kind.
- Empty progress history → empty state, no fake charts.
- PDF failure → action error, no partial silent success.
- Ownership mismatch → generic not-found/forbidden error string (no ID leakage).

## 10. Success criteria (global)

- Full `web/` gate: lint, typecheck, test, build.
- Spec + plan + TODO tracked; per-task commits with git notes.
- PR opened for the branch.

## 11. Out of scope

- JOB-80, JOB-79, production deploy, job-board APIs, DOCX if unreliable, deep rewiring of every AI prompt to consume STAR (data queryable is enough).
