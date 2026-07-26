# TODO — MVP Implementation Plan

**Last updated:** 26 July 2026 (Autopilot JOB-81–84)  
**Branch:** `feat/job-81-84-workspace-evidence-progress-cv`  
**Worktree:** `.worktree/autopilot-job-81-84`  
**Team:** [Job Prep Website](https://linear.app/job-prep-website) (`JOB`)  
**Project:** [MVP Roadmap — Personalized Job Preparation Plan](https://linear.app/job-prep-website/project/mvp-roadmap-personalized-job-preparation-plan-85cc64bbf88e)

| Source | Link / path |
|--------|-------------|
| Spec | `docs/specs/2026-07-26-job-81-84-workspace-evidence-progress-cv.md` |
| Plan | `docs/superpowers/plans/2026-07-26-job-81-84-implementation.md` |

---

## Active work — JOB-81–84 Autopilot

### T0 — Spec & tracking
- [x] Self-validated spec + lightweight plan (Accepted Autopilot grant)
- [x] Commit spec/plan/TODO

### T1 — JOB-81 Application tracker
- [x] Prisma `JobApplication` + migration (shared migration with T2/T4)
- [x] Domain stage transitions + urgency helpers + zod
- [x] Server actions (CRUD, stage move, archive, list workspace)
- [x] UI `/applications` + middleware + dashboard link
- [x] Unit tests (stage, urgency, schemas)
- [x] Full suite + commit + git note

### T2 — JOB-82 Evidence & STAR
- [x] Prisma `CareerEvidence` + `StarStory`
- [x] Domain verification + STAR-from-confirmed gates + zod
- [x] Server actions + UI `/evidence`
- [x] Unit tests
- [x] Full suite + commit + git note

### T3 — JOB-83 Progress & comparison
- [x] Domain compare/trends/normalize + actions
- [x] UI `/progress`
- [x] Unit tests
- [x] Full suite + commit + git note

### T4 — JOB-84 CV editor / versioning / PDF
- [x] Prisma `CvDocument` + `CvVersion`
- [x] Rewrite guards, versioning, PDF builder + zod
- [x] Server actions + UI `/cv`
- [x] Unit tests (guards, version lifecycle, PDF non-empty)
- [x] Full suite + commit + git note

### T5 — Ship
- [ ] Push branch + notes; open PR; review workflow; Linear updates; JSON report

---

## Completed (archived)

- Phases 0–6 + JOB-13–17 + JOB-15 — see `docs/iterations/archive/`
