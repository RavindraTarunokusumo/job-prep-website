# Wave 2 addendum — Interview follow-up & feedback (Phase 6 remainder)

| Field | Value |
|-------|--------|
| **Status** | Accepted (Autopilot — Wave 2) |
| **Date** | 2026-07-17 |
| **Branch** | `feat/wave2-interview-feedback` |
| **Worktree** | `.worktree/wave2-interview-feedback` |
| **Base spec** | [2026-07-17-mvp-phase-6-mock-interview-feedback.md](./2026-07-17-mvp-phase-6-mock-interview-feedback.md) |
| **Linear** | JOB-53, JOB-54, JOB-12 (JOB-55…58) |

## Scope (this wave)

Implements T4–T8 from the base Phase 6 plan against existing Wave 1 landing:

- Session models, question generation, and interview UI already on main / branch base
- Submit path previously saved answers only (no follow-up, no feedback)

### Deliverables

1. **JOB-53** — `lib/ai/interview-follow-up.ts` (`decideFollowUp`); wire into `submitInterviewAnswerAction` with **at most one** `follow_up` child per primary (`parentTurnId`, orderIndex insert + shift).
2. **JOB-55** — `interviewFeedbackSchema` + parse/safeParse helpers + hireability phrase helpers in `lib/validation/interview.ts`.
3. **JOB-56** — `lib/ai/interview-feedback.ts` (`generateAnswerFeedback` via `generateObjectWithFallback`); persist `feedback` + `feedbackModel` on the **primary** turn after the unit settles (no follow-up, or after follow-up answer).
4. **JOB-57** — `components/interview/feedback-panel.tsx` integrated into active/complete session UI; coaching-only label.
5. **JOB-54 / JOB-58** — Schema, ordering, safety, and mocked AI unit tests.

## Behavior notes

- AI paths call `requireAiConsent` when present. Missing consent: start is blocked; submit still saves the answer but skips follow-up/feedback.
- Follow-up / feedback AI failures do not roll back a saved answer (graceful degrade).
- Feedback is coaching only: no hire/no-hire labels in prompts; schema does not ban phrases (helpers + tests cover safety).
- Reuse OpenRouter stack; no hard-coded model ids.

## Success criteria

- [x] Contextual follow-up (max 1 per primary) after vague answers
- [x] Per-primary coaching feedback after unit settles
- [x] Feedback UI on workspace + completed session summary
- [x] Unit tests for schemas/safety + mocked AI
- [x] Full `web/` lint, typecheck, test, build
