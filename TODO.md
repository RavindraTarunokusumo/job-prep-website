# TODO — MVP Implementation Plan

**Last updated:** 18 July 2026 (JOB-15 Autopilot — performance report in progress)  
**Branch:** `feat/job-15-performance-report`  
**Worktree:** `.worktree/job-15-performance-report`  
**Team:** [Job Prep Website](https://linear.app/job-prep-website) (`JOB`)  
**Project:** [MVP Roadmap — Personalized Job Preparation Plan](https://linear.app/job-prep-website/project/mvp-roadmap-personalized-job-preparation-plan-85cc64bbf88e)  
**Product promise:** Upload your CV, choose your target role, get a personalized job-preparation plan.

| Source | Link / path |
|--------|-------------|
| Linear project | https://linear.app/job-prep-website/project/mvp-roadmap-personalized-job-preparation-plan-85cc64bbf88e |
| Specs | `docs/specs/` |
| Architecture ADRs | [`docs/architecture.md`](docs/architecture.md) |
| Phase archives | [`docs/iterations/archive/`](docs/iterations/archive/) |
| Merged PRs | [#1](https://github.com/RavindraTarunokusumo/job-prep-website/pull/1)–[#11](https://github.com/RavindraTarunokusumo/job-prep-website/pull/11) · latest Wave 2: **#9** `89465ac`, **#10** `5f27975`, **#11** `7781b5e` |
| Subagent model | **grok-4.5** (Composer 2.5 Fast not available in this environment) |
| AI | `web/lib/ai/config.ts` — OpenRouter primary + fallback |
| Out of agent scope | **JOB-79** (owned by another person — ignore) |
| Git notes | [`.github/git_notes_template.md`](.github/git_notes_template.md) |

### Linear milestones

| # | Milestone | Target | Progress |
|---|-----------|--------|----------|
| 1 | Profile & document intake | 2026-07-31 | **Done** |
| 2 | Application readiness tools | 2026-08-31 | **Done** (JOB-79 skip) |
| 3 | Interview practice & assessment | 2026-09-30 | **Done** (JOB-11/12/13/14) |
| 4 | Report, launch polish & validation | 2026-10-31 | **Partial** — JOB-16/17 done; **JOB-15 next** |

---

## Recommended next implementation order

Wave 2 complete (PRs #9–#11). Next: **JOB-15 compiled performance report** (Milestone 4). Skip JOB-79.

| Priority | When | Parent | Why |
|----------|------|--------|-----|
| **1 — next Autopilot** | Now | [JOB-15](https://linear.app/job-prep-website/issue/JOB-15/create-compiled-performance-report) | Aggregates review, match, interview, assessments into one readiness report |
| **2** | Optional polish | Remaining launch items | Any post-MVP hardening not covered by JOB-15 |

**Done recently:** Phase 6 complete (PR #9), JOB-14 videos (PR #10), JOB-17 metrics (PR #11), JOB-16 privacy (PR #8).  
**Skip:** [JOB-79](https://linear.app/job-prep-website/issue/JOB-79/research-widespread-cvresume-formats-and-ats-requirements).

### Phase status

| Phase | Status | Linear | Notes |
|-------|--------|--------|-------|
| **0–5** | **Done** | JOB-18…9 | PRs #1–#5 |
| **6** Text mock + feedback | **Done** | JOB-11 + JOB-12 | PR #6 + **#9** `89465ac` |
| **7** Assessments | **Done** | JOB-13 | PR #7 |
| **7b** Videos | **Done** | JOB-14 | PR #10 `5f27975` |
| **8a** Privacy | **Done** | JOB-16 | PR #8 |
| **8b** Metrics | **Done** | JOB-17 | PR #11 `7781b5e` |
| **8c** Report | **Next** | JOB-15 | Children JOB-67…70 |

---

## Completed (archived)

- Phase 0–1 — `docs/iterations/archive/2026-07-15-phase-0-1-foundation-landing.md`
- Phase 2 — `docs/iterations/archive/2026-07-15-phase-2-auth-onboarding.md`
- Phase 3 — `docs/iterations/archive/2026-07-15-phase-3-cv-upload-parse.md`
- Phase 4 — `docs/iterations/archive/2026-07-16-phase-4-application-readiness.md`
- Phase 5 — `docs/iterations/archive/2026-07-17-phase-5-cover-letter-messages.md`
- Phase 6 partial (JOB-50–52) — `docs/iterations/archive/2026-07-17-phase-6-mock-interview-partial.md` (PR #6)
- Phase 6 complete (JOB-53–58) — `docs/iterations/archive/2026-07-17-phase-6-interview-feedback-complete.md` (PR #9 `89465ac`)
- JOB-13 assessments — `docs/iterations/archive/2026-07-17-job-13-assessments.md` (PR #7)
- JOB-14 videos — `docs/iterations/archive/2026-07-17-job-14-video-library.md` (PR #10 `5f27975`)
- JOB-16 privacy — `docs/iterations/archive/2026-07-17-job-16-privacy-consent.md` (PR #8)
- JOB-17 metrics — `docs/iterations/archive/2026-07-17-job-17-metrics.md` (PR #11 `7781b5e`)

---

## Phase 8c — Compiled performance report (**next**)

**Linear parent:** [JOB-15](https://linear.app/job-prep-website/issue/JOB-15/create-compiled-performance-report) · Milestone 4 · Medium  
**Children:** JOB-67…70

### Tasks

- [ ] **15.1 JOB-67** Compiled performance report data model
- [ ] **15.2 JOB-68** Performance report generation service
- [ ] **15.3 JOB-69** Performance report UI (`/report`)
- [ ] **15.4 JOB-70** Report generation tests and QA scenarios

### Exit criteria

- User can generate a structured readiness report after core workflows
- Report is readable, evidence-based, export-ready; no hire predictions

---

## Deferred / out of scope

- **JOB-79** CV/ATS research (another owner — ignore)
