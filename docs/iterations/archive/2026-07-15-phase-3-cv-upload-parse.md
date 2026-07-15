# Archive — Phase 3 CV upload & parsing

| Field | Value |
|-------|-------|
| **Merged** | 2026-07-15 |
| **PR** | https://github.com/RavindraTarunokusumo/job-prep-website/pull/3 |
| **Merge commit** | `208c3a6` |
| **Branch** | `feat/phase-3-cv-upload-parse` |
| **Spec** | `docs/specs/2026-07-15-mvp-phase-3-cv-upload-parse.md` |
| **Linear** | JOB-6 (JOB-25…31) |
| **ADRs** | ADR-001 Supabase Storage; ADR-002 GLiNER experimental structure |

## Feature commits (selected)

| Hash | Subject |
|------|---------|
| `abe7620` | docs: accept Phase 3 CV upload and parse spec |
| `fe206a6` | feat: add ResumeDocument model (JOB-25) |
| `848b28a` | feat: resume upload storage extract and parse (JOB-26–29) |
| `b60dfc5` | feat: resume upload and review UI with tests (JOB-30–31) |
| `e83c803` | fix: recreate stale Prisma client; document storage ADR |
| `97cddd0` | feat: optional GLiNER2 resume structure path (test) |
| `35dbcc4` | fix: drop unused meta binding in GLiNER parse helper |

## Completed phase section (snapshot)

## Phase 3 — CV / resume upload & parsing

**Linear parent:** [JOB-6](https://linear.app/job-prep-website/issue/JOB-6/implement-cvresume-upload-and-parsing) · Milestone 1 · High  
**Depends on:** Phase 2 (authenticated user + profile)

### Tasks

- [x] **3.0** Accepted Phase 3 spec — `abe7620` (Supabase Storage instead of Vercel Blob — no token)
- [x] **3.1 JOB-25** Resume document model — `fe206a6` + upload metadata schema
- [x] **3.2 JOB-26** Upload UI — `848b28a`/`b60dfc5` + client file validation (PDF/DOCX, size limits)
- [x] **3.3 JOB-27** Private file storage — `848b28a` upload flow (**Supabase Storage** `resumes` bucket)
- [x] **3.4 JOB-28** Extract text — `848b28a` from PDF and DOCX
- [x] **3.5 JOB-29** Parse sections — `848b28a` into editable structured data
- [x] **3.6 JOB-30** Parsed resume review — `b60dfc5` & correction screen
- [x] **3.7 JOB-31** Upload/parsing tests — `b60dfc5` + failure handling

### Exit criteria

- User uploads CV → text extracted → structured sections shown → user can correct and save
- Failures (bad type, corrupt file, parse fail) surface clear errors

### Milestone 1 gate

Phases 0–3 complete Linear Milestone **1. Profile & document intake** (JOB-18, JOB-5, JOB-6).

---

