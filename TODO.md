# TODO — MVP Implementation Plan

**Last updated:** 17 July 2026 (Phase 5 Autopilot — JOB-9 cover letter & messages)  
**Team:** [Job Prep Website](https://linear.app/job-prep-website) (`JOB`)  
**Project:** [MVP Roadmap — Personalized Job Preparation Plan](https://linear.app/job-prep-website/project/mvp-roadmap-personalized-job-preparation-plan-85cc64bbf88e)  
**Product promise:** Upload your CV, choose your target role, get a personalized job-preparation plan.

| Source | Link / path |
|--------|-------------|
| Linear project | https://linear.app/job-prep-website/project/mvp-roadmap-personalized-job-preparation-plan-85cc64bbf88e |
| Active spec | [`docs/specs/2026-07-17-mvp-phase-5-cover-letter-messages.md`](docs/specs/2026-07-17-mvp-phase-5-cover-letter-messages.md) |
| Plan | [`docs/superpowers/plans/2026-07-17-phase-5-cover-letter-messages.md`](docs/superpowers/plans/2026-07-17-phase-5-cover-letter-messages.md) |
| Specs | `docs/specs/` |
| Architecture ADRs | [`docs/architecture.md`](docs/architecture.md) |
| Phase archives | [`docs/iterations/archive/`](docs/iterations/archive/) |
| Merged PRs | [#1](https://github.com/RavindraTarunokusumo/job-prep-website/pull/1)–[#4](https://github.com/RavindraTarunokusumo/job-prep-website/pull/4) (`3f324f5`) |
| Branch / worktree | `feat/phase-5-cover-letter-messages` @ `.worktree/job-9-cover-letter` |
| Subagent model | **Composer 2.5** via `grok-composer-2.5-fast` |
| AI | `web/lib/ai/config.ts` — OpenRouter primary + fallback |
| Out of agent scope | **JOB-79** (owned by another person — ignore) |
| Git notes | [`.github/git_notes_template.md`](.github/git_notes_template.md) |

### Linear milestones

| # | Milestone | Target | Progress |
|---|-----------|--------|----------|
| 1 | Profile & document intake | 2026-07-31 | **Done** (JOB-18, JOB-5, JOB-6) |
| 2 | Application readiness tools | 2026-08-31 | **JOB-7/8/10 done** · **JOB-9 in progress** (JOB-79 skip) |
| 3 | Interview practice & assessment | 2026-09-30 | 0% — JOB-11 → 12 → 13 → 14 |
| 4 | Report, launch polish & validation | 2026-10-31 | 0% — JOB-16 early, then 15/17 |

---

## Recommended next implementation order

Finish **Milestone 2**, then enter **Milestone 3** practice tools, then **Milestone 4** polish/report. Agent Autopilot should **not** pick up JOB-79.

| Priority | When | Parent | Why |
|----------|------|--------|-----|
| **1 — Autopilot active** | Now | [JOB-9](https://linear.app/job-prep-website/issue/JOB-9/build-cover-letter-and-application-message-generator) | Phase 5 cover letter & messages; reuses Phase 4 OpenRouter stack |
| **2** | After JOB-9 | [JOB-11](https://linear.app/job-prep-website/issue/JOB-11/build-text-based-mock-interview-flow) | Starts Milestone 3; High; plan items already deep-link to interview stubs |
| **3** | With / right after 11 | [JOB-12](https://linear.app/job-prep-website/issue/JOB-12/create-interview-answer-feedback-and-scoring) | Feedback makes mock interviews useful; can ship as one phase with JOB-11 |
| **4** | After 11/12 | [JOB-13](https://linear.app/job-prep-website/issue/JOB-13/add-aptitude-and-psychometric-practice-module) | Medium; practice content, not AI-critical path first |
| **5** | Parallel / later | [JOB-16](https://linear.app/job-prep-website/issue/JOB-16/add-privacy-consent-and-ai-use-disclaimers) | Medium→High children; consent gates before more AI surfaces go live |
| **6** | Late M3 | [JOB-14](https://linear.app/job-prep-website/issue/JOB-14/set-up-human-made-interview-video-library) | Low; content/admin heavy |
| **7** | Milestone 4 | [JOB-15](https://linear.app/job-prep-website/issue/JOB-15/create-compiled-performance-report) | Needs prior workflow outputs (review, match, interview, assessments) |
| **8** | Milestone 4 | [JOB-17](https://linear.app/job-prep-website/issue/JOB-17/define-mvp-success-metrics-and-validation-dashboard) | High for launch validation; can start taxonomy (JOB-75) earlier if desired |

**Skip:** [JOB-79](https://linear.app/job-prep-website/issue/JOB-79/research-widespread-cvresume-formats-and-ats-requirements) (Todo, due ~2026-07-18, another owner).

### Phase status

| Phase | Status | Linear | Notes |
|-------|--------|--------|-------|
| **0–1** Foundation + landing | **Done** | JOB-18 | PR #1 |
| **2** Auth & onboarding | **Done** | JOB-5 | PR #2 |
| **3** CV upload & parsing | **Done** | JOB-6 | PR #3 |
| **4** Checker / JD match / plan | **Done** | JOB-7/8/10 | PR #4 `3f324f5` |
| **5** Cover letter & messages | **In progress** | JOB-9 | Children JOB-42…45 · Autopilot |
| **6** Text mock + feedback | Pending | JOB-11 + JOB-12 | Children JOB-50…58 |
| **7** Assessments & videos | Pending | JOB-13 + JOB-14 | Children JOB-59…66 |
| **8** Report, privacy, metrics | Pending | JOB-15/16/17 | Children JOB-67…78 |

---

## Completed (archived)

- Phase 0–1 — `docs/iterations/archive/2026-07-15-phase-0-1-foundation-landing.md`
- Phase 2 — `docs/iterations/archive/2026-07-15-phase-2-auth-onboarding.md`
- Phase 3 — `docs/iterations/archive/2026-07-15-phase-3-cv-upload-parse.md` (PR #3)
- Phase 4 — `docs/iterations/archive/2026-07-16-phase-4-application-readiness.md` (PR #4 `3f324f5`)

---

## Phase 5 — Cover letter & application messages (**in progress**)

**Linear parent:** [JOB-9](https://linear.app/job-prep-website/issue/JOB-9/build-cover-letter-and-application-message-generator) · Milestone 2 · **High**  
**Spec:** [`docs/specs/2026-07-17-mvp-phase-5-cover-letter-messages.md`](docs/specs/2026-07-17-mvp-phase-5-cover-letter-messages.md)  
**Plan:** [`docs/superpowers/plans/2026-07-17-phase-5-cover-letter-messages.md`](docs/superpowers/plans/2026-07-17-phase-5-cover-letter-messages.md)  
**Depends on:** Phase 4 (profile + resume + JD context)  
**Reuse:** `web/lib/ai/config.ts`, OpenRouter `generateObjectWithFallback`, latest `JobDescription` / `ResumeDocument`

### Tasks

- [x] **5.1 JOB-42** Application draft data model (Prisma + ownership) — `95a8b26`
- [x] **5.2 JOB-43** AI cover letter generation (structured output, no invented experience) — `493b5d8`
- [ ] **5.3 JOB-44** Cover letter editor UI (`/cover-letter` — replace placeholder)
- [ ] **5.4 JOB-45** Short recruiter / application message generator

### Exit criteria

- User can generate, edit, and save a cover letter (and short message) grounded in CV + target JD

---

## Phase 6 — Text mock interview & answer feedback

**Linear parents:**  
- [JOB-11](https://linear.app/job-prep-website/issue/JOB-11/build-text-based-mock-interview-flow) · Milestone 3 · **High**  
- [JOB-12](https://linear.app/job-prep-website/issue/JOB-12/create-interview-answer-feedback-and-scoring) · **Low** but pair with 11  

### Tasks (JOB-11)

- [ ] **6.1 JOB-50** Mock interview session data model
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

## Phase 7 — Assessments & video resources

**Linear parents:**  
- [JOB-13](https://linear.app/job-prep-website/issue/JOB-13/add-aptitude-and-psychometric-practice-module) · Medium  
- [JOB-14](https://linear.app/job-prep-website/issue/JOB-14/set-up-human-made-interview-video-library) · Low  

### Tasks (JOB-13)

- [ ] **7.1 JOB-59** Assessment practice data model
- [ ] **7.2 JOB-60** Seed original MVP question bank
- [ ] **7.3 JOB-61** Assessment practice UI (`/assessments`)
- [ ] **7.4 JOB-62** Scoring and result summaries

### Tasks (JOB-14)

- [ ] **7.5 JOB-63** Video library data model
- [ ] **7.6 JOB-64** Browse / filter UI (`/videos`)
- [ ] **7.7 JOB-65** Admin workflow for adding videos
- [ ] **7.8 JOB-66** Connect recommendations to prep plan

---

## Phase 8 — Report, privacy, launch polish & validation

**Linear parents:**  
- [JOB-16](https://linear.app/job-prep-website/issue/JOB-16/add-privacy-consent-and-ai-use-disclaimers) · Medium (do **early** for trust)  
- [JOB-15](https://linear.app/job-prep-website/issue/JOB-15/create-compiled-performance-report) · Medium  
- [JOB-17](https://linear.app/job-prep-website/issue/JOB-17/define-mvp-success-metrics-and-validation-dashboard) · High  

### Tasks (JOB-16 — privacy)

- [ ] **8.1 JOB-71** Draft privacy / AI-use copy for core flows
- [ ] **8.2 JOB-72** Consent gates on sensitive workflows
- [ ] **8.3 JOB-73** User data deletion / export request path
- [ ] **8.4 JOB-74** Privacy and disclaimer QA checklist

### Tasks (JOB-15 — report)

- [ ] **8.5 JOB-67** Compiled performance report data model
- [ ] **8.6 JOB-68** Report generation service
- [ ] **8.7 JOB-69** Report UI (`/report`)
- [ ] **8.8 JOB-70** Report tests and QA scenarios

### Tasks (JOB-17 — metrics)

- [ ] **8.9 JOB-75** Analytics event taxonomy
- [ ] **8.10 JOB-76** Analytics tracking hooks (no raw CV/JD text)
- [ ] **8.11 JOB-77** Internal validation dashboard view
- [ ] **8.12 JOB-78** Feedback prompts after core workflows

### Exit criteria

- Candidate can go landing → plan → materials/practice → summary report  
- Consent/disclaimers present on AI and document flows  
- Core funnel events measurable without leaking sensitive content
