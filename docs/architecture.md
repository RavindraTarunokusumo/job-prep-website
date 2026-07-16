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
| AI | Vercel AI SDK via OpenRouter (ADR-003) |
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

### ADR-002: Resume structure (raw text → form fields) — heuristics default, GLiNER2 experimental

| Field | Value |
|-------|--------|
| **Status** | Accepted (experimental GLiNER path) |
| **Date** | 2026-07-15 |
| **Refs** | [GLiNER2](https://github.com/fastino-ai/GLiNER2) |

#### Context

Industry resume pipelines use multi-stage **extract → section/entity structure → normalize → human review**. Heuristics alone fail on collapsed PDF text. GLiNER2 provides local CPU-friendly NER + `extract_json` schema extraction without an LLM API.

#### Decision

1. **Always** extract and store `rawText` (deterministic PDF/DOCX tools).
2. **Default** structure with heuristics (`parseResumeStructure`).
3. **Optional test path:** `RESUME_STRUCTURE_PARSER=gliner` runs `scripts/gliner_resume_parse.py` via Python venv (`.venv-gliner`) using `fastino/gliner2-base-v1` `extract_json`, mapped into the same `ParsedResume` zod shape. On failure, fall back to heuristics and note in `parseError`.
4. User review/edit remains mandatory.

#### Test findings (2026-07-15)

On the user’s real CV (`CV.pdf`, ~2520 chars extracted):

| | Heuristic | GLiNER2 `extract_json` |
|--|-----------|-------------------------|
| Contact name | often missing | filled (partial “Ravindra Aribowo”) |
| Email / phone / location | partial | good |
| Experience rows | **0** | **3 roles** (titles/companies present; bullets weak) |
| Education | empty | **2 rows** (degrees/fields mostly good) |
| Skills | empty | several skills filled |
| Noise | — | occasional bad cert/lang list serialization (mitigated in mapper) |

**Conclusion:** GLiNER2 is a clear upgrade for autofill vs pure rules on messy PDFs, but not perfect (missed last name token, thin job descriptions, some list-field quirks). Prefer GLiNER (or later LLM JSON) for structure quality; keep heuristics as offline fallback.

#### Setup

```bash
python3 -m venv .venv-gliner
.venv-gliner/bin/pip install torch --index-url https://download.pytorch.org/whl/cpu
.venv-gliner/bin/pip install gliner2 transformers accelerate peft
# In web/.env.local:
RESUME_STRUCTURE_PARSER=gliner
```

CLI test:

```bash
.venv-gliner/bin/python scripts/gliner_resume_parse.py --file /path/to/raw.txt --no-raw-meta
```

#### Related code

- `scripts/gliner_resume_parse.py`
- `web/lib/resume/parse-with-gliner.ts`
- `web/lib/resume/parse-structure.ts` (heuristic fallback)
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
- Env: `OPENROUTER_API_KEY` (required), optional `OPENROUTER_MODEL` (default `openai/gpt-4o-mini`), optional `OPENROUTER_BASE_URL`.
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
