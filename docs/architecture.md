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
| AI | Vercel AI SDK + OpenRouter (`web/lib/ai/config.ts`, ADR-003) |
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

### ADR-002: Resume structure (raw text → form fields) — coordinate-aware extraction + feature-scoring parser (GLiNER2 removed)

| Field | Value |
|-------|--------|
| **Status** | Accepted (supersedes experimental GLiNER2 path) |
| **Date** | 2026-11-01 |
| **Spec** | [2026-11-01-rule-based-cv-extraction.md](./specs/2026-11-01-rule-based-cv-extraction.md) |

#### Context

Industry resume pipelines use multi-stage **extract → section/entity structure → normalize → human review**. Originally, an optional Python GLiNER2 sidecar (`scripts/gliner_resume_parse.py`, `web/lib/resume/parse-with-gliner.ts`) was introduced because naive line-based heuristics failed when `unpdf`'s default `extractText(..., { mergePages: true })` collapsed PDF lines or tab-aligned columns. However, the GLiNER2 sidecar required a local Python virtual environment (`.venv-gliner`), PyTorch CPU wheels, HuggingFace model weights, and cross-process spawning on every upload.

Root-cause analysis showed that fixing PDF line reconstruction at the coordinate level and using an OpenResume-style feature-scoring parser eliminates the failure modes without any external Python/ML runtime.

#### Decision

1. **Coordinate-aware text extraction (`web/lib/resume/extract-text.ts`):** Reconstruct visual lines from PDF $(x, y)$ text-item coordinates (`page.getTextContent()`), clustering items by baseline ($\Delta y \le 3\text{pt}$), inserting `" | "` on wide horizontal column/tab gaps ($\Delta x > 24\text{pt}$), and preserving paragraph breaks (`\n\n`). Fall back to `extractText(pdf, { mergePages: true })` only if coordinate items are empty.
2. **Offline feature-scoring parser (`web/lib/resume/parse-structure.ts`):** Segment sections using expanded header dictionaries + inline section rescue, split subsections using date-range anchors and bullet transitions, and score candidate attributes for contact (supporting Title Case and `ALL CAPS` multi-token names, international phones/locations), experience (`title`, `company`, `location`, `startDate`, `endDate`, `description`), education (`institution`, `degree`, `field`, dates), and categorized skills.
3. **Remove GLiNER2 sidecar:** Delete `scripts/gliner_resume_parse.py` and `web/lib/resume/parse-with-gliner.ts`; `processResumeDocument` calls `parseResumeStructure(extracted.text)` directly.
4. User review/edit remains mandatory.

#### Related code

- `web/lib/resume/extract-text.ts` (`extractResumeText`, `reconstructPdfLinesFromItems`)
- `web/lib/resume/parse-structure.ts` (`parseResumeStructure`)
- `web/app/actions/resume.ts` (`processResumeDocument`)

### ADR-003: AI provider — OpenRouter via Vercel AI SDK

| Field | Value |
|-------|--------|
| **Status** | Accepted |
| **Date** | 2026-07-16 |
| **Phase / Linear** | Phase 4 / JOB-33+ |
| **Spec** | [2026-07-16-mvp-phase-4-application-readiness.md](./specs/2026-07-16-mvp-phase-4-application-readiness.md) |

#### Context

Phase 4 features (resume checker, JD match, prep plan) need structured LLM output. The environment provides **`OPENROUTER_API_KEY`** (OpenAI-compatible Chat Completions API), not direct OpenAI/Anthropic/xAI credentials. The product spec standardizes on the **Vercel AI SDK**.

#### Decision

- Use **`ai`** + **`@ai-sdk/openai`** with `createOpenAI` pointed at OpenRouter (`baseURL` default `https://openrouter.ai/api/v1`).
- Single config: `web/lib/ai/config.ts` (`aiConfig.openrouter`). Env: `OPENROUTER_API_KEY` (required), optional `OPENROUTER_MODEL` (default `tencent/hy3:free`), optional `OPENROUTER_FALLBACK_MODEL` (default `nvidia/nemotron-3-ultra-550b-a55b:free`), optional `OPENROUTER_BASE_URL`.
- `generateObjectWithFallback` in `openrouter.ts` tries primary then fallback; feature services do not hardcode model ids.
- All LLM calls are **server-only** (lib services + Server Actions). Never expose the key to the client.
- Prefer **`generateObject`** with **zod** schemas; reject invalid AI payloads with safe user-facing errors.
- Prompts forbid inventing experience, employers, dates, or metrics not present in user resume/profile text.

#### Consequences

**Positive**

- One SDK surface for review, match, and prep-plan features
- Model swappable via env without code changes
- Structured output validated before persistence

**Negative / trade-offs**

- Depends on OpenRouter availability and routing for chosen model
- CI/offline tests must mock the AI layer (schema + guard unit tests remain live)

#### Related code

- `web/lib/ai/openrouter.ts` — shared model factory
- `web/lib/ai/resume-review.ts` — resume review + bullet rewrite
- `web/app/actions/resume-review.ts` — server actions
