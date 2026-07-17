# Spec: JOB-13 — Aptitude & psychometric practice module

| Field | Value |
|-------|--------|
| **Status** | Accepted (Autopilot grant — Wave 1) |
| **Date** | 2026-07-17 |
| **Branch** | `feat/job-13-assessments` |
| **Worktree** | `.worktree/job-13-assessments` |
| **Linear parent** | [JOB-13](https://linear.app/job-prep-website/issue/JOB-13) |
| **Children** | JOB-59…62 |
| **Depends on** | Phase 2 auth/onboarding |
| **Subagent model** | Composer 2.5 (`grok-composer-2.5-fast`); fallback `grok-4.5` |
| **Note** | **No AI required** for MVP scoring; static original question bank |

## 1. Goal

Authenticated, onboarded users can practice aptitude-style questions with explanations, framed as **preparation only** — not clinical assessment or employment screening.

## 2. Scope

### JOB-59 — Data model

Prisma:

- `AssessmentCategory` — slug, name, description, sortOrder, disclaimer kind
- `AssessmentQuestion` — categoryId, prompt, choices JSON (or free-text for reflection), correctAnswer key (nullable for reflection), explanation, difficulty, sortOrder
- `AssessmentAttempt` — userId, categoryId, status (`in_progress` | `completed`), score, maxScore, summary Json?, startedAt, completedAt
- `AssessmentAnswer` — attemptId, questionId, selectedKey or freeText, isCorrect (nullable for reflection), createdAt

Ownership on attempts. Categories/questions are global content (not per-user).

### JOB-60 — Seed question bank

Original MVP content (not copied from SHL/etc.):

| Category slug | Count (min) | Format |
|---------------|-------------|--------|
| `numerical` | 5 | MCQ |
| `verbal` | 5 | MCQ |
| `logical` | 5 | MCQ |
| `situational_judgment` | 5 | MCQ (best/acceptable style; single best key) |
| `work_style` | 4 | reflection / no single correct |
| `consulting_case` | 4 | MCQ or short structured |

Seed via Prisma seed script or migration SQL insert + `npm run` script. Idempotent preferred (`upsert` by stable slug/id).

**Tests for content quality are intentionally simple:** ensure each MCQ has ≥2 choices, a correct key that exists in choices, and a non-empty explanation; reflection items have null correct key. Do **not** build sophisticated psychometrics.

### JOB-61 — Practice UI (`/assessments`)

- Category list with non-clinical disclaimer
- Start attempt → one question at a time → submit → optional immediate explanation toggle after answer (or end-only)
- Complete → results summary
- Work-style clearly labeled self-reflection

### JOB-62 — Scoring & summaries

- MCQ: +1 correct; reflection: unscored (exclude from max or mark N/A)
- Summary: score/max, % where applicable, per-question review with explanations
- Tips: short static improvement blurb per category (seeded or hardcoded map)

### Out of scope

- Adaptive testing, timers, proctoring
- Official vendor tests, clinical claims
- AI-generated questions (MVP)
- JOB-14 videos

## 3. Interfaces

```ts
// validation/assessment.ts
export const categorySlugSchema = z.enum([
  "numerical", "verbal", "logical",
  "situational_judgment", "work_style", "consulting_case",
]);
export const attemptStatusSchema = z.enum(["in_progress", "completed"]);
export const choiceSchema = z.object({ key: z.string(), label: z.string() });
export const questionPayloadSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  choices: z.array(choiceSchema).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  isReflection: z.boolean(),
});

// lib/assessment/score.ts
export function scoreAttempt(answers: {
  isReflection: boolean;
  selectedKey?: string | null;
  correctKey?: string | null;
}[]): { score: number; maxScore: number; percent: number | null };

// actions/assessment.ts
export async function listCategoriesAction(): ...
export async function startAttemptAction(categorySlug: string): Promise<Result & { attemptId?: string }>;
export async function submitAnswerAction(attemptId: string, questionId: string, selectedKey?: string, freeText?: string): ...
export async function completeAttemptAction(attemptId: string): ...
```

## 4. Success criteria

- [ ] User completes a category attempt and sees score + explanations
- [ ] Work-style reflection does not produce a clinical label
- [ ] Simple schema/seed/scoring tests pass
- [ ] Full `web/` lint, typecheck, test, build

## 5. Constraints

- Disclaimers visible on category list and results
- No invented “percentile vs candidates” claims
- Single trailing newline; no git from implementers
`
