# TODO — MVP Implementation Plan

**Last updated:** 17 July 2026 (Wave 1 Autopilot — Phase 6 + parallel JOB-13 / JOB-16)  
**Team:** [Job Prep Website](https://linear.app/job-prep-website) (`JOB`)  
**Project:** [MVP Roadmap — Personalized Job Preparation Plan](https://linear.app/job-prep-website/project/mvp-roadmap-personalized-job-preparation-plan-85cc64bbf88e)  
**Product promise:** Upload your CV, choose your target role, get a personalized job-preparation plan.  
**This worktree:** Phase 6 only (`feat/phase-6-mock-interview`)

| Source | Link / path |
|--------|-------------|
| Linear project | https://linear.app/job-prep-website/project/mvp-roadmap-personalized-job-preparation-plan-85cc64bbf88e |
| Specs | `docs/specs/` |
| Architecture ADRs | [`docs/architecture.md`](docs/architecture.md) |
| Phase archives | [`docs/iterations/archive/`](docs/iterations/archive/) |
| Merged PRs | [#1](https://github.com/RavindraTarunokusumo/job-prep-website/pull/1)–[#5](https://github.com/RavindraTarunokusumo/job-prep-website/pull/5) (`3c929e1`) |
| Subagent model | **grok-4.5** (Composer 2.5 Fast not available in this environment) |
| AI | `web/lib/ai/config.ts` — OpenRouter primary + fallback |
| Out of agent scope | **JOB-79** (owned by another person — ignore) |
| Git notes | [`.github/git_notes_template.md`](.github/git_notes_template.md) |

### Linear milestones

| # | Milestone | Target | Progress |
|---|-----------|--------|----------|
| 1 | Profile & document intake | 2026-07-31 | **Done** (JOB-18, JOB-5, JOB-6) |
| 2 | Application readiness tools | 2026-08-31 | **JOB-7/8/9/10 done** (JOB-79 skip) |
| 3 | Interview practice & assessment | 2026-09-30 | 0% — JOB-11 → 12 → 13 → 14 |
| 4 | Report, launch polish & validation | 2026-10-31 | 0% — JOB-16 early, then 15/17 |

---

## Recommended next implementation order

Milestone 2 complete (except JOB-79 research). Next: **Milestone 3** practice tools. Agent Autopilot should **not** pick up JOB-79.

| Priority | When | Parent | Why |
|----------|------|--------|-----|
| **1 — next Autopilot** | Now | [JOB-11](https://linear.app/job-prep-website/issue/JOB-11/build-text-based-mock-interview-flow) | Starts Milestone 3; High; plan items already deep-link to interview stubs |
| **2** | With / right after 11 | [JOB-12](https://linear.app/job-prep-website/issue/JOB-12/create-interview-answer-feedback-and-scoring) | Feedback makes mock interviews useful; can ship as one phase with JOB-11 |
| **3** | After 11/12 | [JOB-13](https://linear.app/job-prep-website/issue/JOB-13/add-aptitude-and-psychometric-practice-module) | Medium; practice content, not AI-critical path first |
| **4** | Parallel / later | [JOB-16](https://linear.app/job-prep-website/issue/JOB-16/add-privacy-consent-and-ai-use-disclaimers) | Medium→High children; consent gates before more AI surfaces go live |
| **5** | Late M3 | [JOB-14](https://linear.app/job-prep-website/issue/JOB-14/set-up-human-made-interview-video-library) | Low; content/admin heavy |
| **6** | Milestone 4 | [JOB-15](https://linear.app/job-prep-website/issue/JOB-15/create-compiled-performance-report) | Needs prior workflow outputs (review, match, interview, assessments) |
| **7** | Milestone 4 | [JOB-17](https://linear.app/job-prep-website/issue/JOB-17/define-mvp-success-metrics-and-validation-dashboard) | High for launch validation; can start taxonomy (JOB-75) earlier if desired |

**Skip:** [JOB-79](https://linear.app/job-prep-website/issue/JOB-79/research-widespread-cvresume-formats-and-ats-requirements) (Todo, another owner).

### Phase status

| Phase | Status | Linear | Notes |
|-------|--------|--------|-------|
| **0–1** Foundation + landing | **Done** | JOB-18 | PR #1 |
| **2** Auth & onboarding | **Done** | JOB-5 | PR #2 |
| **3** CV upload & parsing | **Done** | JOB-6 | PR #3 |
| **4** Checker / JD match / plan | **Done** | JOB-7/8/10 | PR #4 `3f324f5` |
| **5** Cover letter & messages | **Done** | JOB-9 | PR #5 `3c929e1` · JOB-42…45 |
| **6** Text mock + feedback | **In progress (this branch)** | JOB-11 + JOB-12 | Spec `docs/specs/2026-07-17-mvp-phase-6-mock-interview-feedback.md` |
| **7** Assessments | Parallel worktree | JOB-13 | `.worktree/job-13-assessments` |
| **7b** Videos | Pending | JOB-14 | After Wave 1 |
| **8a** Privacy | Parallel worktree | JOB-16 | `.worktree/job-16-privacy` |
| **8b** Report / metrics | Pending | JOB-15/17 | After Wave 1 |

---

## Completed (archived)

- Phase 0–1 — `docs/iterations/archive/2026-07-15-phase-0-1-foundation-landing.md`
- Phase 2 — `docs/iterations/archive/2026-07-15-phase-2-auth-onboarding.md`
- Phase 3 — `docs/iterations/archive/2026-07-15-phase-3-cv-upload-parse.md` (PR #3)
- Phase 4 — `docs/iterations/archive/2026-07-16-phase-4-application-readiness.md` (PR #4 `3f324f5`)
- Phase 5 — `docs/iterations/archive/2026-07-17-phase-5-cover-letter-messages.md` (PR #5 `3c929e1`)

---

## Phase 6 — Text mock interview & answer feedback (**this branch**)

**Spec:** [docs/specs/2026-07-17-mvp-phase-6-mock-interview-feedback.md](docs/specs/2026-07-17-mvp-phase-6-mock-interview-feedback.md)  
**Plan:** [docs/superpowers/plans/2026-07-17-phase-6-mock-interview-feedback.md](docs/superpowers/plans/2026-07-17-phase-6-mock-interview-feedback.md)  
**Linear:** JOB-11 + JOB-12 · Children JOB-50…58  
**Model:** `grok-4.5` (Composer 2.5 unavailable)

### Tasks (JOB-11)

- [x] **6.1 JOB-50** Mock interview session data model
- [ ] **6.2 JOB-51** Role-based interview question generation
- [ ] **6.3 JOB-52** Text mock interview UI (`/interview`)
- [ ] **6.4 JOB-53** Contextual follow-up question logic
- [ ] **6.5 JOB-54** Mock interview session tests

### Tasks (JOB-12)

- [ ] **6.6 JOB-55** Interview feedback scoring schema
- [ ] **6.7 JOB-56** AI answer feedback service
- [ ] **6.8 JOB-57** Interview feedback results UI
- [ ] **6.9 JOB-58** Feedback tests and safety cases

### Exit criteria

- User can start a mock interview from plan, answer in text, get actionable feedback

---

## Parallel Wave 1 (other worktrees — do not implement here)

- **JOB-13** assessments → `.worktree/job-13-assessments` / `feat/job-13-assessments`
- **JOB-16** privacy/consent → `.worktree/job-16-privacy` / `feat/job-16-privacy`

## Deferred

- JOB-14 videos, JOB-15 report, JOB-17 metrics, JOB-79 (skip)
