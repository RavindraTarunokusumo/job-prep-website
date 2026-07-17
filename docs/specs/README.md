# Specs workflow

Accepted implementation specs live in this directory.

## Naming

```
YYYY-MM-DD-<short-slug>.md
```

Example: `2026-07-15-mvp-phase-0-1-foundation-landing.md`

## Rules

1. A chat prompt is not implementation authority. Specs are.
2. Do not implement feature work from a draft with unresolved **blocking** open questions.
3. Any scope change updates the active accepted spec first, then `TODO.md`.
4. One Autopilot / PR cycle should reference a single primary active spec path (linked from `TODO.md`).

## Active specs

| Spec | Status | Scope |
|------|--------|-------|
| [2026-07-15-mvp-phase-0-1-foundation-landing.md](./2026-07-15-mvp-phase-0-1-foundation-landing.md) | **Accepted (merged PR #1)** | Phase 0 foundation + Phase 1 RoleReady landing (JOB-18) |
| [2026-07-15-mvp-phase-2-auth-onboarding.md](./2026-07-15-mvp-phase-2-auth-onboarding.md) | **Accepted (merged PR #2)** | Phase 2 Supabase Auth + career onboarding (JOB-5) |
| [2026-07-15-mvp-phase-3-cv-upload-parse.md](./2026-07-15-mvp-phase-3-cv-upload-parse.md) | **Accepted (merged PR #3)** | Phase 3 CV upload/parse (JOB-6); Supabase Storage + optional GLiNER |
| [2026-07-16-mvp-phase-4-application-readiness.md](./2026-07-16-mvp-phase-4-application-readiness.md) | **Accepted (merged PR #4)** | Phase 4 checker / JD match / prep plan (JOB-7/8/10) |
| [2026-07-17-mvp-phase-5-cover-letter-messages.md](./2026-07-17-mvp-phase-5-cover-letter-messages.md) | **Accepted (merged PR #5)** | Phase 5 cover letter & short messages (JOB-9 / JOB-42…45) |
| [2026-07-17-mvp-phase-6-mock-interview-feedback.md](./2026-07-17-mvp-phase-6-mock-interview-feedback.md) | **Accepted (Wave 1 Autopilot)** | Phase 6 mock interview + feedback (JOB-11/12) |
| [2026-07-17-mvp-job-13-assessments.md](./2026-07-17-mvp-job-13-assessments.md) | **Accepted (merged PR #7)** | JOB-13 assessments practice (JOB-59…62) |
| [2026-07-17-mvp-job-16-privacy-consent.md](./2026-07-17-mvp-job-16-privacy-consent.md) | **Accepted (merged PR #8)** | JOB-16 privacy/consent (JOB-71…74) |
