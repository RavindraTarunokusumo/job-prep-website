# TODO — MVP Implementation Plan

**Last updated:** 27 July 2026 (Post-PR JOB-85…92 / PR #14 — merge `65fa7e2`)  
**Branch:** `main`  
**Team:** [Job Prep Website](https://linear.app/job-prep-website) (`JOB`)  
**Project:** [MVP Roadmap — Personalized Job Preparation Plan](https://linear.app/job-prep-website/project/mvp-roadmap-personalized-job-preparation-plan-85cc64bbf88e)

| Source | Link / path |
|--------|-------------|
| Linear project | https://linear.app/job-prep-website/project/mvp-roadmap-personalized-job-preparation-plan-85cc64bbf88e |
| Specs | `docs/specs/` |
| Phase archives | [`docs/iterations/archive/`](docs/iterations/archive/) |
| Merged PRs | [#1](https://github.com/RavindraTarunokusumo/job-prep-website/pull/1)–[#14](https://github.com/RavindraTarunokusumo/job-prep-website/pull/14) · JOB-85…92 **#14** `65fa7e2` |
| Out of agent scope | **JOB-79** (research — external owner); **JOB-80** (finance workbook) |

### Linear milestones

| # | Milestone | Progress |
|---|-----------|----------|
| 1–3 | Profile intake → Interview practice | **Done** |
| 4 | Report, launch polish & validation | **Done** for planned features |
| Outcome-first (JOB-85…92) | Ontology → mapping → readiness → outcomes → billing | **Done** (PR #14) |

---

## Active work

- **Offline rule-based CV text & structure extraction** — spec `docs/specs/2026-11-01-rule-based-cv-extraction.md` (**Accepted**, supersedes `2026-09-18-resume-parser-reliability-fix.md`) · plan `docs/superpowers/plans/2026-11-01-rule-based-cv-extraction.md`
  - [x] **CV.1** Spec (`7863ac5`), lightweight plan, and TODO setup
  - [x] **CV.2** Remove GLiNER sidecar (`scripts/gliner_resume_parse.py`, `web/lib/resume/parse-with-gliner.ts`, `web/app/actions/resume.ts`), upgrade coordinate-aware PDF line reconstruction in `web/lib/resume/extract-text.ts`, and update ADR-002 in `docs/architecture.md`
  - [x] **CV.3** Implement OpenResume-style feature-scoring CV structure parser and expanded gazetteers in `web/lib/resume/parse-structure.ts`
  - [x] **CV.4** Write sample CV corpus (`web/__tests__/fixtures/cvs/`), binary PDF/DOCX builders, end-to-end extraction tests, and CLI verification script (`web/scripts/test-cv-extraction.ts`)

- **Repository CI/CD & branch hygiene**
  - [x] **CI.1** Add GitHub Actions `Web CI` workflow (`.github/workflows/ci.yml`), Dependabot config (`.github/dependabot.yml`), and clean up `.pre-commit-config.yaml` (remove obsolete Python `ruff` hooks, add `check-added-large-files` and `detect-private-key`)
  - [x] **CI.2** Configure GitHub repository settings (`delete_branch_on_merge`) and `main` branch protection ruleset requiring `Web CI` status checks with Repository Admin bypass for Post-PR/Reflection commits

Other specs on file:

- **Jev rubric scoring** — spec `docs/specs/2026-09-18-jev-rubric-scoring.md` (**Draft — blocked on TypeSafe API key**)
  - [ ] `lib/ai/jev.ts` System One client + telemetry reuse
  - [ ] `lib/ai/resume-rubric.ts` 5-dimension rubric + deterministic 0–100 mapping
  - [ ] Synthetic CV corpus under `web/__tests__/fixtures/cvs/`
  - [ ] `scripts/jev-rubric-eval.ts` harness (3× reruns, confidence, cost/latency)
  - [ ] Claude verdict against the four fixed acceptance criteria

Remaining open product work (if any) lives in Linear Todo/Backlog outside this archive.

Optional polish / future (not started):

- Live billing provider (Stripe) for Sprint Pass checkout + signed webhooks
- Playwright browser E2E for outcome-first journey
- Production ops hardening; richer admin for videos; PDF export of reports
- JOB-79 CV/ATS research (external owner)
- JOB-80 financial projections workbook (non-code)

---

## Completed (archived)

- Phases 0–5 — see `docs/iterations/archive/2026-07-15-*` and `2026-07-16-*` / `2026-07-17-phase-5-*`
- Phase 6 — partial PR #6 + complete PR #9 archives
- JOB-13 assessments — PR #7
- JOB-14 videos — PR #10
- JOB-16 privacy — PR #8
- JOB-17 metrics — PR #11
- **JOB-15 performance report** — `docs/iterations/archive/2026-07-18-job-15-performance-report.md` (PR #12)
- **JOB-85…92 outcome-first** — `docs/iterations/archive/2026-07-27-job-85-92-outcome-first.md` (PR #14 `65fa7e2`)
