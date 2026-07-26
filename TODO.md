# TODO — MVP Implementation Plan

**Last updated:** 26 July 2026 (Autopilot JOB-81–84)  
**Branch:** `feat/job-81-84-workspace-evidence-progress-cv`  
**Worktree:** `.worktree/autopilot-job-81-84`  
**Team:** [Job Prep Website](https://linear.app/job-prep-website) (`JOB`)  
**Project:** [MVP Roadmap — Personalized Job Preparation Plan](https://linear.app/job-prep-website/project/mvp-roadmap-personalized-job-preparation-plan-85cc64bbf88e)  
**Product promise:** Upload your CV, choose your target role, get a personalized job-preparation plan.

| Source | Link / path |
|--------|-------------|
| Linear project | https://linear.app/job-prep-website/project/mvp-roadmap-personalized-job-preparation-plan-85cc64bbf88e |
| Spec | `docs/specs/2026-07-26-job-81-84-workspace-evidence-progress-cv.md` |
| Plan | `docs/superpowers/plans/2026-07-26-job-81-84-implementation.md` |
| Phase archives | [`docs/iterations/archive/`](docs/iterations/archive/) |
| Subagent model | **grok-composer-2.5-fast** / orchestrator grok-4.5 |
| Out of agent scope | **JOB-79**, **JOB-80** |

---

## Active work — JOB-81–84 Autopilot

### T0 — Spec & tracking
- [x] Self-validated spec + lightweight plan (Accepted Autopilot grant)
- [ ] Commit spec/plan/TODO

### T1 — JOB-81 Application tracker
- [ ] Prisma `JobApplication` + migration (shared migration with T2/T4)
- [ ] Domain stage transitions + urgency helpers + zod
- [ ] Server actions (CRUD, stage move, archive, list workspace)
- [ ] UI `/applications` + middleware + dashboard link
- [ ] Unit tests (stage, urgency, schemas)
- [ ] Full suite + commit + git note

### T2 — JOB-82 Evidence & STAR
- [ ] Prisma `CareerEvidence` + `StarStory`
- [ ] Domain verification + STAR-from-confirmed gates + zod
- [ ] Server actions + UI `/evidence`
- [ ] Unit tests
- [ ] Full suite + commit + git note

### T3 — JOB-83 Progress & comparison
- [ ] Domain compare/trends/normalize + actions
- [ ] UI `/progress`
- [ ] Unit tests
- [ ] Full suite + commit + git note

### T4 — JOB-84 CV editor / versioning / PDF
- [ ] Prisma `CvDocument` + `CvVersion`
- [ ] Rewrite guards, versioning, PDF builder + zod
- [ ] Server actions + UI `/cv`
- [ ] Unit tests (guards, version lifecycle, PDF non-empty)
- [ ] Full suite + commit + git note

### T5 — Ship
- [ ] Push branch + notes; open PR; review workflow; Linear updates; JSON report

---

## Completed (archived)

- Phases 0–6 + JOB-13–17 + JOB-15 — see `docs/iterations/archive/`
