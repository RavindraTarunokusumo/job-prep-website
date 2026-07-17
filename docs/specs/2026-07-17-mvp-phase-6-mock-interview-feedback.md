# Spec: MVP Phase 6 — Text mock interview & answer feedback

| Field | Value |
|-------|--------|
| **Status** | Accepted (Autopilot grant — Wave 1) |
| **Date** | 2026-07-17 |
| **Branch** | `feat/phase-6-mock-interview` |
| **Worktree** | `.worktree/job-11-mock-interview` |
| **Linear parents** | [JOB-11](https://linear.app/job-prep-website/issue/JOB-11), [JOB-12](https://linear.app/job-prep-website/issue/JOB-12) |
| **Children** | JOB-50…54 (flow), JOB-55…58 (feedback) |
| **Depends on** | Phase 2–5 (auth, profile, resume, OpenRouter stack) |
| **Subagent model** | Composer 2.5 (`grok-composer-2.5-fast`); fallback `grok-4.5` if unavailable |
| **AI key** | `OPENROUTER_API_KEY` in `web/.env.local` (server-only) |

## 1. Goal

Authenticated, onboarded users can:

1. **Start a text-based mock interview** aligned to their target role and profile (and optional resume/JD context).
2. **Answer questions in text**, receive at least one **contextual follow-up** when useful.
3. **Get coaching feedback** per answer or at session end — scores + actionable rewrites — without hireability labels.
4. **Review past sessions** with questions, answers, and feedback stored under their account.

Exit criteria (from TODO): start from plan, answer in text, get actionable feedback.

## 2. AI provider (reuse ADR-003)

- `web/lib/ai/config.ts` + `openrouter.ts` (`generateObjectWithFallback`)
- Structured zod output only; `userFacingAiError` for safe errors
- Prompts must not invent user experience; no hire/no-hire or personality diagnoses
- No AI audio/video

## 3. Scope

### In scope — JOB-11

**JOB-50 — Session data model**

- Prisma models: `InterviewSession`, `InterviewTurn` (question + optional answer + optional follow-up chain), optional feedback JSON on turn or session
- Status: `active` | `completed` | `abandoned`
- Link: `userId`, snapshot of `targetRole` / `experienceLevel`, optional `resumeDocumentId`, `jobDescriptionId`, `preparationPlanItemId`
- Ownership on all reads/writes

**JOB-51 — Role-based question generation**

- Generate an ordered question set (default 5, min 3, max 8) covering mix of: behavioral, motivation, competency, role-specific
- Inputs: profile target role/industry/experience, optional resume excerpt, optional JD excerpt
- Persist questions as turns with `kind = "primary"` before user answers

**JOB-52 — Text mock interview UI (`/interview`)**

- Replace placeholder
- Start session (role summary, optional resume/JD selects)
- Active session: show current question, answer textarea, submit
- Progress indicator; abandon / complete
- Session list / resume active session
- Loading and error states; guidance banner (practice only)

**JOB-53 — Contextual follow-up**

- After an answer, AI may emit zero or one follow-up (when answer is vague/missing evidence)
- Follow-up stored as child turn (`kind = "follow_up"`, `parentTurnId`)
- Cap: at most one follow-up per primary question

**JOB-54 — Session tests**

- Unit tests: zod schemas, turn ordering helpers, ownership-shaped fixtures
- Mock AI; no live network required

### In scope — JOB-12

**JOB-55 — Feedback scoring schema**

- Zod + stored JSON shape:
  - dimensions: relevance, specificity, starStructure, clarity, roleAlignment (each 1–5)
  - overallScore 0–100 (coaching score, not hire probability)
  - strengths[], improvements[], missingDetails[], rewriteSuggestion
  - safety: no hireability labels

**JOB-56 — AI answer feedback service**

- Per-answer feedback after submit (or batch at end — prefer **per primary answer after follow-up resolved**)
- Grounded in question + answer (+ profile role)
- Persist on turn (`feedback` Json, `feedbackModel`)

**JOB-57 — Feedback results UI**

- After each scored answer and on session complete summary
- Show dimension scores, bullets, rewrite suggestion
- Explicit “coaching feedback — not a hiring decision” label

**JOB-58 — Feedback tests and safety**

- Schema rejects empty rewrite; tests fixture with banned phrases optional
- Mocked service mapping tests

### Out of scope

- Voice/video interviews
- JOB-13 assessments, JOB-14 videos, JOB-15 report aggregation
- Multi-language interviews
- Claiming interview pass probability

## 4. Data models

```prisma
model InterviewSession {
  id                     String   @id @default(cuid())
  userId                 String   @db.Uuid
  user                   User     @relation(...)
  // active | completed | abandoned
  status                 String
  targetRole             String
  experienceLevel        String?
  targetIndustry         String?
  resumeDocumentId       String?
  jobDescriptionId       String?
  preparationPlanItemId  String?
  title                  String?
  model                  String?  // question-generation model
  errorMessage           String?
  startedAt              DateTime @default(now())
  completedAt            DateTime?
  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt
  turns                  InterviewTurn[]

  @@index([userId])
  @@index([userId, status])
}

model InterviewTurn {
  id              String   @id @default(cuid())
  sessionId       String
  session         InterviewSession @relation(...)
  // primary | follow_up
  kind            String
  // behavioral | motivation | competency | role_specific | follow_up
  category        String?
  orderIndex      Int
  question        String   @db.Text
  answer          String?  @db.Text
  answeredAt      DateTime?
  parentTurnId    String?
  // InterviewFeedback JSON (JOB-12)
  feedback        Json?
  feedbackModel   String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([sessionId])
  @@index([sessionId, orderIndex])
}
```

Prefer string status/kind (match Phase 4/5 style). Add `interviewSessions InterviewSession[]` on `User`.

## 5. Interfaces (contract)

```ts
// validation/interview.ts
export const interviewSessionStatusSchema = z.enum(["active", "completed", "abandoned"]);
export const interviewTurnKindSchema = z.enum(["primary", "follow_up"]);
export const interviewCategorySchema = z.enum([
  "behavioral", "motivation", "competency", "role_specific", "follow_up",
]);
export const questionSetSchema = z.object({
  title: z.string(),
  questions: z.array(z.object({
    category: interviewCategorySchema,
    question: z.string().min(1),
  })).min(3).max(8),
});
export const followUpDecisionSchema = z.object({
  askFollowUp: z.boolean(),
  followUpQuestion: z.string().optional(),
  reason: z.string().optional(),
});
export const interviewFeedbackSchema = z.object({
  overallScore: z.number().int().min(0).max(100),
  dimensions: z.object({
    relevance: z.number().int().min(1).max(5),
    specificity: z.number().int().min(1).max(5),
    starStructure: z.number().int().min(1).max(5),
    clarity: z.number().int().min(1).max(5),
    roleAlignment: z.number().int().min(1).max(5),
  }),
  strengths: z.array(z.string()).max(6),
  improvements: z.array(z.string()).max(6),
  missingDetails: z.array(z.string()).max(6),
  rewriteSuggestion: z.string().min(1),
});

// lib/ai/interview-questions.ts
export async function generateInterviewQuestions(input: {
  targetRole: string;
  experienceLevel?: string | null;
  targetIndustry?: string | null;
  resumeExcerpt?: string | null;
  jdExcerpt?: string | null;
}): Promise<z.infer<typeof questionSetSchema>>;

// lib/ai/interview-follow-up.ts
export async function decideFollowUp(input: {
  question: string;
  answer: string;
  targetRole: string;
}): Promise<z.infer<typeof followUpDecisionSchema>>;

// lib/ai/interview-feedback.ts
export async function generateAnswerFeedback(input: {
  question: string;
  answer: string;
  targetRole: string;
  category?: string | null;
}): Promise<z.infer<typeof interviewFeedbackSchema>>;

// actions/interview.ts
export async function startInterviewSessionAction(...): Promise<Result & { sessionId?: string }>;
export async function submitInterviewAnswerAction(...): Promise<Result & { nextTurnId?: string; followUp?: boolean; feedback?: ... }>;
export async function completeInterviewSessionAction(...): Promise<Result>;
export async function abandonInterviewSessionAction(...): Promise<Result>;
```

## 6. Workflows

1. User opens `/interview` → list recent sessions + Start
2. Start → load profile → AI question set → create session + primary turns → show first unanswered
3. Submit answer → save answer → follow-up decision → if ask, insert follow-up turn and show it; else score answer (primary, or primary after follow-up answer)
4. When no unanswered turns → complete session → summary UI
5. Plan deep link `/interview` already exists on prep items

## 7. Edge cases

- No profile / incomplete onboarding → redirect onboarding
- AI failure on start → `failed` friendly error; no orphan active session without questions (transaction: create after questions OK, or mark abandoned)
- Empty answer rejected client + server
- Concurrent double-submit: idempotent by turnId ownership
- User abandons mid-session
- Feedback must not use words like “unhireable”, “will not get the job” — prompt forbid; test schema still accepts normal coaching text

## 8. Success criteria

- [ ] User can start, answer, get follow-up when warranted, complete session
- [ ] Feedback shows dimensions + rewrite, labeled as coaching
- [ ] Ownership enforced
- [ ] Full `web/` lint, typecheck, test, build pass
- [ ] Unit tests for schemas + mocked AI paths

## 9. Constraints

- Single trailing newline on every file
- No git from implementer subagents
- Do not change unrelated Phase 5 cover-letter code
- Prefer string enums over Prisma enums (repo style)
- Reuse existing UI primitives (`Card`, `Button`, `Textarea`, `Badge`)

