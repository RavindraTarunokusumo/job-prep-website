# TODO — MVP Implementation Plan

**Last updated:** 27 July 2026 (Autopilot JOB-85…92)  
**Branch:** `feat/job-85-92-outcome-first`  
**Worktree:** `.worktree/autopilot-job-85-92`  
**Base:** `origin/main` @ `2fc20d1`

## Active work

PR open for JOB-85…92 domain contracts + models. Not Done until merged.

### JOB-85 — Shared career evidence ontology

- [x] Spec/plan/ontology docs
- [x] Prisma models + migration
- [x] Validation + retrieval helpers
- [x] Unit tests + full suite

### JOB-86 — Requirement→evidence mapping

- [x] Spec/plan
- [x] RequirementEvidenceMatch model
- [x] Deterministic mapper + tests

### JOB-87 — Application readiness model

- [x] ApplicationReadinessScore + computeApplicationReadiness + tests

### JOB-88 — Gap-driven mock interviews

- [x] generateGapDrivenQuestions + rehearsal plan + tests

### JOB-89 — Application outcomes

- [x] ApplicationOutcome model + insights + tests

### JOB-90 — Model routing & cost telemetry

- [x] routing helpers + AiUsageEvent model + tests

### JOB-91 — Subscription entitlements

- [x] Plan/Subscription/Entitlement/Billing models + checkEntitlement + tests

### JOB-92 — E2E journey tests

- [x] Fixture-driven journey covering ontology→mapping→readiness→interview→outcomes

## Out of agent scope

- JOB-79, JOB-80

## Excluded

- JOB-81…84 (Done / PR #13)
