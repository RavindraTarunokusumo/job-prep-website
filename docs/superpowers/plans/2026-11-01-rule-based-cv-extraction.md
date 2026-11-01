# Lightweight Plan: Offline Rule-Based CV Text & Structure Extraction

**Spec:** [docs/specs/2026-11-01-rule-based-cv-extraction.md](../../specs/2026-11-01-rule-based-cv-extraction.md)  
**Branch / worktree:** `feat/rule-based-cv-extraction` @ `.worktree/rule-based-cv-extraction`  
**Base:** `origin/main`  
**No git from implementers.**

## File structure

```
docs/specs/2026-11-01-rule-based-cv-extraction.md
docs/superpowers/plans/2026-11-01-rule-based-cv-extraction.md
docs/architecture.md
TODO.md
scripts/gliner_resume_parse.py                        # DELETE
web/lib/resume/parse-with-gliner.ts                   # DELETE
web/lib/resume/extract-text.ts                        # MODIFY (coordinate-aware PDF line grouping)
web/lib/resume/parse-structure.ts                     # MODIFY (feature-scoring + gazetteers)
web/app/actions/resume.ts                             # MODIFY (remove GLiNER sidecar calls)
web/__tests__/fixtures/cvs/01-chronological-swe.txt   # CREATE
web/__tests__/fixtures/cvs/02-tab-aligned-intl.txt    # CREATE
web/__tests__/fixtures/cvs/03-collapsed-dense.txt     # CREATE
web/__tests__/fixtures/cvs/04-academic-switcher.txt   # CREATE
web/__tests__/fixtures/cvs/05-minimal-edge.txt        # CREATE
web/__tests__/helpers/cv-binary-builders.ts           # CREATE (deterministic PDF & DOCX buffer builders)
web/__tests__/resume-parse-structure.test.ts          # MODIFY (expand fixture coverage)
web/__tests__/resume-extract-and-parse.test.ts        # CREATE (end-to-end PDF/DOCX + corpus tests)
web/scripts/test-cv-extraction.ts                     # CREATE (CLI benchmark & verification script)
```

## Tasks

### T1 — Spec, Plan & TODO (`CV.1`)

**Consumes:** Accepted spec `docs/specs/2026-11-01-rule-based-cv-extraction.md`  
**Produces:** Lightweight plan `docs/superpowers/plans/2026-11-01-rule-based-cv-extraction.md`, updated `TODO.md`  

### T2 — Remove GLiNER sidecar & upgrade coordinate-aware PDF extraction (`CV.2`)

**Consumes:** T1, `unpdf` (`getDocumentProxy`, `extractText`)  
**Produces:**
- Deleted `scripts/gliner_resume_parse.py` and `web/lib/resume/parse-with-gliner.ts`
- Simplified `web/app/actions/resume.ts` (`processResumeDocument` uses `parseResumeStructure(extracted.text)` directly)
- Upgraded `web/lib/resume/extract-text.ts`:
  - `extractResumeText(bytes: Buffer, mimeType: string): Promise<ExtractTextResult>`
  - Coordinate-aware PDF line reconstruction (`reconstructPdfLinesFromItems`) grouping items by baseline ($\Delta y \le 3\text{pt}$), inserting `" | "` on wide horizontal gaps ($\Delta x > 24\text{pt}$), `" "` on normal word gaps, and `\n\n` on paragraph vertical gaps, with fallback to `extractText(pdf, { mergePages: true })`
- Updated `docs/architecture.md` ADR-002

### T3 — Feature-scoring CV structure parser (`CV.3`)

**Consumes:** `ParsedResume`, `emptyParsedResume` from `@/lib/validation/resume`  
**Produces:**
- Upgraded `web/lib/resume/parse-structure.ts`:
  - `parseResumeStructure(rawText: string): ParsedResume`
  - Feature-scored contact header extraction (Title Case + `ALL CAPS` + multi-token names, international phone numbers, LinkedIn, GitHub/websites, `City, ST` / `City, Country` / `Remote` locations)
  - Expanded section header matcher + inline `Skills:` / `Certifications:` / `Languages:` rescue
  - Subsection block splitter using date-range anchors and bullet-to-header transitions
  - Feature-scored Experience attribute assignment (`title`, `company`, `location`, `startDate`, `endDate`, `description`) and Education attribute assignment (`institution`, `degree`, `field`, `startDate`, `endDate`, `description`)
  - Categorized skill list parser (stripping `Category:` prefixes while preserving parenthetical groups)

### T4 — Sample CV corpus, binary PDF/DOCX builders, test suite & CLI runner (`CV.4`)

**Consumes:** T2 (`extractResumeText`), T3 (`parseResumeStructure`)  
**Produces:**
- 5 sample CVs under `web/__tests__/fixtures/cvs/`
- `web/__tests__/helpers/cv-binary-builders.ts`:
  - `buildSamplePdfBuffer(lines: Array<{ text: string; rightText?: string } | string>): Buffer`
  - `buildSampleDocxBuffer(lines: string[]): Buffer`
- Expanded unit & end-to-end tests in `web/__tests__/resume-parse-structure.test.ts` and `web/__tests__/resume-extract-and-parse.test.ts`
- CLI evaluation script `web/scripts/test-cv-extraction.ts`

## Build order

```
T1 → T2 → T3 → T4
```

## Interfaces (cross-task)

```ts
// web/lib/resume/extract-text.ts
export type ExtractTextResult =
  | { ok: true; text: string }
  | { ok: false; error: string };

export async function extractResumeText(
  bytes: Buffer,
  mimeType: string
): Promise<ExtractTextResult>;

// web/lib/resume/parse-structure.ts
export function parseResumeStructure(rawText: string): ParsedResume;

// web/__tests__/helpers/cv-binary-builders.ts
export function buildSamplePdfBuffer(
  lines: Array<string | { left: string; right?: string }>
): Buffer;
export function buildSampleDocxBuffer(lines: string[]): Buffer;
```

## Risks

- Minimal hand-crafted PDF buffers must have valid cross-reference byte offsets so `unpdf` / `pdf.js` parses `getTextContent()` cleanly without warnings.
- Minimal DOCX buffers must be valid PKZIP archives containing `[Content_Types].xml`, `_rels/.rels`, and `word/document.xml` so `mammoth.extractRawText` extracts paragraphs cleanly.
