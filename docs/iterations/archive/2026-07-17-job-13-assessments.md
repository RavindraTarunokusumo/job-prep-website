# Archive — JOB-13 aptitude & psychometric practice module

| Field | Value |
|-------|-------|
| **Merged** | 2026-07-17 |
| **PR** | https://github.com/RavindraTarunokusumo/job-prep-website/pull/7 |
| **Merge commit** | `8f9f3d433a12aed813e5c1467963436d0d9347ae` |
| **Branch** | `feat/job-13-assessments` |
| **Spec** | `docs/specs/2026-07-17-mvp-job-13-assessments.md` |
| **Plan** | `docs/superpowers/plans/2026-07-17-job-13-assessments.md` |
| **Linear parent** | JOB-13 |
| **Children** | JOB-59, JOB-60, JOB-61, JOB-62 |
| **Worktree** | `.worktree/job-13-assessments` |

## Feature commits

| Hash | Subject |
|------|---------|
| `31426d6` | docs: accept JOB-13 assessments practice spec (Wave 1) |
| `247a00f` | feat(db): assessment practice data models (JOB-59) |
| `8d371c9` | feat(assessments): seed original MVP question bank (JOB-60) |
| `b6c3e4b` | feat(ui): assessment practice flow and scoring (JOB-61, JOB-62) |
| `7ea10e6` | fix(assessments): hide solutions until answered; lock re-answers |
| `7e0aeca` | merge: main (PR #8 privacy) into feat/job-13-assessments |

## Completed phase section (snapshot)

## JOB-13 — Aptitude & psychometric practice

**Linear parent:** JOB-13 · Milestone 3 · Medium  
**Note:** No AI required for MVP scoring; static original question bank

### Tasks

- [x] **JOB-59** Assessment practice data models — `247a00f`
- [x] **JOB-60** Seed original MVP question bank — `8d371c9`
- [x] **JOB-61 / JOB-62** Assessment practice flow and scoring UI — `b6c3e4b`
- Review fix: hide solutions until answered; lock re-answers — `7ea10e6`
- Integration merge: main (PR #8 privacy) — `7e0aeca`

### Outcomes

- Prisma models for categories, questions, attempts, and answers
- Seeded numerical / verbal / logical practice content (original MVP bank)
- Authenticated practice UI with scoring and non-clinical framing
- Solutions gated until answered; re-answers locked after submit

### Exit criteria

- Onboarded users can practice aptitude-style questions with explanations
- Content framed as preparation only — not clinical assessment or employment screening

### Merge ID

Wave 1 Autopilot merge: PR #7 → `8f9f3d433a12aed813e5c1467963436d0d9347ae`

### Open follow-ups

- Expand question bank / categories as content work (not blocking)
- Include assessment outcomes in compiled performance report (JOB-15)
