# Spec: MVP Phase 2 — Auth & career goal onboarding

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Date** | 2026-07-15 |
| **Branch** | `feat/phase-2-auth-onboarding` |
| **Linear parent** | [JOB-5](https://linear.app/job-prep-website/issue/JOB-5/build-user-onboarding-and-career-goal-intake) |
| **Children** | JOB-19…JOB-24 |
| **Depends on** | Phase 0–1 (merged PR #1) |
| **Subagent model** | Composer 2.5 (`grok-composer-2.5-fast`) |

## 1. Goal

Let candidates create an account with Supabase Auth, complete a guided career-goal onboarding form in one session, persist profile data in Postgres (Prisma), and reach the dashboard only when signed in (and preferably after onboarding is complete).

## 2. Scope

### In scope

- Root `.gitignore` for `.env` / `.env.local` (secrets never committed)
- Prisma models: `User` (mirrors Supabase auth user id) + `Profile` (onboarding fields)
- Prisma migrate against Supabase Postgres (`DATABASE_URL`)
- Supabase Auth via `@supabase/ssr` + `@supabase/supabase-js`
  - Browser client, server client, middleware session refresh
  - Email/password sign-up and sign-in (MVP)
- Real `/login` and `/signup` pages (replace placeholders)
- `/onboarding` multi-field form (shadcn + RoleReady tokens)
- Server actions to create/update profile
- Route protection:
  - Unauthenticated → cannot access app shells (`/dashboard`, `/onboarding`, `/resume`, …)
  - Authenticated without completed onboarding → forced to `/onboarding` (except auth/public routes)
  - Authenticated with completed onboarding → `/onboarding` redirects to `/dashboard` (or profile edit path)
- Profile edit: allow revisiting onboarding fields after completion (e.g. `/settings` or `/onboarding?edit=1`)
- Validation (zod) + unit tests for validation / server action helpers
- Wire landing CTAs: Sign In → `/login`, trial modal primary → `/signup`

### Out of scope

- OAuth social providers (Google/GitHub) — optional later
- Magic link / phone auth
- CV upload (Phase 3)
- AI features
- JOB-79
- Full email templates customization beyond Supabase defaults
- RLS policy authoring in Supabase dashboard (app uses service role only on server for profile writes when needed; prefer user-scoped server client + RLS if practical — see §4)

## 3. Profile fields (JOB-5)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `educationBackground` | string | yes | Free text or short summary |
| `experienceLevel` | enum | yes | e.g. `student`, `entry`, `mid`, `senior`, `career_switch` |
| `targetRole` | string | yes | |
| `targetIndustry` | string | yes | |
| `preferredLocation` | string | yes | Region/city preference |
| `jobSearchStatus` | enum | yes | e.g. `exploring`, `actively_applying`, `interviewing`, `not_looking` |
| `careerSwitchIntent` | boolean | yes | |
| `skills` | string[] | no | Comma-separated input OK |
| `certifications` | string[] | no | |
| `onboardingCompletedAt` | DateTime? | — | Set when user finishes first successful submit |

## 4. Data model (JOB-19)

```prisma
model User {
  id        String   @id @db.Uuid // equals auth.users.id
  email     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  profile   Profile?
}

model Profile {
  id                    String    @id @default(cuid())
  userId                String    @unique @db.Uuid
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  educationBackground   String
  experienceLevel       String
  targetRole            String
  targetIndustry        String
  preferredLocation     String
  jobSearchStatus       String
  careerSwitchIntent    Boolean   @default(false)
  skills                String[]  @default([])
  certifications        String[]  @default([])
  onboardingCompletedAt DateTime?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
}
```

**Auth linkage:** On first successful sign-in/sign-up server path, ensure a `User` row exists for `auth.users.id` (upsert by id/email). Profile is created/updated via onboarding action.

**Migrations:** Use `prisma migrate dev` (or `migrate deploy` if non-interactive) against `DATABASE_URL`. Do not commit secrets.

## 5. Auth architecture (JOB-20)

### Packages

- `@supabase/supabase-js`
- `@supabase/ssr`

### Files (suggested)

| Path | Responsibility |
|------|----------------|
| `web/lib/supabase/client.ts` | Browser client |
| `web/lib/supabase/server.ts` | Server component / action client (cookies) |
| `web/lib/supabase/middleware.ts` | Session refresh helper |
| `web/middleware.ts` | Protect app routes; refresh session |
| `web/lib/prisma.ts` | PrismaClient singleton |
| `web/lib/auth/session.ts` | `requireUser()`, `getSessionUser()` |
| `web/lib/validation/onboarding.ts` | zod schema |
| `web/app/actions/auth.ts` | signUp, signIn, signOut |
| `web/app/actions/onboarding.ts` | saveProfile |

### Route classes

**Public (no auth):** `/`, `/login`, `/signup`, `/privacy`, `/terms`, `/ai-use`  
**Auth-only app:** `/dashboard`, `/onboarding`, `/resume`, `/resume/review`, `/jobs/match`, `/plan`, `/cover-letter`, `/interview`, `/assessments`, `/videos`, `/report`, `/settings`

Middleware:

1. Refresh Supabase session cookies.
2. If path is auth-only and no user → redirect `/login?next=…`
3. If user and path is `/login` or `/signup` → redirect `/dashboard` or `/onboarding` based on profile completion.
4. If user, incomplete onboarding, and path is auth-only but not `/onboarding` → redirect `/onboarding`.

## 6. UX flows

### Sign up

1. `/signup` — email + password (+ confirm password client-side).
2. On success → ensure User row → redirect `/onboarding`.

### Sign in

1. `/login` — email + password.
2. On success → `/dashboard` if onboarding complete else `/onboarding`.

### Onboarding

1. Single-page form (sections OK) with all required fields.
2. Submit → server action validates → upsert Profile + set `onboardingCompletedAt` → redirect `/dashboard`.
3. Edit: `/settings` shows summary + link to edit form, or `/onboarding` loads existing values when completed.

### Dashboard placeholder

Keep “Coming soon” content but show signed-in email and “Onboarding complete” badge when applicable.

## 7. Validation & tests (JOB-24)

- zod schema shared by client (optional) and server action.
- Vitest unit tests for:
  - onboarding schema accept/reject cases
  - pure helpers (e.g. parse skills CSV → string[])
- Manual: sign up → onboard → dashboard; sign out; unauthenticated `/dashboard` redirects.

## 8. Env

Required (already in root `.env.local`; also `web/.env.local` for Next):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
```

Root + `web/` gitignore must exclude `.env.local`. Never commit secrets.

## 9. Implementation tasks (commit order)

| ID | Task | Linear |
|----|------|--------|
| 2.0 | Root `.gitignore` for env files | — |
| 2.1 | Spec + TODO logging | — |
| 2.2 | Prisma User/Profile + migrate | JOB-19 |
| 2.3 | Supabase clients + middleware session | JOB-20 |
| 2.4 | Login/signup actions + pages | JOB-20/21 |
| 2.5 | Onboarding form + save action + gates + edit | JOB-21–23 |
| 2.6 | Validation tests | JOB-24 |

## 10. Acceptance criteria

- [ ] Unauthenticated user hitting `/dashboard` is redirected to login
- [ ] User can sign up and sign in with email/password
- [ ] User can complete onboarding and data appears in Postgres `Profile`
- [ ] Incomplete onboarding cannot reach other app routes
- [ ] Completed user can edit profile fields
- [ ] `cd web && npm run lint && npm run typecheck && npm test && npm run build` pass without committing secrets
- [ ] `.env.local` is gitignored at repo root and under `web/`

## 11. Risks

| Risk | Mitigation |
|------|------------|
| Supabase email confirm required | Prefer disabling confirm for MVP dev project, or use service path that still creates session; document in README |
| Prisma migrate vs existing empty DB | Fresh migration OK (0 public tables) |
| New non-JWT service_role keys | Use env as-is; do not assume JWT shape in code |

## 12. Open questions

None blocking. Social OAuth deferred.
