# TODO — MVP Implementation Plan

**Last updated:** 16 July 2026 (post-PR #4)  
**Team:** [Job Prep Website](https://linear.app/job-prep-website) (`JOB`)  
**Project:** [MVP Roadmap — Personalized Job Preparation Plan](https://linear.app/job-prep-website/project/mvp-roadmap-personalized-job-preparation-plan-85cc64bbf88e)  
**Product promise:** Upload your CV, choose your target role, get a personalized job-preparation plan.

| Source | Link / path |
|--------|-------------|
| Linear project | https://linear.app/job-prep-website/project/mvp-roadmap-personalized-job-preparation-plan-85cc64bbf88e |
| Specs | `docs/specs/` |
| Architecture ADRs | [`docs/architecture.md`](docs/architecture.md) |
| Phase archives | [`docs/iterations/archive/`](docs/iterations/archive/) |
| Merged PRs | [#1](https://github.com/RavindraTarunokusumo/job-prep-website/pull/1), [#2](https://github.com/RavindraTarunokusumo/job-prep-website/pull/2), [#3](https://github.com/RavindraTarunokusumo/job-prep-website/pull/3), [#4](https://github.com/RavindraTarunokusumo/job-prep-website/pull/4) (`3f324f5`) |
| Subagent model | **Composer 2.5** via `grok-composer-2.5-fast` |
| AI | `web/lib/ai/config.ts` — OpenRouter primary `tencent/hy3:free`, fallback `nvidia/nemotron-3-ultra-550b-a55b:free` |
| Out of agent scope | **JOB-79** (owned by another person — ignore) |
| Git notes | [`.github/git_notes_template.md`](.github/git_notes_template.md) |

### Linear milestones

| # | Milestone | Target | Progress |
|---|-----------|--------|----------|
| 1 | Profile & document intake | 2026-07-31 | **JOB-18, JOB-5, JOB-6 done** |
| 2 | Application readiness tools | 2026-08-31 | **JOB-7/8/10 done** (JOB-79 still open, out of scope) |
| 3 | Interview practice & assessment | 2026-09-30 | 0% |
| 4 | Report, launch polish & validation | 2026-10-31 | 0% |

### Phase status

| Phase | Status | Notes |
|-------|--------|-------|
| **0–1** Foundation + landing | **Done** | PR #1 |
| **2** Auth & onboarding (JOB-5) | **Done** | PR #2 |
| **3** CV upload & parsing (JOB-6) | **Done** | PR #3 |
| **4** Application readiness (JOB-7/8/10) | **Done** | PR #4 `3f324f5` |
| **5** Cover letter & messages (JOB-9) | **Next** | Depends on Phase 4 |
| **6–8** | Pending | See below |

**Next cycle candidate:** Phase 5 (JOB-9 cover letter / application messages). JOB-79 remains skipped for agent Autopilot.

---

## Completed (archived)

- Phase 0–1 — `docs/iterations/archive/2026-07-15-phase-0-1-foundation-landing.md`
- Phase 2 — `docs/iterations/archive/2026-07-15-phase-2-auth-onboarding.md`
- Phase 3 — `docs/iterations/archive/2026-07-15-phase-3-cv-upload-parse.md` (PR #3)
- Phase 4 — `docs/iterations/archive/2026-07-16-phase-4-application-readiness.md` (PR #4 `3f324f5`)

---

## Phase 5 — Cover letter & application messages

**Linear parent:** [JOB-9](https://linear.app/job-prep-website/issue/JOB-9/build-cover-letter-and-application-message-generator) · Milestone 2 · High  
**Depends on:** Phase 4 (profile + JD context)

### Tasks

- [ ] **5.1 JOB-42** Application draft data model
- [ ] **5.2 JOB-43** AI cover letter generation
- [ ] **5.3 JOB-44** Cover letter editor UI
- [ ] **5.4 JOB-45** Short recruiter / application message generator

### Exit criteria

- User can generate, edit, and save a cover letter (and short message) grounded in CV + target JD

---

## Phase 6 — Text mock interview & answer feedback

**Linear parents:**  
- [JOB-11](https://linear.app/job-prep-website/issue/JOB-11/build-text-based-mock-interview-flow) · High  
- [JOB-12](https://linear.app/job-prep-website/issue/JOB-12/create-interview-answer-feedback-and-scoring) · Low (but needed for useful practice)

### Tasks

- [ ] Text mock interview flow
- [ ] Answer feedback and scoring

### Exit criteria

- User can run a text mock interview and receive structured feedback

---

## Phase 7 — Assessments & video resources

**Linear parents:** assessments / video lesson issues on Milestone 3 (see Linear project)

### Tasks

- [ ] Psychometric / aptitude practice hooks
- [ ] Video lesson recommendations (can be curated links at MVP)

---

## Phase 8 — Report, launch polish & validation

**Linear parents:** Milestone 4 issues

### Tasks

- [ ] Exportable readiness report
- [ ] Landing ↔ product consistency pass
- [ ] End-to-end validation checklist

### Exit criteria

- Candidate can go from landing → plan → practice tools → summary report
