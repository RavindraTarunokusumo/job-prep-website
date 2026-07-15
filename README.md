# Job Prep Website

A personalized job-preparation platform that helps candidates get application-ready before they apply.

**Core promise:** Upload your CV, choose your target role, and get a personalized job-preparation plan.

## What it does

The MVP focuses on improving application readiness without relying on fragile external job-board APIs. A user can complete the full preparation loop in one session and leave with concrete, actionable feedback—not generic career advice.

### Core workflow

1. Upload a CV/resume
2. Select target role, industry, location, and experience level
3. Generate a career readiness profile
4. Review CV/resume/cover letter fit
5. Paste a job description for match analysis
6. Practice text-based interview questions
7. Receive a compiled performance report and next-step plan

## MVP roadmap

Delivery is tracked in Linear under [MVP Roadmap — Personalized Job Preparation Plan](https://linear.app/job-prep-website/project/mvp-roadmap-personalized-job-preparation-plan-85cc64bbf88e). Active implementation tasks live in [`TODO.md`](TODO.md).

| Milestone | Target | Scope |
|-----------|--------|-------|
| **1. Profile & document intake** | Jul 2026 | User accounts, onboarding, career goal intake, CV upload, parsing, and structured resume review |
| **2. Application readiness tools** | Aug 2026 | Resume checker, cover letter generator, job-description match analyzer, and personalized prep plan |
| **3. Interview practice & assessment** | Sep 2026 | Text-based mock interviews, answer feedback, aptitude/psychometric practice, and interview video library |
| **4. Report, launch polish & validation** | Oct 2026 | Compiled performance report, privacy/consent flows, analytics, validation dashboard, and launch QA |

### Feature areas

**Profile & document intake**
- User onboarding and career goal intake
- CV/resume upload with PDF and DOCX parsing
- Parsed resume review and correction
- Website wireframes and information architecture

**Application readiness**
- AI-powered CV/resume checker and bullet rewrites
- Job-description match analyzer with requirement extraction and fit scoring
- Cover letter and short application message generation
- Personalized job-preparation plan with refresh rules

**Interview practice & assessment**
- Role-based text mock interviews with contextual follow-ups
- AI answer feedback and scoring
- Aptitude and psychometric practice (non-clinical)
- Curated human-made interview video library

**Report & launch**
- Compiled readiness/performance report across profile, applications, interviews, and assessments
- Privacy, consent, and AI-use disclaimers
- User data deletion/export requests
- MVP analytics, validation dashboard, and post-workflow feedback prompts

## Tech stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui — app lives in [`web/`](web/)
- **Auth (planned):** Supabase Auth
- **Database (planned):** PostgreSQL with Prisma (`web/prisma/`)
- **File storage (planned):** Vercel Blob
- **AI (planned):** Vercel AI SDK
- **Deployment (planned):** Vercel

## Local development

```bash
cd web
cp .env.example .env.local   # optional for Phase 0–1; secrets needed from Phase 2
npm install
npm run dev                  # http://localhost:3000
```

Other scripts (from `web/`):

| Script | Purpose |
|--------|---------|
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest |
| `npm run build` | Production build |
| `npm run prisma:generate` | Generate Prisma client |

Landing UI reference design (not the runtime app): [`RoleReady Landing.dc.html`](RoleReady%20Landing.dc.html).  
Active accepted spec: [`docs/specs/2026-07-15-mvp-phase-0-1-foundation-landing.md`](docs/specs/2026-07-15-mvp-phase-0-1-foundation-landing.md).

## Out of MVP scope

- Automated scraping or integrations with LinkedIn, Indeed, Glassdoor, or JobStreet APIs
- AI-generated video or audio
- Full human coaching marketplace
- Organizer or employer partnership dashboards
- Certified psychological diagnosis or formal hiring-decision scoring

## Post-MVP candidates

- Live human interview training and professional consultation
- Job recommendations, referrals, and employer connections
- Job-fair and event partnerships
- Live group discussion practice (LGD/FGD)
- Full packaged application-process courses
- Expanded portfolio guidance and human coaching

## Success criteria

- A user can complete the full preparation loop in one session
- Outputs are useful enough to save, download, or revisit
- Recommendations are specific and actionable, not generic
- The MVP establishes a foundation for later coaching, job-fair notifications, and advanced assessments

## Repository status

Phase 0–1 foundation: Next.js app under `web/`, RoleReady landing + route shells (JOB-18). Auth, uploads, and AI come in later phases.

## Sources of truth

- **Business concepts:** [Business Ideation sheet](https://docs.google.com/spreadsheets/d/1YxbmFESdd0LmI9zHTcMNC0yvs9s0VBfUYeX_7EoZ8Zk)
- **Delivery scope:** [Linear MVP project](https://linear.app/job-prep-website/project/mvp-roadmap-personalized-job-preparation-plan-85cc64bbf88e)
- **Active tasks:** [`TODO.md`](TODO.md)
- **Active spec:** [`docs/specs/2026-07-15-mvp-phase-0-1-foundation-landing.md`](docs/specs/2026-07-15-mvp-phase-0-1-foundation-landing.md)