# Spec: MVP Phase 0–1 — Foundation & RoleReady landing

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Date** | 2026-07-15 |
| **Autopilot cycle** | Phase 0 → Phase 1 |
| **Branch** | `feat/phase-0-1-foundation-landing` |
| **Linear team** | Job Prep Website (`JOB`) |
| **Linear project** | [MVP Roadmap — Personalized Job Preparation Plan](https://linear.app/job-prep-website/project/mvp-roadmap-personalized-job-preparation-plan-85cc64bbf88e) |
| **Primary Linear issue** | [JOB-18](https://linear.app/job-prep-website/issue/JOB-18/create-a-wireframe-for-the-website) (wireframe / IA / placeholders) |
| **UI reference** | [`RoleReady Landing.dc.html`](../../RoleReady%20Landing.dc.html) |
| **TODO** | [`TODO.md`](../../TODO.md) |
| **Subagent model** | Composer 2.5 (`grok-composer-2.5-fast`) |

## 1. Goal

Stand up a runnable Next.js application shell and ship a high-fidelity public landing page that matches the RoleReady reference design, plus an information architecture with placeholder app routes for later MVP features.

This cycle intentionally **does not** implement auth, CV upload, AI features, or any Phase 2+ product logic.

## 2. Product context (stable)

**Core promise:** Upload your CV, choose your target role, and get a personalized job-preparation plan.

**MVP core loop (full product, not this PR):**

1. Upload CV/resume  
2. Select target role, industry, location, experience level  
3. Generate career readiness profile  
4. Review CV/resume/cover letter fit  
5. Paste job description for match analysis  
6. Practice text-based interview questions  
7. Receive compiled performance report and next-step plan  

**Out of MVP (never schedule here):** job-board API scraping, AI video/audio, coaching marketplace, employer dashboards, clinical/hiring-decision scoring.

**Explicitly out of this agent cycle:** [JOB-79](https://linear.app/job-prep-website/issue/JOB-79/research-widespread-cvresume-formats-and-ats-requirements) (owned by another person).

## 3. Scope

### In scope (Phase 0)

- Accepted specs (this document + specs README)
- Next.js App Router + TypeScript app under `web/`
- Tailwind CSS v4 or v3 (whichever `create-next-app` + shadcn currently default)
- shadcn/ui base components needed by landing (Button, Card, Dialog at minimum)
- Prisma schema **stub** + client setup path (no real migrations against a live DB required if `DATABASE_URL` missing)
- `.env.example` documenting future secrets (Supabase, Blob, AI, DB)
- npm scripts: `dev`, `build`, `lint`, `typecheck`, `test`
- Root `README.md` run instructions for `web/`
- Adjust root `.pre-commit-config.yaml` so hooks work with `web/` (eslint/tsc/prisma paths)

### In scope (Phase 1 / JOB-18)

- Documented route map + primary user stories (this spec §5–6)
- Design tokens from RoleReady reference (fonts, colors, radii) in Tailwind theme / CSS variables
- Public landing page at `/` matching reference structure and visual language:
  - Sticky nav (RoleReady logo, How it works, Features, Resources, Pricing, Sign In, Start Free)
  - Hero + product preview card
  - Trust bar
  - How it works (`#how`) — 4 steps
  - Features bento (`#features`)
  - Dashboard preview (`#resources`)
  - Why RoleReady dark band
  - Pricing / final CTA (`#pricing`)
  - Footer (Product / Resources / Company / Legal)
  - 7-day free trial modal
- Placeholder pages for public legal stubs and authenticated app shells (empty state + title)
- CTAs: trial buttons open modal; modal primary action links to `/signup`; Sign In → `/login`

### Out of scope (this cycle)

- Supabase Auth, sessions, middleware protection  
- Real onboarding forms / Prisma product models beyond stub  
- File upload, Blob, PDF/DOCX parsing  
- Any Vercel AI SDK usage  
- Real billing / trial enforcement  
- JOB-79 research  
- GitNexus rebuild mid-implementation (optional post-merge on clean `main`)

## 4. Tech stack & repo layout

```
job-prep-website/
  web/                 # Next.js app (App Router)
    app/               # routes
    components/        # UI + landing sections
    lib/               # utilities
    prisma/            # schema.prisma stub
    public/
    package.json
  docs/specs/          # accepted specs
  TODO.md
  RoleReady Landing.dc.html   # design reference (do not delete)
  AGENTS.md / CLAUDE.md
```

| Concern | Choice |
|---------|--------|
| Framework | Next.js (latest stable App Router) |
| Language | TypeScript strict |
| Styling | Tailwind + CSS variables for RoleReady tokens |
| Components | shadcn/ui |
| DB (future) | PostgreSQL + Prisma (stub only now) |
| Auth (future) | Supabase Auth |
| Storage (future) | Vercel Blob |
| AI (future) | Vercel AI SDK |
| Deploy (future) | Vercel |

### Environment template keys (`.env.example` in `web/`)

```
DATABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
BLOB_READ_WRITE_TOKEN=
AI_GATEWAY_API_KEY=
# or OPENAI_API_KEY / provider-specific when chosen
```

No live keys required for this cycle. App must build and `dev` without them.

## 5. Information architecture (JOB-18)

### Public routes

| Path | Purpose |
|------|---------|
| `/` | RoleReady marketing landing |
| `/login` | Placeholder — sign in |
| `/signup` | Placeholder — start free trial / create account |
| `/privacy` | Placeholder — privacy policy |
| `/terms` | Placeholder — terms of service |
| `/ai-use` | Placeholder — AI use disclaimer |

### App routes (placeholders; no auth gate yet)

| Path | Future feature | Linear parent |
|------|----------------|---------------|
| `/dashboard` | Home / readiness workspace | JOB-10, JOB-15 |
| `/onboarding` | Career goal intake | JOB-5 |
| `/resume` | Upload & manage CV | JOB-6 |
| `/resume/review` | AI resume checker | JOB-7 |
| `/jobs/match` | JD match analyzer | JOB-8 |
| `/plan` | Personalized prep plan | JOB-10 |
| `/cover-letter` | Cover letter editor | JOB-9 |
| `/interview` | Text mock interview | JOB-11, JOB-12 |
| `/assessments` | Aptitude practice | JOB-13 |
| `/videos` | Interview video library | JOB-14 |
| `/report` | Compiled performance report | JOB-15 |
| `/settings` | Account, privacy, data requests | JOB-16 |

Placeholder pages must render: page title, one-line description, “Coming soon” (or similar), and a link back to `/` or `/dashboard`.

## 6. User stories (landing / JOB-18)

1. **As a visitor**, I can understand RoleReady’s value in the hero without scrolling.  
2. **As a visitor**, I can jump to How it works, Features, Resources, and Pricing via the nav.  
3. **As a visitor**, I can open a free-trial modal and continue to signup.  
4. **As a visitor**, I can reach Sign In from the nav.  
5. **As a future implementer**, every MVP feature has a dedicated route shell.  
6. **As a candidate**, marketing copy emphasizes structured prep grounded in *my* CV—not generic chatbot advice.

## 7. Design system (from reference)

| Token | Value |
|-------|--------|
| Font sans | Plus Jakarta Sans |
| Font mono | IBM Plex Mono |
| Brand blue | `#2E5BF0` |
| Brand purple | `#7B3FE4` |
| Gradient | `linear-gradient(135deg, #2E5BF0, #7B3FE4)` |
| Text primary | `#14161F` |
| Text muted | `#565E73` / `#616984` |
| Page bg | `#F5F6FB` |
| Success | `#16A374` |
| Warning | `#E0902B` |
| Danger | `#E5484D` |
| Border | `rgba(24,30,54,0.08)` |
| Focus | 2.5px solid `#2E5BF0` |

Landing implementation notes:

- Prefer React section components under `web/components/landing/` rather than a single 600-line file.  
- Static mock content from the reference (e.g. “Aisha Rahman”, scores) is fine.  
- Hover / sticky nav scroll state / modal open-close should work.  
- Pixel-perfect parity is a goal on desktop; mobile must be usable (stacked hero, wrapping nav or simplified header).

## 8. Implementation tasks (commit granularity)

| ID | Task | Commit message suggestion |
|----|------|---------------------------|
| 0.1 | Specs + specs README | `docs: accept phase 0-1 foundation and landing spec` |
| 0.2–0.5 | Scaffold Next.js, Tailwind, shadcn, Prisma stub, env example, scripts | `feat: scaffold Next.js web app foundation` |
| 0.6 | README run instructions | `docs: add web app run instructions` |
| 1.x | Tokens + landing + placeholders | `feat: implement RoleReady landing and app route shells (JOB-18)` |

Each implementation sub-task is delegated to an ephemeral **Composer 2.5** junior (`grok-composer-2.5-fast`). Senior reviews diff, runs full validation, commits with specific staging.

## 9. Acceptance criteria

### Phase 0

- [ ] Specs present and linked from `TODO.md`  
- [ ] `cd web && npm install && npm run dev` starts without secrets  
- [ ] `npm run lint` and `npm run typecheck` pass in `web/`  
- [ ] `npm test` has a runnable harness (may be zero tests)  
- [ ] Prisma schema stub exists; no required live DB for build  
- [ ] `.env.example` documents future keys  

### Phase 1

- [ ] `/` matches RoleReady reference sections and brand tokens  
- [ ] Trial modal works; primary CTA navigates toward signup  
- [ ] All routes in §5 exist as pages  
- [ ] Route map + user stories documented (this spec)  
- [ ] No auth or AI dependencies required to view marketing + placeholders  

## 10. Test plan

1. `cd web && npm run lint && npm run typecheck && npm test && npm run build`  
2. Manual: open `/`, scroll all sections, open/close modal, click Sign In / signup links  
3. Manual: hit each placeholder route; confirm empty-state copy  
4. Pre-commit hooks on commit (note any pre-existing failures on untouched files)

## 11. Risks & rollback

| Risk | Mitigation |
|------|------------|
| Pre-commit root hooks assume repo-root `tsc` / `prisma` | Point hooks at `web/` or add root wrappers |
| Design HTML uses custom `style-hover` / template syntax | Translate to React state + Tailwind/CSS |
| Large landing PR | Keep foundation commit separate from landing commit |

**Rollback:** revert the feature branch commits or close PR without merge.

## 12. Open questions

| Question | Status |
|----------|--------|
| Live Supabase / Blob / AI keys | **Deferred** — not needed this cycle; ask user before Phase 2 |
| Exact AI model provider | **Deferred** — Phase 4+ |
| Package manager | **npm** (already on runner) |

No blocking open questions for Phase 0–1.

## 13. Success definition

After merge, a developer can clone the repo, install `web/`, run the landing locally, and see the RoleReady product story with a clear map of where every MVP feature will live.
