# TODO — MVP Implementation Plan

**Synced / planned:** 15 July 2026  
**Team:** [Job Prep Website](https://linear.app/job-prep-website) (`JOB`)  
**Project:** [MVP Roadmap — Personalized Job Preparation Plan](https://linear.app/job-prep-website/project/mvp-roadmap-personalized-job-preparation-plan-85cc64bbf88e)  
**Status:** Planned · High priority · Target window Jul–Oct 2026  
**Product promise:** Upload your CV, choose a target role, get a personalized job-preparation plan.

| Source | Link / path |
|--------|-------------|
| Linear project | https://linear.app/job-prep-website/project/mvp-roadmap-personalized-job-preparation-plan-85cc64bbf88e |
| Business ideation | https://docs.google.com/spreadsheets/d/1YxbmFESdd0LmI9zHTcMNC0yvs9s0VBfUYeX_7EoZ8Zk |
| Landing reference design | [`RoleReady Landing.dc.html`](RoleReady%20Landing.dc.html) |
| Active accepted specs | `docs/specs/2026-07-15-mvp-phase-0-1-foundation-landing.md` |
| Active Autopilot cycle | **Phase 0 → 1 only** (foundation + RoleReady landing / JOB-18). Branch: `feat/phase-0-1-foundation-landing` |
| Subagent model | **Composer 2.5** via `grok-composer-2.5-fast` |
| Out of agent scope | **JOB-79** (owned by another person — ignore) |
| Repo state | Phase 0–1 implemented on `feat/phase-0-1-foundation-landing` (pending merge) |

### Linear milestones (source of truth for delivery)

| # | Milestone | Target | Progress |
|---|-----------|--------|----------|
| 1 | Profile & document intake | 2026-07-31 | 0% |
| 2 | Application readiness tools | 2026-08-31 | 0% |
| 3 | Interview practice & assessment | 2026-09-30 | 0% |
| 4 | Report, launch polish & validation | 2026-10-31 | 0% |

### Issue snapshot (Linear, 15 Jul 2026)

- **75 issues** total · **14 parents** · **61 children**
- **Todo:** 16 · **Backlog:** 59 · **In Progress / Done:** 0
- Active pipeline parents: **JOB-18** (Urgent), **JOB-5**, **JOB-6**
- **JOB-79** ATS research is assigned elsewhere — **not** in this Autopilot cycle

---

## How this plan is phased

Phases are sized so each can be completed in **one or two focused agent sessions** without overflowing context. Do **not** start a later phase until the prior phase’s exit criteria pass.

| Phase | Session budget | Linear map | Outcome |
|-------|----------------|------------|---------|
| **0** Spec & app foundation | 1 session | Prerequisite (no issue yet) | Accepted specs + runnable Next.js shell |
| **1** IA, design system & landing | 1 session | **JOB-18** + UI from design | Marketing site + route map + tokens |
| **2** Auth & onboarding | 1–2 sessions | **JOB-5** (JOB-19…24) | Signed-in user with career profile |
| **3** CV upload & parsing | 1–2 sessions | **JOB-6** (JOB-25…31) | Upload → parse → review/correct |
| **4** Application readiness core | 2–3 sessions | **JOB-7, 8, 10** (exclude JOB-79) | Checker, JD match, prep plan (core loop) |
| **5** Cover letters & messages | 1 session | **JOB-9** | Drafts tied to role/JD |
| **6** Mock interview + feedback | 2 sessions | **JOB-11, 12** | Text practice + scores |
| **7** Assessments & video library | 1–2 sessions | **JOB-13, 14** | Practice sets + curated videos |
| **8** Report, privacy, analytics | 2 sessions | **JOB-15, 16, 17** | Report + consent + validation |

**This Autopilot cycle:** Phase 0 → 1 only (specs, `web/` scaffold, RoleReady landing, route placeholders).  
**Next cycles:** Phase 2 → 3 (needs Supabase / Blob keys — ask user before starting).  
**Later cycles:** Phase 4+ (promote Linear parents from Backlog → Todo when starting).

**Workflow reminder (AGENTS.md):** each phase needs an accepted spec under `docs/specs/`, tasks logged here before edits, junior handoffs for implementation sub-items, per-sub-item commits, full lint/typecheck/tests before commit.

---

## Phase 0 — Spec & application foundation

**Goal:** Unblock all feature work. Repo today has agent docs only; create the product app skeleton and accepted specs.

**Why first:** Linear issues assume Next.js, Prisma, Supabase Auth, Vercel Blob, Vercel AI SDK, shadcn/ui — none of that exists in-tree yet.

### Tasks

- [x] **0.1** Write accepted product/architecture specs under `docs/specs/` — `1738f30`
  - MVP product scope (core loop, out-of-scope list from Linear project description)
  - Tech stack & repo layout (`web/` app, Prisma, env vars)
  - Information architecture / route map (feeds Phase 1 / JOB-18)
  - Design system notes extracted from landing reference (see Phase 1)
- [x] **0.2** Scaffold Next.js (App Router) + TypeScript in `web/` — `9d2e17b`
  - Tailwind CSS, ESLint, Prettier (align with `.pre-commit-config.yaml`)
  - shadcn/ui init + base components used by landing (Button, Card, Dialog, Input, etc.)
- [x] **0.3** Add Prisma + PostgreSQL project config (schema stub, migrate workflow) — `9d2e17b`
- [x] **0.4** Env / secrets template (`.env.example`): Supabase, Blob, AI provider, DB URL — `9d2e17b`
- [x] **0.5** Minimal CI scripts: `lint`, `typecheck`, `test` (even if empty suite) — `9d2e17b`
- [x] **0.6** Update `README.md` with run instructions once scaffold lands — `43cdad1`

### Exit criteria

- `web/` boots locally (`npm run dev`)
- Specs accepted under `docs/specs/` (no blocking open questions for Phases 1–3)
- Pre-commit / lint / typecheck paths are defined for frontend work

### Out of scope for Phase 0

Feature UIs, auth product flows, AI calls, real uploads.

---

## Phase 1 — Information architecture, design system & RoleReady landing

**Linear:** [JOB-18](https://linear.app/job-prep-website/issue/JOB-18/create-a-wireframe-for-the-website) — *Create a wireframe for the website* · **Urgent** · Milestone 1  
**UI source of truth:** [`RoleReady Landing.dc.html`](RoleReady%20Landing.dc.html)

### Design tokens to implement (from reference)

| Token | Value / note |
|-------|----------------|
| Fonts | **Plus Jakarta Sans** (UI), **IBM Plex Mono** (labels/meta) |
| Brand gradient | `#2E5BF0` → `#7B3FE4` |
| Text | `#14161F` primary, `#565E73` / `#616984` muted |
| Surfaces | Page `#F5F6FB`, cards white, soft borders `rgba(24,30,54,.08)` |
| Accents | Success `#16A374`, warn `#E0902B`, danger `#E5484D` |
| Radius | ~12–24px cards; pills 999px; CTA ~13–14px |
| Motion | rise / fade / float keyframes; sticky blurred nav |

### Landing sections to ship (1:1 structure with design)

| Section | Anchor / notes |
|---------|----------------|
| Sticky nav | Logo Role**Ready**, Features, How it works, Pricing, Sign in, Start free trial |
| Hero | Headline + dual CTA + trust chips + product preview card (readiness ring, CV/match bars, strengths/gaps, next actions) |
| Trust bar | “Trusted by applicants at …” logos |
| How it works `#how` | 4 steps: Upload → Target → Plan → Track |
| Features bento `#features` | CV checker, JD match, mock interview, assessments, cover letter, prep plan cards |
| Dashboard preview `#resources` | One-workspace mock (readiness, plan, strengths, practice, recent results) |
| Why RoleReady | Dark differentiation band (grounded, editable AI, private, practice-not-tests) |
| Pricing / CTA `#pricing` | Final CTA (trial copy; billing can stay mock for MVP) |
| Footer | Product / Resources / Company / Legal |
| Trial modal | 7-day free trial dialog (wire CTAs to auth in Phase 2) |

### Tasks

- [x] **1.1 JOB-18** Document IA: map every MVP feature → route/section + primary user stories — accepted in Phase 0–1 spec; shells in `62a7f54`
  - Public routes: `/`, `/login`, `/signup`, `/privacy`, `/terms`, `/ai-use`
  - App routes (placeholders): `/onboarding`, `/dashboard`, `/resume`, `/resume/review`, `/jobs/match`, `/plan`, `/cover-letter`, `/interview`, `/assessments`, `/videos`, `/report`, `/settings`
- [x] **1.2** Extract shared design tokens into Tailwind theme / CSS variables — `62a7f54`
- [x] **1.3** Implement landing page in Next.js matching reference layout and visual language — `62a7f54`
  - Prefer composable React sections over pasting the whole HTML file
  - Modal, sticky nav scroll state, hover affordances as in design
- [x] **1.4** Placeholder authenticated shells (empty states + nav) for app routes from 1.1 — `62a7f54`
- [x] **1.5** Wire primary CTAs: “Start free trial” / “Build my plan” → signup (or modal → signup) — `62a7f54`
- [x] **1.6** Responsive pass + basic a11y (focus rings already in design; keyboard modal close) — `62a7f54`

### Exit criteria

- `/` matches RoleReady reference at a high visual fidelity on desktop + mobile
- Route map + user stories documented (satisfies JOB-18 intent)
- Placeholder pages exist so later features have a home

### Out of scope for Phase 1

Real auth, data, AI, or dashboard live data (static mock content OK).

---

## Phase 2 — Auth & career goal onboarding

**Linear parent:** [JOB-5](https://linear.app/job-prep-website/issue/JOB-5/build-user-onboarding-and-career-goal-intake) · Milestone 1 · High  
**Depends on:** Phase 0–1

### Capture fields (from JOB-5)

Education · experience level · target role · target industry · preferred location/region · job-search status · career-switch intent · skills & certifications

### Tasks

- [ ] **2.1 JOB-19** Design onboarding / profile data model in Prisma
- [ ] **2.2 JOB-20** Implement Supabase Auth session handling (middleware, client/server helpers)
- [ ] **2.3 JOB-21** Build onboarding form UI (shadcn/ui; brand tokens from Phase 1)
- [ ] **2.4 JOB-22** Create onboarding save/update server actions
- [ ] **2.5 JOB-23** Onboarding completion gate + profile edit states
- [ ] **2.6 JOB-24** Validation and tests

### Exit criteria

- New user can sign up/in, complete onboarding in one guided flow, land on dashboard
- Profile is persisted and editable
- Unauthenticated users cannot reach app routes

---

## Phase 3 — CV / resume upload & parsing

**Linear parent:** [JOB-6](https://linear.app/job-prep-website/issue/JOB-6/implement-cvresume-upload-and-parsing) · Milestone 1 · High  
**Depends on:** Phase 2 (authenticated user + profile)

### Tasks

- [ ] **3.1 JOB-25** Resume document model + upload metadata schema
- [ ] **3.2 JOB-26** Upload UI + client file validation (PDF/DOCX, size limits)
- [ ] **3.3 JOB-27** Vercel Blob upload flow
- [ ] **3.4 JOB-28** Extract text from PDF and DOCX
- [ ] **3.5 JOB-29** Parse sections into editable structured data *(currently Backlog — promote when starting)*
- [ ] **3.6 JOB-30** Parsed resume review & correction screen
- [ ] **3.7 JOB-31** Upload/parsing tests + failure handling

### Exit criteria

- User uploads CV → text extracted → structured sections shown → user can correct and save
- Failures (bad type, corrupt file, parse fail) surface clear errors

### Milestone 1 gate

Phases 0–3 complete Linear Milestone **1. Profile & document intake** (JOB-18, JOB-5, JOB-6).

---

## Phase 4 — Application readiness core (checker, JD match, prep plan)

**Linear parents:**  
- [JOB-7](https://linear.app/job-prep-website/issue/JOB-7/build-cvresume-checker-and-improvement-workflow) · High  
- [JOB-8](https://linear.app/job-prep-website/issue/JOB-8/create-job-description-match-analyzer) · High  
- [JOB-10](https://linear.app/job-prep-website/issue/JOB-10/generate-personalized-job-preparation-plan) · High  

**Milestone 2.** Depends on Phase 3.  
**UI notes:** Feature bento + dashboard cards in the landing design preview the target UX for review score, match %, strengths/gaps, and plan checklist.

### Recommended sub-order (minimize rework)

1. **Research** → 2. **Resume checker** → 3. **JD match** → 4. **Prep plan** (plan consumes the first three)

### Tasks

**Research**
- [ ] **4.0 JOB-79** Research widespread CV formats & ATS requirements — **owned by another person; skip in agent Autopilot**

**CV / resume checker (JOB-7)**
- [ ] **4.1 JOB-32** Resume review result schema
- [ ] **4.2 JOB-33** AI resume review (Vercel AI SDK)
- [ ] **4.3 JOB-34** Resume review dashboard UI (highlights + scores à la landing)
- [ ] **4.4 JOB-35** Bullet rewrite workflow (editable; no invented experience)
- [ ] **4.5 JOB-36** Review tests + prompt regression cases

**Job-description match (JOB-8)**
- [ ] **4.6 JOB-37** Job description analysis data model
- [ ] **4.7 JOB-38** Paste / analyze UI
- [ ] **4.8 JOB-39** AI requirement extraction
- [ ] **4.9 JOB-40** Resume-to-job match scoring
- [ ] **4.10 JOB-41** Match results UI (matched / missing chips like landing)

**Personalized prep plan (JOB-10) — core product promise**
- [ ] **4.11 JOB-46** Prep plan data model
- [ ] **4.12 JOB-47** Prep plan generation service
- [ ] **4.13 JOB-48** Prep plan dashboard UI (checklist + priority; landing “Current plan” card)
- [ ] **4.14 JOB-49** Refresh & dependency rules (e.g. re-run after new CV review / JD)

### Exit criteria

- User with profile + CV can run checker, paste a JD, and receive a prioritized prep plan
- Outputs are specific and editable; no generic-only advice
- Plan items link to downstream tools (even if later tools are still stubs)

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

**Milestone 3.** Depends on Phase 2 (+ role/JD from earlier phases).

### Tasks

**Session flow (JOB-11)**
- [ ] **6.1 JOB-50** Mock interview session data model
- [ ] **6.2 JOB-51** Role-based question generation
- [ ] **6.3 JOB-52** Text mock interview UI
- [ ] **6.4 JOB-53** Contextual follow-up questions
- [ ] **6.5 JOB-54** Session tests

**Feedback (JOB-12)**
- [ ] **6.6 JOB-55** Feedback scoring schema
- [ ] **6.7 JOB-56** AI answer feedback service
- [ ] **6.8 JOB-57** Feedback results UI
- [ ] **6.9 JOB-58** Feedback tests + safety cases

### Exit criteria

- User can complete a text mock interview and receive structured, non-hiring-decision feedback
- Sessions feed prep plan / later report

---

## Phase 7 — Assessments & interview video library

**Linear parents:**  
- [JOB-13](https://linear.app/job-prep-website/issue/JOB-13/add-aptitude-and-psychometric-practice-module) · Medium  
- [JOB-14](https://linear.app/job-prep-website/issue/JOB-14/set-up-human-made-interview-video-library) · Low  

**Milestone 3.** Can partially parallelize after Phase 6 starts; video library is lower priority.

### Tasks

**Assessments (JOB-13)** — label **practice / non-clinical** everywhere
- [ ] **7.1 JOB-59** Assessment practice data model
- [ ] **7.2 JOB-60** Seed MVP question bank
- [ ] **7.3 JOB-61** Assessment practice UI
- [ ] **7.4 JOB-62** Scoring + result summaries

**Video library (JOB-14)** — human-made only (no AI video/audio in MVP)
- [ ] **7.5 JOB-63** Video library data model
- [ ] **7.6 JOB-64** Browse / filter UI
- [ ] **7.7 JOB-65** Admin workflow to add lessons
- [ ] **7.8 JOB-66** Connect recommendations to prep plan

### Exit criteria

- User can complete at least one aptitude practice set and browse curated videos
- Prep plan can recommend both when data exists

---

## Phase 8 — Performance report, privacy, analytics & launch polish

**Linear parents:**  
- [JOB-15](https://linear.app/job-prep-website/issue/JOB-15/create-compiled-performance-report) · Medium  
- [JOB-16](https://linear.app/job-prep-website/issue/JOB-16/add-privacy-consent-and-ai-use-disclaimers) · Medium  
- [JOB-17](https://linear.app/job-prep-website/issue/JOB-17/define-mvp-success-metrics-and-validation-dashboard) · High  

**Milestone 4.** Depends on Phases 2–6 (report tolerates partial data).

### Tasks

**Compiled report (JOB-15)** — UI should echo landing readiness ring + section scores
- [ ] **8.1 JOB-67** Performance report data model
- [ ] **8.2 JOB-68** Report generation service (deterministic aggregate + optional AI narrative; no hiring predictions)
- [ ] **8.3 JOB-69** Performance report UI
- [ ] **8.4 JOB-70** Report tests + QA scenarios (partial + full journeys)

**Privacy & consent (JOB-16)** — footer Legal links already in landing
- [ ] **8.5 JOB-71** Privacy / AI-use copy for core flows
- [ ] **8.6 JOB-72** Consent gates on upload & AI workflows
- [ ] **8.7 JOB-73** Data deletion/export request path (MVP: request record OK)
- [ ] **8.8 JOB-74** Privacy / disclaimer QA checklist

**Metrics & validation (JOB-17)**
- [ ] **8.9 JOB-75** Analytics event taxonomy
- [ ] **8.10 JOB-76** Tracking hooks (no raw CV/JD/answer content in analytics)
- [ ] **8.11 JOB-77** Internal validation dashboard
- [ ] **8.12 JOB-78** Post-workflow feedback prompts

### Exit criteria

- Full preparation loop works end-to-end in one session
- Privacy/consent visible on sensitive flows; deletion/export requestable
- Funnel events power a simple internal validation view

---

## Explicitly out of MVP (do not schedule in phases above)

From Linear project description:

- Scraping / dependency on LinkedIn, Indeed, Glassdoor, JobStreet APIs  
- AI-generated video or audio  
- Full human coaching marketplace  
- Organizer / employer partnership dashboards  
- Certified psychological diagnosis or formal hiring-decision scoring  

### Post-MVP candidates

Live coaching · job referrals · job-fair partnerships · LGD/FGD · packaged courses · expanded portfolio / human coaching

---

## Suggested first session checklist (start here)

When implementation begins (after this plan is accepted):

1. Create feature branch / worktree; read `docs/insights.md` if present.  
2. **Phase 0.1** — land accepted specs under `docs/specs/` (product + IA + stack).  
3. **Phase 0.2–0.5** — scaffold `web/` + tooling.  
4. **Phase 1** — RoleReady landing + route placeholders (**JOB-18**).  
5. Only then promote Phase 2 Linear issues to In Progress.

---

## Full Linear backlog reference (status as of 15 Jul 2026)

_Use this as a lookup; phased sections above are the working plan._

### Milestone 1 — Profile & document intake

| ID | Title | Status | Priority |
|----|-------|--------|----------|
| JOB-18 | Create a wireframe for the website | Todo | Urgent |
| JOB-5 | Build user onboarding and career goal intake | Todo | High |
| JOB-19…24 | Onboarding children | Todo | High/Med |
| JOB-6 | Implement CV/resume upload and parsing | Todo | High |
| JOB-25…28, 30–31 | Resume children (most Todo) | Todo | High/Med |
| JOB-29 | Parse resume sections into structured data | Backlog | High |

### Milestone 2 — Application readiness tools

| ID | Title | Status | Priority |
|----|-------|--------|----------|
| JOB-7 | CV/resume checker workflow | Backlog | High |
| JOB-79 | ATS/format research | Todo | High |
| JOB-32…36 | Checker children | Backlog | High/Med |
| JOB-8 | Job-description match analyzer | Backlog | High |
| JOB-37…41 | Match children | Backlog | High/Med |
| JOB-9 | Cover letter / messages | Backlog | High |
| JOB-42…45 | Cover letter children | Backlog | Med/Low |
| JOB-10 | Personalized prep plan | Backlog | High |
| JOB-46…49 | Plan children | Backlog | High/Med |

### Milestone 3 — Interview practice & assessment

| ID | Title | Status | Priority |
|----|-------|--------|----------|
| JOB-11 | Text mock interview | Backlog | High |
| JOB-50…54 | Interview children | Backlog | High/Med |
| JOB-12 | Answer feedback & scoring | Backlog | Low |
| JOB-55…58 | Feedback children | Backlog | High/Med |
| JOB-13 | Aptitude / psychometric practice | Backlog | Medium |
| JOB-59…62 | Assessment children | Backlog | Med/Low |
| JOB-14 | Human-made video library | Backlog | Low |
| JOB-63…66 | Video children | Backlog | Med/Low |

### Milestone 4 — Report, launch polish & validation

| ID | Title | Status | Priority |
|----|-------|--------|----------|
| JOB-15 | Compiled performance report | Backlog | Medium |
| JOB-67…70 | Report children | Backlog | High/Med |
| JOB-16 | Privacy, consent, AI disclaimers | Backlog | Medium |
| JOB-71…74 | Privacy children | Backlog | High/Med |
| JOB-17 | MVP success metrics & validation | Backlog | High |
| JOB-75…78 | Analytics children | Backlog | Med/Low |

---

## Notes for implementers

1. **Brand name in UI:** RoleReady (landing); repo/product may still say “Job Prep Website” in internal docs.  
2. **AI safety:** Editable drafts only; never invent experience; no final hiring predictions; assessments are practice-only.  
3. **Privacy:** Documents private by design; consent before upload/AI; export/delete path before public launch.  
4. **Context budget:** Prefer one phase (or one parent Linear issue) per implementation cycle; archive completed TODO sections to `docs/iterations/archive/` after merge.  
5. **Spec-first:** Chat prompts are not authority — update `docs/specs/` then this file before extending scope.
