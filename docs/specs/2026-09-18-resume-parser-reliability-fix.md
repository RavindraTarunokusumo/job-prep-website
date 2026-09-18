# Spec: Resume structure parser reliability fix

| Field | Value |
|-------|--------|
| **Status** | Accepted 18 Sep 2026 (owner instruction) — implemented |
| **Date** | 2026-09-18 |
| **Type** | Bug fix (live quality defect) |
| **Refs** | ADR-002 (`docs/architecture.md`), PR #3 (`97cddd0`, `35dbcc4`) |
| **Blocks** | Nothing. Independent of the Jev work. |

## Problem

CV autofill has been silently running on its worst-measured parser.

1. `web/.env.local` sets `RESUME_STRUCTURE_PARSER=gliner` with
   `GLINER_PYTHON=/root/job-prep-website/.venv-gliner/bin/python` — a Linux path on a
   Windows host. No `.venv-gliner/` exists in the repo.
2. Every upload therefore takes the failure branch at `web/app/actions/resume.ts:126`
   and falls back to `parseResumeStructure`, which ADR-002 measured at **0 experience
   rows, empty education, empty skills** on a real CV (GLiNER2: 3 roles, 2 education
   rows, several skills).
3. The failure is invisible. `web/app/actions/resume.ts:133` writes `status: "parsed"`
   with `parseError: structureNote`, but `components/resume/review-form.tsx:63` and
   `components/resume/document-list.tsx:54` only render `parseError` when
   `status === "failed"`. The note reaches the database and is never shown.
4. No test covers the GLiNER path; `__tests__/resume-parse-structure.test.ts` covers
   heuristics only.

The root cause is not GLiNER. It is that a configured-but-unavailable parser degrades
without telling anyone.

## Goal

A configured parser either works, or its failure is visible to both the developer and
the user. Parser quality is never silently downgraded.

## Decisions

1. **Separate "parser failed" from "parse failed."** Add a nullable
   `structureParser` field recording which parser actually produced `parsedData`
   (`"heuristic"` | `"gliner"`). `parseError` stays reserved for hard failures.
2. **Surface degradation in the UI.** The review form shows a non-blocking notice when
   `structureParser === "heuristic"` while GLiNER was requested — worded for a user
   ("automatic fill was limited; please check the fields below"), not a stack trace.
3. **Fail fast on misconfiguration.** `isGlinerStructureEnabled()` verifies the
   resolved interpreter path exists. If GLiNER is requested but the interpreter is
   missing, log a clear server-side warning once at startup rather than spawning a
   doomed process per upload.
4. **Make the path portable.** `resolvePythonBin()` defaults to the platform-correct
   location (`Scripts/python.exe` on win32, `bin/python` otherwise). `.env.local` is
   corrected to this machine's actual path, or GLiNER is switched off explicitly.
5. **Do not re-litigate ADR-002.** GLiNER2 remains the preferred structure path.

## Interfaces

```
// lib/resume/parse-with-gliner.ts
isGlinerStructureEnabled(): boolean          // now also checks interpreter existence
resolvePythonBin(): string                   // platform-aware default

// lib/resume/parse-structure.ts — unchanged

// app/actions/resume.ts — processResumeDocument
//   Produces: { status, rawText, parsedData, parseError, structureParser }

// prisma/schema.prisma — ResumeDocument.structureParser String?
```

## Acceptance

- With GLiNER enabled and the venv present, a CV parses via GLiNER and
  `structureParser === "gliner"`.
- With GLiNER enabled and the venv **absent**, the upload still succeeds via
  heuristics, `structureParser === "heuristic"`, and the user sees the degradation
  notice.
- With GLiNER disabled, behaviour is unchanged and no notice appears.
- Unit tests cover all three states, including the missing-interpreter guard.
- Full `web/` suite green: `npm run lint && npm run typecheck && npm test && npm run build`.

## Out of scope

- Improving GLiNER's extraction accuracy.
- Replacing either parser with an LLM or with Jev (Jev cannot extract field values).
- Re-running the ADR-002 benchmark.

## Open questions

None blocking.
