# Spec: MVP Phase 4 — Application readiness (checker, JD match, prep plan)

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Date** | 2026-07-16 |
| **Branch** | `feat/phase-4-application-readiness` |
| **Linear parents** | [JOB-7](https://linear.app/job-prep-website/issue/JOB-7/build-cvresume-checker-and-improvement-workflow), [JOB-8](https://linear.app/job-prep-website/issue/JOB-8/create-job-description-match-analyzer), [JOB-10](https://linear.app/job-prep-website/issue/JOB-10/generate-personalized-job-preparation-plan) |
| **Children** | JOB-32…36 (skip JOB-79), JOB-37…41, JOB-46…49 |
| **Depends on** | Phase 3 resume upload/parse (PR #3) + onboarding profile |
| **Subagent model** | Composer 2.5 (`grok-composer-2.5-fast`) |
| **AI key** | `OPENROUTER_API_KEY` in `web/.env.local` (server-only) |

## 1. Goal

Authenticated users with an onboarded profile and at least one parsed resume can:

1. **Run a CV/resume checker** that returns scores, strengths/weaknesses, ATS risks, and priority actions grounded in their resume + target role.
2. **Paste a job description**, extract structured requirements, and see a **resume-to-job match** (matched vs missing skills/keywords, evidence gaps, next actions).
3. **Generate a personalized preparation plan** that prioritizes CV fixes, application prep, interview topics, and skill gaps — using profile + latest review + optional JD match.

This phase delivers the core product promise: *upload CV → choose target role → get a prep plan*.

## 2. AI provider decision (ADR-003)

| Field | Value |
|-------|--------|
| **Status** | Accepted |
| **Date** | 2026-07-16 |

### Context

Linear/specs call for **Vercel AI SDK**. The environment has **`OPENROUTER_API_KEY`** (not OpenAI/Anthropic/xAI direct). OpenRouter exposes an OpenAI-compatible Chat Completions API.

### Decision

- Use **Vercel AI SDK** (`ai` + `@ai-sdk/openai` provider pointed at OpenRouter).
- Env:
  - `OPENROUTER_API_KEY` (required for AI features)
  - `OPENROUTER_MODEL` optional; default **`tencent/hy3:free`**
  - `OPENROUTER_FALLBACK_MODEL` optional; default **`nvidia/nemotron-3-ultra-550b-a55b:free`** (used if primary fails)
  - Optional `OPENROUTER_BASE_URL` default `https://openrouter.ai/api/v1`
- All LLM calls **server-only** (Server Actions / lib services). Never expose the key to the client.
- Prefer **structured output** validated with **zod** after generation; reject invalid AI payloads with a safe user-facing error.
- Guardrails: prompts must forbid inventing experience, employers, dates, or metrics not present in the user’s resume/profile.

### Consequences

- One SDK surface for all Phase 4 AI features.
- Model can be swapped via env without code changes.
- Offline/CI tests mock the AI layer; unit tests cover schema validation + ownership without live keys.

### Related code (to create)

- `web/lib/ai/openrouter.ts` — shared model factory
- `web/lib/ai/prompts/*` — review / match / plan system prompts

## 3. Scope

### In scope

**Shared**

- Prisma models for reviews, job descriptions/matches, prep plans
- Shared OpenRouter + AI SDK client
- Dashboard links / status chips for latest review score, match %, plan progress (lightweight)
- Auth + ownership on every read/write
- Tests for schemas, ownership helpers, and prompt-output validation (mocked AI)

**JOB-7 — Resume checker**

- Schema + `ResumeReview` model
- AI review generation from `ResumeDocument.parsedData` / `rawText` + `Profile`
- Review UI (scores, strengths/weaknesses, ATS risks, actions)
- Bullet rewrite action (editable suggestions; no invented experience)
- Unit/regression tests for schema + empty resume handling

**JOB-8 — JD match**

- Models for pasted JD + analysis result
- Paste/analyze UI on `/jobs/match`
- AI requirement extraction + match scoring vs resume/profile
- Results UI (matched / missing chips, gaps, next actions)

**JOB-10 — Prep plan**

- `PreparationPlan` + items model
- Generation from profile + latest review + optional latest match
- Plan dashboard UI with checklist / priority / mark done-skipped
- Stale detection when source IDs change; user-triggered refresh

### Out of scope

- **JOB-79** research (owned by another person — skip)
- Cover letter / messages (Phase 5 / JOB-9)
- Mock interview, assessments, videos
- Scraping external job boards
- Claiming hiring probability or guaranteed interview outcomes
- Streaming UI polish beyond basic loading states
- Multi-model A/B or user-selectable models in UI

## 4. Data models

Prefer **JSON columns for AI payloads** (validated by zod) over many junction tables for MVP speed. Store source linkage for staleness.

```prisma
model ResumeReview {
  id               String   @id @default(cuid())
  userId           String   @db.Uuid
  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  resumeDocumentId String
  resumeDocument   ResumeDocument @relation(fields: [resumeDocumentId], references: [id], onDelete: Cascade)
  status           String   // pending | completed | failed
  model            String?
  errorMessage     String?
  // Validated against resumeReviewResultSchema
  result           Json?
  overallScore     Int?     // denormalized 0-100 for list/dashboard
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@index([userId])
  @@index([resumeDocumentId])
}

model JobDescription {
  id               String   @id @default(cuid())
  userId           String   @db.Uuid
  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  title            String?
  company          String?
  sourceNote       String?
  rawText          String   @db.Text
  // Validated jobRequirementsSchema (nullable until analyzed)
  extracted        Json?
  status           String   // draft | analyzed | failed
  errorMessage     String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  matchAnalyses    JobMatchAnalysis[]

  @@index([userId])
}

model JobMatchAnalysis {
  id                 String   @id @default(cuid())
  userId             String   @db.Uuid
  user               User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  jobDescriptionId   String
  jobDescription     JobDescription @relation(fields: [jobDescriptionId], references: [id], onDelete: Cascade)
  resumeDocumentId   String?
  resumeDocument     ResumeDocument? @relation(fields: [resumeDocumentId], references: [id], onDelete: SetNull)
  status             String   // pending | completed | failed
  model              String?
  errorMessage       String?
  // Validated jobMatchResultSchema
  result             Json?
  matchScore         Int?     // 0-100 denormalized
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  @@index([userId])
  @@index([jobDescriptionId])
}

model PreparationPlan {
  id                 String   @id @default(cuid())
  userId             String   @db.Uuid
  user               User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  title              String   @default("My prep plan")
  status             String   // active | archived
  // Source snapshot IDs for staleness
  sourceProfileUpdatedAt DateTime?
  sourceResumeReviewId   String?
  sourceJobMatchId       String?
  model              String?
  summary            String?  @db.Text
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  items              PreparationPlanItem[]

  @@index([userId])
}

model PreparationPlanItem {
  id          String   @id @default(cuid())
  planId      String
  plan        PreparationPlan @relation(fields: [planId], references: [id], onDelete: Cascade)
  category    String   // cv | application | interview | skills | other
  title       String
  description String?  @db.Text
  reason      String?  @db.Text
  priority    Int      @default(0) // lower = higher priority
  status      String   @default("todo") // todo | done | skipped
  href        String?  // optional deep link e.g. /resume/review
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([planId])
}
```

Update `User` and `ResumeDocument` relations accordingly.

## 5. Zod result shapes (interfaces)

### Resume review (`resumeReviewResultSchema`)

```ts
{
  overallScore: number; // 0-100
  sectionScores: { section: string; score: number; note?: string }[];
  strengths: string[];
  weaknesses: string[];
  atsRisks: string[];
  missingMetrics: string[];
  priorityActions: { title: string; detail: string; priority: number }[];
  rewriteSuggestions: {
    original: string;
    suggested: string;
    rationale: string;
  }[];
  summary: string;
}
```

### Job requirements (`jobRequirementsSchema`)

```ts
{
  roleTitle?: string;
  company?: string;
  requiredSkills: string[];
  preferredSkills: string[];
  responsibilities: string[];
  experienceLevel?: string;
  keywords: string[];
  tools: string[];
  certifications: string[];
  interviewTopics: string[];
  inferredNotes: string[]; // mark ambiguous extractions
}
```

### Job match (`jobMatchResultSchema`)

```ts
{
  matchScore: number; // 0-100 — fit score, NOT hire probability
  matched: { item: string; evidence?: string }[];
  missing: { item: string; importance: "required" | "preferred"; suggestion?: string }[];
  keywordGaps: string[];
  strengths: string[];
  gaps: string[];
  nextActions: { title: string; detail: string; priority: number }[];
  summary: string;
}
```

### Prep plan generation payload

```ts
{
  summary: string;
  items: {
    category: "cv" | "application" | "interview" | "skills" | "other";
    title: string;
    description?: string;
    reason: string;
    priority: number;
    href?: string;
  }[];
}
```

## 6. Workflows

### 6.1 Resume review

1. User opens `/resume` or `/resume/check` (or review tab) with a `parsed` document.
2. Clicks **Run review**.
3. Server action verifies ownership, loads profile + resume text/parsed JSON.
4. Calls OpenRouter via AI SDK with structured prompt; validates zod; saves `ResumeReview`.
5. Redirect/show `/resume/check` (or `/resume/review` secondary nav) with scores and actions.
6. Optional: **Rewrite bullet** — pass original bullet + context; return 1–3 suggestions; user copies/edits (does not auto-mutate resume unless they save to review form).

### 6.2 Job match

1. User opens `/jobs/match`, pastes JD text, optional title/company.
2. Submit → create `JobDescription`, extract requirements, then score against latest parsed resume + profile.
3. Save `JobMatchAnalysis`; show matched/missing chips and next actions.
4. List prior JDs on the same page.

### 6.3 Prep plan

1. User opens `/plan`.
2. **Generate plan** requires at least: completed onboarding + one parsed resume. Prefer also a completed review; JD match optional (plan notes if missing).
3. Persist plan + items; UI allows mark done/skipped.
4. If `sourceResumeReviewId` / `sourceJobMatchId` / profile `updatedAt` differ from latest sources, show **Plan may be outdated** + **Refresh** button (creates new active plan or regenerates items; archive previous).

## 7. Routes & UI

| Route | Behavior |
|-------|----------|
| `/resume/check` | Run + view latest resume review (new page; keep `/resume/review` for parsed-field edit) |
| `/jobs/match` | Replace placeholder: paste form + results + history |
| `/plan` | Replace placeholder: generate + checklist |
| `/dashboard` | Show cards: latest overallScore, matchScore, plan progress + deep links |

RoleReady tokens (brand purple/blue, success/warning) — match existing landing/dashboard styles. Use shadcn Card, Badge, Button, Input, Label; add Textarea if missing.

## 8. Files (suggested)

| Path | Role |
|------|------|
| `web/lib/ai/openrouter.ts` | Provider + model helper |
| `web/lib/ai/resume-review.ts` | Generate review |
| `web/lib/ai/job-match.ts` | Extract requirements + match |
| `web/lib/ai/prep-plan.ts` | Generate plan |
| `web/lib/validation/resume-review.ts` | zod schemas |
| `web/lib/validation/job-match.ts` | zod schemas |
| `web/lib/validation/prep-plan.ts` | zod schemas |
| `web/app/actions/resume-review.ts` | server actions |
| `web/app/actions/job-match.ts` | server actions |
| `web/app/actions/prep-plan.ts` | server actions |
| `web/app/resume/check/page.tsx` | review UI |
| `web/components/resume/review-dashboard.tsx` | scores UI |
| `web/components/resume/bullet-rewrite.tsx` | rewrite control |
| `web/components/jobs/*` | paste + match results |
| `web/components/plan/*` | plan checklist |
| `web/app/jobs/match/page.tsx` | real page |
| `web/app/plan/page.tsx` | real page |
| `web/prisma/schema.prisma` | models |
| `web/__tests__/resume-review*.test.ts` | schema + ownership |
| `web/__tests__/job-match*.test.ts` | schema |
| `web/__tests__/prep-plan*.test.ts` | schema + staleness helper |

## 9. Edge cases

| Case | Behavior |
|------|----------|
| No `OPENROUTER_API_KEY` | Server actions return clear config error; UI shows setup message |
| Empty / very short resume text | Reject before AI call with guidance to re-upload |
| Empty / short JD (< ~80 chars) | Reject with guidance |
| AI returns invalid JSON / schema fail | `status=failed`, `errorMessage`, user can retry |
| Cross-user id | 404 / unauthorized (never leak existence details if easy) |
| No parsed resume for match/plan | Prompt to complete `/resume` first |
| JOB-79 | Do not implement; do not block on research |
| Invented experience | Prompt + post-check: rewrite suggestions must include `original` from user text |

## 10. Success criteria

- [ ] User with profile + parsed CV can run checker and see overall score + priority actions
- [ ] User can paste JD and see match score + matched/missing lists
- [ ] User can generate prep plan with reasoned checklist items
- [ ] Outputs are specific (reference user content / JD keywords), not generic-only boilerplate
- [ ] Plan items link to existing tools where possible (`/resume/check`, `/jobs/match`, stubs ok for later phases)
- [ ] Full suite: `cd web && npm run lint && npm run typecheck && npm test && npm run build`
- [ ] Secrets never committed; `OPENROUTER_*` documented in `docs/database.md` env table

## 11. Constraints

- Workflow: one TODO sub-item ≈ one commit; git notes from template; no force-push/amend
- Composer 2.5 implementers; main agent full-suite gate before each commit
- Skip JOB-79
- Prisma 6 style (`url = env("DATABASE_URL")`)
- Single trailing newline on every file

## 12. Build order (task IDs)

1. **4.1** JOB-32 review schema + Prisma `ResumeReview` (+ migration)
2. **4.2** JOB-33 AI review service + action (OpenRouter)
3. **4.3** JOB-34 review dashboard UI
4. **4.4** JOB-35 bullet rewrite
5. **4.5** JOB-36 tests
6. **4.6** JOB-37 JD models
7. **4.7–4.10** JOB-38…41 paste UI + extract + score + results (can be one implementer batch if tightly coupled)
8. **4.11–4.14** JOB-46…49 plan models + generate + UI + refresh

Parallelism: after 4.1–4.5 land, JD track and plan models can partially overlap if files disjoint; prefer sequential if Prisma migration conflicts risk is high — **default sequential on one branch**.
