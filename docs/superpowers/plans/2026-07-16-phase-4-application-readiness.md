# Lightweight plan: Phase 4 — Application readiness

**Spec:** [docs/specs/2026-07-16-mvp-phase-4-application-readiness.md](../../specs/2026-07-16-mvp-phase-4-application-readiness.md)  
**Branch / worktree:** `feat/phase-4-application-readiness` @ `.worktree/phase-4-application-readiness`  
**Implementer:** Composer 2.5 via `HOME=/root grok -p … -m grok-composer-2.5-fast --yolo --output-format json`  
**No git from implementers** — main agent commits + notes.

This is the cross-task **contract** (who consumes/produces what). Implementers regenerate code from the contract; do not treat this as a shell script.

---

## File structure (new/touched)

```
web/
  lib/ai/openrouter.ts
  lib/ai/resume-review.ts
  lib/ai/job-match.ts
  lib/ai/prep-plan.ts
  lib/validation/resume-review.ts
  lib/validation/job-match.ts
  lib/validation/prep-plan.ts
  app/actions/resume-review.ts
  app/actions/job-match.ts
  app/actions/prep-plan.ts
  app/resume/check/page.tsx
  app/jobs/match/page.tsx          # replace placeholder
  app/plan/page.tsx                # replace placeholder
  app/dashboard/page.tsx           # status cards
  components/resume/check-dashboard.tsx
  components/resume/bullet-rewrite.tsx
  components/jobs/paste-form.tsx
  components/jobs/match-results.tsx
  components/plan/plan-checklist.tsx
  prisma/schema.prisma
  prisma/migrations/<ts>_phase4_application_readiness/
  __tests__/resume-review-schema.test.ts
  __tests__/job-match-schema.test.ts
  __tests__/prep-plan-schema.test.ts
docs/architecture.md               # ADR-003 OpenRouter
docs/database.md                   # models + env
```

---

## Task decomposition

### T1 — JOB-32 Review schema + Prisma (`4.1`)

**Consumes:** existing `User`, `ResumeDocument`  
**Produces:**

- `web/lib/validation/resume-review.ts` — `resumeReviewResultSchema`, types
- Prisma `ResumeReview` + relations + migration
- `docs/database.md` row for `ResumeReview`

**Interfaces:**

```ts
// validation
export const resumeReviewResultSchema: z.ZodType<ResumeReviewResult>;
export type ResumeReviewResult = { overallScore: number; /* …spec §5 */ };
export function parseResumeReviewResult(data: unknown): ResumeReviewResult;
```

**Tests:** schema accepts fixture; rejects missing score / out-of-range.

---

### T2 — JOB-33 AI review service (`4.2`)

**Consumes:** T1 schema, `Profile`, `ResumeDocument`, `OPENROUTER_API_KEY`  
**Produces:**

- `web/lib/ai/openrouter.ts` — `getOpenRouterModel()`
- `web/lib/ai/resume-review.ts` — `generateResumeReview(input)`
- `web/app/actions/resume-review.ts` — `runResumeReviewAction(documentId)`
- ADR-003 snippet in `docs/architecture.md`

**Interfaces:**

```ts
// openrouter.ts
export function getOpenRouterModel(): LanguageModel; // throws if no key
export function getOpenRouterModelId(): string;

// resume-review.ts
export type ReviewInput = {
  targetRole: string;
  experienceLevel: string;
  resumeText: string;
  parsedJson?: unknown;
};
export async function generateResumeReview(input: ReviewInput): Promise<ResumeReviewResult>;

// actions
export async function runResumeReviewAction(documentId: string): Promise<
  { ok: true; reviewId: string } | { ok: false; error: string }
>;
```

**Rules:** ownership check; require non-empty rawText or parsedData; status pending→completed/failed.

---

### T3 — JOB-34 Review UI (`4.3`)

**Consumes:** T2 action + latest `ResumeReview`  
**Produces:** `/resume/check` page + dashboard component; link from `/resume`

**Interfaces:** Server Component loads latest review for user; client button calls `runResumeReviewAction`.

---

### T4 — JOB-35 Bullet rewrite (`4.4`)

**Consumes:** openrouter + review context  
**Produces:** `rewriteResumeBulletAction({ original, context })` + UI control

```ts
export async function rewriteResumeBulletAction(input: {
  original: string;
  surroundingContext?: string;
}): Promise<{ ok: true; suggestions: string[] } | { ok: false; error: string }>;
```

---

### T5 — JOB-36 Tests (`4.5`)

**Consumes:** T1–T4  
**Produces:** vitest coverage for schema, empty-resume guard, ownership helper (mock prisma/session if needed)

---

### T6 — JOB-37 JD models (`4.6`)

**Produces:** `JobDescription`, `JobMatchAnalysis` + zod `jobRequirementsSchema` / `jobMatchResultSchema` + migration

---

### T7 — JOB-38…41 Match pipeline (`4.7–4.10`)

**Produces:** actions + AI extract/score + `/jobs/match` UI + history

```ts
export async function analyzeJobDescriptionAction(form: {
  rawText: string;
  title?: string;
  company?: string;
  resumeDocumentId?: string;
}): Promise<{ ok: true; matchId: string; jobId: string } | { ok: false; error: string }>;
```

**Flow:** create JD → extract requirements → match vs resume → save analysis.

---

### T8 — JOB-46…49 Prep plan (`4.11–4.14`)

**Produces:** models + `generatePrepPlanAction` + `/plan` UI + `isPlanStale()` + refresh

```ts
export function isPlanStale(plan: PreparationPlan, sources: {
  profileUpdatedAt: Date | null;
  latestReviewId: string | null;
  latestMatchId: string | null;
}): boolean;

export async function generatePrepPlanAction(opts?: {
  jobMatchId?: string;
}): Promise<{ ok: true; planId: string } | { ok: false; error: string }>;

export async function updatePlanItemStatusAction(
  itemId: string,
  status: "todo" | "done" | "skipped",
): Promise<{ ok: true } | { ok: false; error: string }>;
```

---

### T9 — Dashboard polish (with T3 or T8)

Wire `/dashboard` cards to latest scores/progress (read-only).

---

## Build order

```
T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → T9
```

Sequential on one branch (shared Prisma + User relations).

## Risks

| Risk | Mitigation |
|------|------------|
| OpenRouter model/schema drift | Env-configurable model; zod validate all outputs |
| Long AI latency | Action timeout UX; clear loading; fail soft |
| Prompt invents experience | Explicit system prompt + original bullet required for rewrites |
| Migration on shared DB | Single migration file per model batch; generate client after |
| Implementer skips full suite | Main agent re-runs lint/typecheck/test/build |

## Commit map (≈ TODO sub-items)

1. `feat(ai): resume review schema + ResumeReview model` (4.1)
2. `feat(ai): OpenRouter client + resume review generation` (4.2)
3. `feat(ui): resume check dashboard` (4.3)
4. `feat(ai): bullet rewrite workflow` (4.4)
5. `test: resume review schema and guards` (4.5)
6. `feat(db): job description + match models` (4.6)
7. `feat(ai): JD paste, extract, match UI` (4.7–4.10)
8. `feat(ai): prep plan model, generate, UI, refresh` (4.11–4.14)
9. `feat(ui): dashboard readiness cards` (T9) — may merge into 8 if small

Each commit: full web suite + git note from template.
