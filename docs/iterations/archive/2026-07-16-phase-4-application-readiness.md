# Archive — Phase 4 application readiness

| Field | Value |
|-------|-------|
| **Merged** | 2026-07-16 |
| **PR** | https://github.com/RavindraTarunokusumo/job-prep-website/pull/4 |
| **Merge commit** | `3f324f5` |
| **Branch** | `feat/phase-4-application-readiness` |
| **Spec** | `docs/specs/2026-07-16-mvp-phase-4-application-readiness.md` |
| **Plan** | `docs/superpowers/plans/2026-07-16-phase-4-application-readiness.md` |
| **Linear** | JOB-7, JOB-8, JOB-10 (children JOB-32…41, JOB-46…49; **JOB-79 skipped**) |
| **ADRs** | ADR-003 OpenRouter via Vercel AI SDK |

## Feature commits

| Hash | Subject |
|------|---------|
| `af3b861` | docs: accept Phase 4 application readiness spec and plan |
| `5b96a85` | feat(ai): add resume review schema and ResumeReview model |
| `d34b51e` | docs(todo): mark JOB-32 complete in Phase 4 checklist |
| `49a67a2` | feat(ai): OpenRouter resume checker, dashboard, and bullet rewrite |
| `37abe41` | docs(todo): mark resume checker tasks complete |
| `6e9863e` | feat(ai): job match analyzer, prep plan, and dashboard readiness cards |
| `679f8fa` | docs(todo): mark Phase 4 application readiness tasks complete |
| `c7ed0b0` | fix: address PR #4 review findings for AI readiness flows |
| `fc0b5c2` | feat(ai): default OpenRouter to tencent/hy3:free with nemotron fallback |
| `24e8970` | refactor(ai): single config for OpenRouter model and fallback |
| `b80cc21` | fix(ui): use Link with button styles on dashboard cards |

## Completed phase section (snapshot)

## Phase 4 — Application readiness core (checker, JD match, prep plan)

**Linear parents:** JOB-7, JOB-8, JOB-10 · Milestone 2 · High  

### Tasks

**Research**
- [ ] **4.0 JOB-79** Research widespread CV formats & ATS — **skipped (owned by another person)**

**CV / resume checker (JOB-7)**
- [x] **4.1 JOB-32** Resume review result schema — `5b96a85`
- [x] **4.2 JOB-33** AI resume review (Vercel AI SDK + OpenRouter) — `49a67a2`
- [x] **4.3 JOB-34** Resume review dashboard UI — `49a67a2` (`/resume/check`)
- [x] **4.4 JOB-35** Bullet rewrite workflow — `49a67a2`
- [x] **4.5 JOB-36** Review tests + guards — `49a67a2`

**Job-description match (JOB-8)**
- [x] **4.6–4.10 JOB-37…41** Models, paste UI, extract, score, results — `6e9863e` (`/jobs/match`)

**Personalized prep plan (JOB-10)**
- [x] **4.11–4.14 JOB-46…49** Models, generate, checklist UI, refresh/staleness — `6e9863e` (`/plan`)

### Exit criteria

- User with profile + CV can run checker, paste a JD, and receive a prioritized prep plan
- Outputs specific and editable; plan items link to existing tools

### Config notes

- Single AI config: `web/lib/ai/config.ts` (primary `tencent/hy3:free`, fallback `nvidia/nemotron-3-ultra-550b-a55b:free`)
- Requires `OPENROUTER_API_KEY` in `web/.env.local`

### Merge ID

Session Autopilot merge: PR #4 → `3f324f5`
