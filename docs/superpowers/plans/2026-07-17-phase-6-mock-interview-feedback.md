# Lightweight plan: Phase 6 — Mock interview & feedback

**Spec:** [docs/specs/2026-07-17-mvp-phase-6-mock-interview-feedback.md](../../specs/2026-07-17-mvp-phase-6-mock-interview-feedback.md)  
**Branch / worktree:** `feat/phase-6-mock-interview` @ `.worktree/job-11-mock-interview`  
**Implementer:** `HOME=/root grok -p … -m grok-composer-2.5-fast --yolo --output-format json` (fallback `grok-4.5`)  
**No git from implementers** — orchestrator commits + notes.

Cross-task **contract** only.

---

## File structure

```
web/
  prisma/schema.prisma
  prisma/migrations/<ts>_phase6_interview/
  lib/validation/interview.ts
  lib/ai/interview-questions.ts
  lib/ai/interview-follow-up.ts
  lib/ai/interview-feedback.ts
  app/actions/interview.ts
  app/interview/page.tsx
  components/interview/session-list.tsx
  components/interview/session-workspace.tsx
  components/interview/feedback-panel.tsx
  __tests__/interview-schema.test.ts
  __tests__/interview-feedback-schema.test.ts
docs/database.md
TODO.md
```

---

## Tasks

### T1 — JOB-50 Session data model (`6.1`)

**Consumes:** `User`, existing profile fields  
**Produces:** Prisma models + migration; `lib/validation/interview.ts` (session/turn/questionSet schemas); schema tests; `docs/database.md` rows

**Interfaces:** schemas from spec §5 (`interviewSessionStatusSchema`, `questionSetSchema`, turn kinds).  
**Build order:** first.

### T2 — JOB-51 Question generation (`6.2`)

**Consumes:** T1, OpenRouter helpers, `requireUser` / profile  
**Produces:** `lib/ai/interview-questions.ts`; `startInterviewSessionAction` (create session + primary turns)

**Interfaces:** `generateInterviewQuestions`, `startInterviewSessionAction`.  
**Rules:** no invented resume facts in questions; role-aligned; 3–8 questions.

### T3 — JOB-52 Interview UI (`6.3`)

**Consumes:** T1–T2 actions  
**Produces:** `/interview` page + session list + workspace components  
**Rules:** replace placeholder; progress; abandon/complete; practice banner.

### T4 — JOB-53 Follow-up (`6.4`)

**Consumes:** T1–T3  
**Produces:** `lib/ai/interview-follow-up.ts`; wire into `submitInterviewAnswerAction`  
**Interfaces:** `decideFollowUp`; at most one follow-up per primary.

### T5 — JOB-55 Feedback schema (`6.6`)

**Consumes:** T1  
**Produces:** extend `lib/validation/interview.ts` with `interviewFeedbackSchema`; tests  
**Can start after T1** (parallel with T2–T4 if careful).

### T6 — JOB-56 Feedback service (`6.7`)

**Consumes:** T5  
**Produces:** `lib/ai/interview-feedback.ts`; persist feedback on turn after answer path settles  
**Interfaces:** `generateAnswerFeedback`.

### T7 — JOB-57 Feedback UI (`6.8`)

**Consumes:** T6  
**Produces:** `feedback-panel.tsx`; integrate into workspace + session complete summary.

### T8 — JOB-54 + JOB-58 Tests (`6.5`, `6.9`)

**Consumes:** all  
**Produces:** schema + safety-oriented unit tests (mocked AI); run full suite.

---

## Build order

```
T1 → T2 → T3 → T4
  └→ T5 → T6 → T7
T8 last (or expand tests as modules land)
```

Recommended commit sequence: T1, T2, T3, T4, T5, T6, T7, T8 (each TODO checkbox = commit).

## Risks

- Double AI latency (follow-up + feedback) — sequential is OK for MVP; show loading
- Prisma client stale after migrate — regenerate + restart note
- Do not touch cover-letter / assessment files
