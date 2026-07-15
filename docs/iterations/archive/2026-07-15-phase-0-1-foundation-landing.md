# Archive — Phase 0–1 Foundation & RoleReady Landing

| Field | Value |
|-------|-------|
| **Merged** | 2026-07-15 |
| **PR** | https://github.com/RavindraTarunokusumo/job-prep-website/pull/1 |
| **Merge commit** | `7b265f8` |
| **Branch** | `feat/phase-0-1-foundation-landing` |
| **Spec** | `docs/specs/2026-07-15-mvp-phase-0-1-foundation-landing.md` |
| **Linear** | JOB-18 (wireframe / IA / placeholders) |
| **Subagent model** | Composer 2.5 (`grok-composer-2.5-fast`) |

## Feature commits (with git notes per `.github/git_notes_template.md`)

| Hash | Subject |
|------|---------|
| `1738f30` | docs: accept phase 0-1 foundation and landing spec |
| `9d2e17b` | feat: scaffold Next.js web app foundation |
| `43cdad1` | docs: add web app run instructions |
| `62a7f54` | feat: implement RoleReady landing and app route shells (JOB-18) |
| `149ae57` | docs: mark Phase 0-1 tasks complete in TODO |
| `e450a0b` | fix: run ESLint pre-commit from web/ context |
| `ce162ff` | chore: refresh package-lock after shadcn devDependency move |
| `6b4ba71` | docs: link PR #1 from TODO Autopilot cycle header |

## Completed phase sections (snapshot)

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

