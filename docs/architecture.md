# Architecture

High-level product architecture for the Job Prep Website (RoleReady) MVP.

## Core promise

Upload your CV, choose a target role, get a personalized job-preparation plan.

## Runtime stack

| Layer | Choice |
|-------|--------|
| App | Next.js App Router (`web/`) |
| Auth | Supabase Auth (`@supabase/ssr`) |
| Database | PostgreSQL via Supabase + Prisma |
| File storage (MVP) | **Supabase Storage** (see ADR below) |
| AI (planned) | Vercel AI SDK |
| Deploy (planned) | Vercel |

## Auth and routing

- Public marketing routes: `/`, legal pages, `/login`, `/signup`
- Authenticated app routes require a Supabase session (middleware)
- Onboarding completion is gated (cookie synced from Server Actions only — never set cookies from Server Components)

## Persistence

See [database.md](./database.md) for models and storage paths.

## Architecture decision records (ADRs)

### ADR-001: Resume file storage — Supabase Storage (not Vercel Blob)

| Field | Value |
|-------|--------|
| **Status** | Accepted |
| **Date** | 2026-07-15 |
| **Phase / Linear** | Phase 3 / JOB-6, JOB-27 |
| **Spec** | [2026-07-15-mvp-phase-3-cv-upload-parse.md](./specs/2026-07-15-mvp-phase-3-cv-upload-parse.md) |

#### Context

The Linear MVP plan named **Vercel Blob** for CV/resume uploads. At implementation time the environment already had working Supabase Auth, Postgres, and service-role credentials, but **no** `BLOB_READ_WRITE_TOKEN` (or other Blob setup). Blocking Phase 3 on a new vendor secret would delay the profile/document intake milestone.

Resumes are **private career documents** (not public CDN assets). Identity already lives in Supabase Auth.

#### Decision

Use **Supabase Storage** for MVP resume files:

- Private bucket: `resumes`
- Object path: `{userId}/{documentId}/{safeFilename}`
- App ownership checks on every read/write; service role used only for storage admin/upload helpers with explicit user scoping
- Prisma `ResumeDocument.storageProvider` defaults to `"supabase"`; `storagePath` holds the object key

Vercel Blob remains a valid future adapter if the team standardizes on Vercel-only object storage.

#### Consequences

**Positive**

- One platform for auth, DB, and private files
- No extra secret or account to unblock JOB-6
- Fits private-document access patterns (signed URLs / server-side download)

**Negative / trade-offs**

- Deviates from original Linear wording (“Vercel Blob”)
- Less “native” if deploy/ops become Vercel-centric for all binaries
- Storage RLS policies should still be reviewed as the product hardens

**Not claimed**

- Supabase Storage is not universally “better” than Blob; it is **better for this monorepo right now** given credentials and stack cohesion.

#### Migration path (optional later)

1. Add `BLOB_READ_WRITE_TOKEN` and a Blob upload adapter.
2. Set `storageProvider = "vercel_blob"` for new uploads (or dual-write).
3. Backfill/migrate existing `resumes` objects if needed.
4. Keep `storagePath` semantics as provider-relative keys.

#### Related code

- `web/lib/storage/resumes.ts`
- `web/lib/supabase/admin.ts`
- `web/prisma/schema.prisma` → `ResumeDocument`
