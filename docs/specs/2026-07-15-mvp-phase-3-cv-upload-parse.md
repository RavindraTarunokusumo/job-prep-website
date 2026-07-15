# Spec: MVP Phase 3 — CV / resume upload & parsing

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Date** | 2026-07-15 |
| **Branch** | `feat/phase-3-cv-upload-parse` |
| **Linear parent** | [JOB-6](https://linear.app/job-prep-website/issue/JOB-6/implement-cvresume-upload-and-parsing) |
| **Children** | JOB-25…31 (include JOB-29 structured parse) |
| **Depends on** | Phase 2 auth + profile (merged PR #2) |
| **Subagent model** | Composer 2.5 (`grok-composer-2.5-fast`) |

## 1. Goal

Authenticated users can upload a CV/resume (PDF or DOCX), store the file securely, extract text, produce structured editable fields, review/correct them, and save for later prep tools.

## 2. Storage decision

Linear mentions **Vercel Blob**. This environment has **Supabase** credentials and **no** `BLOB_READ_WRITE_TOKEN`.

**Accepted for this cycle:** use **Supabase Storage** bucket `resumes` with path `{userId}/{documentId}/{filename}`.

- Upload via authenticated server action (or signed upload) using user session or service role with ownership checks.
- Files are private (not public bucket).
- Document this deviation in PR body; Vercel Blob can replace the storage adapter later without changing Prisma model much (`storageKey` + `storageProvider`).

## 3. Scope

### In scope

- Prisma `ResumeDocument` (+ optional `parsedJson` / structured fields)
- Supabase Storage bucket setup (create via SQL/API or document manual + auto-create attempt)
- Upload UI on `/resume` (drag/drop or file input)
- Client validation: PDF/DOCX only; max size 5MB (configurable constant)
- Server upload + metadata row
- Text extraction: PDF (`pdf-parse` or unpdf) and DOCX (`mammoth`)
- Structured parse into editable sections (contact, education, experience, skills, projects, certifications, languages) — heuristic + light regex/rules; AI optional later
- Review/correction UI at `/resume/review` (or `/resume/[id]/review`)
- Failure handling + tests
- Auth: only document owner can access

### Out of scope

- AI resume scoring (Phase 4 / JOB-7)
- Vercel Blob (no token)
- JOB-79 research
- Multi-file versioning UI beyond storing latest + list

## 4. Data model (JOB-25)

```prisma
model ResumeDocument {
  id              String   @id @default(cuid())
  userId          String   @db.Uuid
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  originalFilename String
  mimeType        String
  byteSize        Int
  storageProvider String   @default("supabase") // supabase | vercel_blob later
  storagePath     String   // bucket path
  status          String   // uploaded | extracting | parsed | failed
  rawText         String?  @db.Text
  parseError      String?
  // Structured editable fields (JSON)
  parsedData      Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([userId])
}
```

Add `resumeDocuments ResumeDocument[]` on `User`.

## 5. Flows

1. User opens `/resume` (auth + onboarding complete required via existing middleware).
2. Selects PDF/DOCX → client validates type/size.
3. Server action: create DB row `status=uploaded`, upload bytes to Storage, set path.
4. Extract text → `status=extracting` then store `rawText` or `failed` + `parseError`.
5. Structure into `parsedData` → `status=parsed`.
6. Redirect to review UI; user edits fields; save updates `parsedData`.
7. List previous uploads on `/resume`.

## 6. Files (suggested)

| Path | Role |
|------|------|
| `web/lib/storage/resumes.ts` | Supabase storage upload/download helpers |
| `web/lib/resume/extract-text.ts` | PDF/DOCX → text |
| `web/lib/resume/parse-structure.ts` | text → structured JSON |
| `web/lib/validation/resume.ts` | zod for parsedData + upload meta |
| `web/app/actions/resume.ts` | upload, parse, save corrections |
| `web/app/resume/page.tsx` | upload + list |
| `web/app/resume/review/page.tsx` | review latest or `?id=` |
| `web/components/resume/*` | UploadForm, ReviewForm |
| `web/__tests__/resume-*.test.ts` | extract/parse unit tests with fixtures |

## 7. Acceptance criteria

- [ ] Authenticated user can upload PDF and DOCX (within size limit)
- [ ] Invalid type/size rejected with clear error
- [ ] File stored privately in Supabase Storage
- [ ] Text extraction populates `rawText` (or failed with message)
- [ ] Structured `parsedData` editable and saveable
- [ ] User cannot access another user’s document
- [ ] `npm run lint && typecheck && test && build` pass
- [ ] No secrets committed

## 8. Implementation tasks

| ID | Task | Linear |
|----|------|--------|
| 3.1 | Spec + TODO | — |
| 3.2 | Prisma ResumeDocument + migrate | JOB-25 |
| 3.3 | Storage helpers + upload action | JOB-26/27 |
| 3.4 | Text extract + structure parse | JOB-28/29 |
| 3.5 | Upload + review UI | JOB-26/30 |
| 3.6 | Tests + failure handling | JOB-31 |

## 9. Risks

| Risk | Mitigation |
|------|------------|
| Storage bucket missing | Create bucket in migration SQL or server bootstrap; document dashboard fallback |
| PDF parse quality | Best-effort text extract; show raw text if structure thin |
| Large files | 5MB limit |

## 10. Open questions

None blocking. Vercel Blob deferred until token available.
