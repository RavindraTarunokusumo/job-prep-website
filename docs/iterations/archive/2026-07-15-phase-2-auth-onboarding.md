# Archive — Phase 2 Auth & career onboarding

| Field | Value |
|-------|-------|
| **Merged** | 2026-07-15 |
| **PR** | https://github.com/RavindraTarunokusumo/job-prep-website/pull/2 |
| **Merge commit** | `8ec6bae` |
| **Branch** | `feat/phase-2-auth-onboarding` |
| **Spec** | `docs/specs/2026-07-15-mvp-phase-2-auth-onboarding.md` |
| **Linear** | JOB-5 (JOB-19…24) |
| **Subagent model** | Composer 2.5 (`grok-composer-2.5-fast`) |

## Feature commits

| Hash | Subject |
|------|---------|
| `0033571` | docs: accept Phase 2 auth/onboarding spec and ignore env files |
| `7d1b0c8` | feat: add User and Profile Prisma models (JOB-19) |
| `7375ddb` | feat: implement Supabase Auth sessions and login (JOB-20) |
| `5e54ebd` | feat: career onboarding form, gates, and tests (JOB-21–24) |
| `6e4531c` | docs: mark Phase 2 auth/onboarding tasks complete in TODO |
| `b3d0234` | fix: do not set onboarding cookie from Server Component |

## Completed phase section (snapshot)

## Phase 2 — Auth & career goal onboarding

**Linear parent:** [JOB-5](https://linear.app/job-prep-website/issue/JOB-5/build-user-onboarding-and-career-goal-intake) · Milestone 1 · High  
**Depends on:** Phase 0–1

### Capture fields (from JOB-5)

Education · experience level · target role · target industry · preferred location/region · job-search status · career-switch intent · skills & certifications

### Tasks

- [x] **2.0** Root `.gitignore` for `.env` / `.env.local` (never commit secrets)
- [x] **2.1** — `0033571` Accepted Phase 2 spec under `docs/specs/`
- [x] **2.2 JOB-19** — `7d1b0c8` Design onboarding / profile data model in Prisma
- [x] **2.3 JOB-20** — `7375ddb` Implement Supabase Auth session handling (middleware, client/server helpers)
- [x] **2.4 JOB-21** — `5e54ebd` Build onboarding form UI (shadcn/ui; brand tokens from Phase 1)
- [x] **2.5 JOB-22** — `5e54ebd` Create onboarding save/update server actions
- [x] **2.6 JOB-23** — `5e54ebd` Onboarding completion gate + profile edit states
- [x] **2.7 JOB-24** — `5e54ebd` Validation and tests

### Exit criteria

- New user can sign up/in, complete onboarding in one guided flow, land on dashboard
- Profile is persisted and editable
- Unauthenticated users cannot reach app routes

---

