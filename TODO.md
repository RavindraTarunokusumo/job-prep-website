# TODO — MVP Implementation Plan

**Last updated:** 27 July 2026 (Autopilot JOB-85…92 outcome-first wave)  
**Branch:** `feat/job-85-92-outcome-first`  
**Worktree:** `.worktree/autopilot-job-85-92`  
**Base:** `origin/main` @ `2fc20d1`  
**Team:** [Job Prep Website](https://linear.app/job-prep-website) (`JOB`)  
**Project:** [MVP Roadmap — Personalized Job Preparation Plan](https://linear.app/job-prep-website/project/mvp-roadmap-personalized-job-preparation-plan-85cc64bbf88e)

| Source | Link / path |
|--------|-------------|
| Specs | `docs/specs/2026-07-27-mvp-job-85-career-evidence-ontology.md` (+ per-issue as landed) |
| Plans | `docs/superpowers/plans/2026-07-27-job-85-career-evidence-ontology.md` |
| Ontology | `docs/ontology.md` |
| Out of agent scope | **JOB-79**, **JOB-80** (finance workbook) |
| Excluded (Done / prior PR) | **JOB-81…84** |

## Active work — dependency order

### JOB-85 — Shared career evidence ontology (In Progress)

- [x] **85.1** Spec + plan + ontology doc + TODO (this file)
- [x] **85.2** Prisma models + migration + database.md
- [x] **85.3** Validation schemas + normalize/retrieval/snapshot helpers
- [x] **85.4** Unit tests for schema, normalize, trusted retrieval
- [ ] **85.5** Full suite validate; commit(s) + notes; Linear evidence comment

### JOB-86 — Job requirement→evidence mapping (blocked by 85)

- [ ] Spec/plan → model + match service → UI hooks → tests

### JOB-87 — Application-specific readiness model (blocked by 86)

- [ ] Spec/plan → scoring + storage → UI → tests

### JOB-88 — Gap-driven mock interviews (blocked by 86)

- [ ] Spec/plan → question selection + session wiring → tests

### JOB-89 — Application outcomes & rejection learning

- [ ] Spec/plan → outcome model + capture UI + insights → tests

### JOB-90 — Model routing & cost telemetry

- [ ] Spec/plan → routing config + telemetry → tests

### JOB-91 — Subscription entitlements & Sprint Pass

- [ ] Spec/plan → plans/entitlements + checks (+ webhook stubs) → tests

### JOB-92 — End-to-end application journey tests (blocked by 86–89)

- [ ] Fixtures + journey tests + release checklist

## Completed (archived)

- Phases 0–6 / JOB-13…17 / JOB-15 — see `docs/iterations/archive/`
