# Spec: Offline Rule-Based CV Text & Structure Extraction

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Date** | 2026-11-01 |
| **Branch** | `feat/rule-based-cv-extraction` |
| **Supersedes** | `docs/specs/2026-09-18-resume-parser-reliability-fix.md`, ADR-002 GLiNER experimental path |
| **Refs** | ADR-002 (`docs/architecture.md`), OpenResume feature-scoring architecture |

## 1. Context & Problem

CV document text and structure extraction previously relied on a basic regex/line-header heuristic (`web/lib/resume/parse-structure.ts`) supplemented by an optional Python GLiNER2 sidecar (`scripts/gliner_resume_parse.py`, `web/lib/resume/parse-with-gliner.ts`).

This setup proved unsustainable:
1. **Operational fragility:** GLiNER2 requires a local Python virtual environment (`.venv-gliner`), PyTorch CPU wheels, HuggingFace model weights, and cross-process `spawn` on every CV upload.
2. **Root-cause diagnosis of why the existing rule-based parser failed on real PDFs (ADR-002):**
   - **PDF line collapse (`web/lib/resume/extract-text.ts`):** `unpdf`'s `extractText(pdf, { mergePages: true })` joins PDF text items using spaces whenever `item.hasEOL` is not explicitly marked in the PDF stream, or splits columns inconsistently. Because `parseResumeStructure` relies on newline boundaries (`\n`) to identify section headers and entry blocks, collapsed PDF text produces 0 experience rows, empty education, and missed contact names.
   - **Brittle entry header rules (`web/lib/resume/parse-structure.ts`):**
     - `extractContactFromHeader` only matches strict Title Case names (`/^[A-Z][a-z]+(\s+[A-Z][a-z'.-]+){0,3}$/`) and US-style `City, ST` locations, missing `ALL CAPS` names, accented/multi-token names, and `City, Country` locations.
     - `splitSectionBlocks` and `parseEntryBlock` assume entries are separated by blank lines or `|` / `—` / ` - ` delimiters, and assume dates sit on their own line rather than right-aligned on the same line as a job title or company.
     - `parseSkills` does not strip inline category prefixes (e.g., `Languages & Frameworks: TypeScript, Python, Go`).

## 2. Goal

Replace the GLiNER sidecar completely with a deterministic, offline, zero-model TypeScript CV extraction pipeline that:
1. Reconstructs visual lines and horizontal column/tab gaps directly from PDF $(x, y)$ text-item coordinates.
2. Uses a rule-based **Feature-Scoring System** (inspired by OpenResume) + expanded section/entity gazetteers to reliably extract `contact`, `summary`, `experience`, `education`, `skills`, `projects`, `certifications`, and `languages`.
3. Validates extraction quality against a comprehensive corpus of sample CVs across both plain-text fixtures and real programmatically generated PDF and DOCX binary documents.

## 3. Requirements & Architecture

### 3.1 Stage 1: Coordinate-Aware PDF Text Extraction (`web/lib/resume/extract-text.ts`)

Instead of relying solely on `extractText(pdf, { mergePages: true })`:
- Iterate through each page of the `unpdf` document proxy (`await pdf.getPage(pageNum)`) and retrieve `await page.getTextContent()`.
- For each page containing positioned text items (`str`, `transform` matrix $[a, b, c, d, x, y]$, `width`, `height`, `hasEOL`):
  - **Line grouping by vertical baseline:** Group items whose $y$-coordinates fall within a baseline tolerance ($\Delta y \le 3\text{pt}$). Sort lines top-to-bottom (descending $y$ in PDF coordinate space) and items within each line left-to-right (ascending $x$).
  - **Horizontal gap normalization:** When joining adjacent items on the same line, inspect the horizontal gap $\Delta x = x_{\text{next}} - (x_{\text{prev}} + \text{width}_{\text{prev}})$:
    - If $\Delta x > 24\text{pt}$ (typical of right-aligned dates or locations tab-separated from a job title or institution), insert `" | "` (unless a delimiter like `|`, `-`, `–`, `—`, `•` is already present at the boundary).
    - If $\Delta x > 1.5\text{pt}$, insert a single space `" "`.
    - Otherwise concatenate directly (handling kerning splits within words).
  - **Paragraph spacing:** When the vertical distance between consecutive lines exceeds $1.75 \times$ the median line height, emit a blank line (`\n\n`) so visual blocks are preserved.
- Fall back to `extractText(pdf, { mergePages: true })` if a PDF page yields no positioned items.
- DOCX extraction continues to use `mammoth.extractRawText({ buffer: bytes })` with normalized whitespace and bullet characters.

### 3.2 Stage 2: Section Segmentation (`web/lib/resume/parse-structure.ts`)

- **Header normalization:** Strip leading bullets, numbering, decorative symbols, and trailing colons/dashes before testing against section header patterns.
- **Expanded section dictionary:**
  - `summary`: `summary`, `professional summary`, `executive summary`, `profile`, `professional profile`, `about`, `about me`, `objective`, `career objective`
  - `experience`: `experience`, `work experience`, `professional experience`, `employment`, `employment history`, `work history`, `career history`, `relevant experience`, `industry experience`
  - `education`: `education`, `academic background`, `academic qualifications`, `qualifications`, `education & training`, `education and training`, `academics`
  - `skills`: `skills`, `technical skills`, `core competencies`, `competencies`, `technologies`, `skills & technologies`, `skills and technologies`, `technical proficiencies`, `areas of expertise`, `tooling & skills`
  - `projects`: `projects`, `personal projects`, `selected projects`, `key projects`, `academic projects`, `notable projects`
  - `certifications`: `certifications`, `licenses & certifications`, `licenses and certifications`, `credentials`, `certificates`, `honors & certifications`, `awards & certifications`
  - `languages`: `languages`, `spoken languages`, `language proficiency`
- **Inline section rescue:** If `skills`, `certifications`, or `languages` appear inline as `Header: item1, item2` on a single line, extract the payload directly.

### 3.3 Stage 3: Feature-Scoring Attribute Extraction (`web/lib/resume/parse-structure.ts`)

#### A. Contact Header Extraction
- Scans lines preceding the first section header (plus fallback scan of top lines for email/phone/links).
- **Email, Phone, LinkedIn, Website/GitHub:** Extracted via deterministic regexes (supporting international phone numbers like `+62 812-3456-7890`, `+44 20 7946 0958`, `(555) 234-5678`, and portfolio/GitHub URLs).
- **Location:** Matches `City, ST`, `City, Country` (using a curated country/region & state pattern), or `Remote` / `Hybrid` tokens in header segments.
- **Candidate Name (Feature-Scored):** Evaluates header segments/lines using weighted features:
  - `+4`: 2 to 5 alphabetic word tokens (supporting Title Case, `ALL CAPS`, hyphens, apostrophes, periods, and Latin diacritics).
  - `+2`: First non-empty line of the document.
  - `-10`: Contains email, phone number, URL, date range, or section header keyword.
  - `-6`: Contains job-title role words (`Engineer`, `Developer`, `Manager`, `Analyst`, `Designer`, `Consultant`, `Curriculum Vitae`, `Resume`) or location/address indicators.
  - Normalizes `ALL CAPS` names to clean Title Case or preserves original casing if mixed.

#### B. Experience & Education Subsection Grouping and Feature Scoring
- **Date Range Detector & Extractor:**
  - Matches full date ranges (`Jan 2021 – Present`, `January 2019 - March 2022`, `05/2020 – 08/2022`, `2018 - 2021`, `2020 – Current`, `Expected May 2026`, `Class of 2022`).
  - Capable of extracting an inline date range from the end or pipe-segment of a header line and returning both `{ startDate, endDate }` and the remaining text on that line.
- **Subsection Splitting (`splitSectionBlocks`):**
  - Splits on blank lines when the current chunk already contains a complete entry (has a date range or bullet descriptions).
  - Splits when a new line starts a new entry header (e.g., contains a date range after description/bullet lines have already been collected, or transitions from bullet lines `- / •` back to a non-bullet header line that is followed by or contains a date range).
- **Experience Entry Scoring:**
  - Within each entry's header lines/segments (after stripping extracted date ranges), scores candidate segments for:
    - **Job Title (`title`):** Positive weights for role keywords (`Engineer`, `Developer`, `Architect`, `Manager`, `Lead`, `Director`, `Analyst`, `Scientist`, `Designer`, `Intern`, `Consultant`, `Specialist`, `Coordinator`, `Administrator`, `Researcher`, `Officer`, `VP`, `Head of`, `Senior`, `Junior`, `Staff`, `Principal`, `Full Stack`, `Frontend`, `Backend`, `Software`, `Product`, `Data`, `DevOps`, `QA`).
    - **Company (`company`):** Positive weights for organization suffixes (`Inc`, `LLC`, `Ltd`, `Corp`, `GmbH`, `PT`, `Tbk`, `Technologies`, `Systems`, `Solutions`, `Labs`, `Group`, `Studio`, `Bank`, `Partners`, `Agency`, `Holdings`, `Co.`), `at <Company>` syntax, or second position in `Title | Company | Location` / `Title — Company`.
    - **Location (`location`):** Positive weights for `Remote`, `Hybrid`, `City, ST`, `City, Country`.
  - Lines starting with bullets (`-`, `*`, `•`, `·`, `▪`, `‣`) or narrative lines following the header/date are joined into `description`.
- **Education Entry Scoring:**
  - Within each education entry, scores segments for:
    - **Institution (`institution`):** Positive weights for `University`, `Institute`, `College`, `School`, `Academy`, `Polytechnic`, `Universitas`, `Institut`.
    - **Degree (`degree`) & Field (`field`):** Positive weights for degree keywords (`B.S.`, `B.Sc.`, `B.A.`, `B.Eng.`, `M.S.`, `M.Sc.`, `M.A.`, `M.Eng.`, `MBA`, `Ph.D.`, `Bachelor`, `Master`, `Doctor`, `Associate`, `Diploma`, `Bootcamp`).
    - Automatically splits degree + field patterns such as `"B.S. in Computer Science"` or `"Bachelor of Science, Software Engineering"` so `degree` holds the full or degree title and `field` is populated when recognizable.
    - Captures GPA, Honors, or Relevant Coursework lines into `description`.

#### C. Skills, Projects, Certifications, and Languages
- **Skills:** Splits by newlines, bullets, pipes, semicolons, or commas. Strips category labels (`Languages: TypeScript, Python` $\rightarrow$ `["TypeScript", "Python"]`) while preserving balanced parentheses (e.g., `SQL (PostgreSQL, MySQL)`). Deduplicates case-insensitively.
- **Projects:** Splits project blocks by title lines (supporting `Project Name | Tech Stack | Link` or `Project Name — Description`), extracting `name`, `description`, and optional `technologies`.
- **Certifications & Languages:** Parses list items cleanly and filters out non-certification noise (e.g., GPA lines).

### 3.4 Complete GLiNER Removal
- Delete `scripts/gliner_resume_parse.py` and `web/lib/resume/parse-with-gliner.ts`.
- Update `web/app/actions/resume.ts` to call `parseResumeStructure(extracted.text)` directly with no GLiNER branch or `isGlinerStructureEnabled` check.
- Update `docs/architecture.md` ADR-002 to reflect the offline rule-based feature-scoring architecture and removal of GLiNER.

## 4. Sample CVs & Evaluation / Test Suite

1. **Sample CV Fixtures (`web/__tests__/fixtures/cvs/`):**
   - `01-chronological-swe.txt`: Standard chronological software engineer CV with pipe delimiters, categorized skills, projects, certifications, and languages.
   - `02-tab-aligned-international.txt`: All-caps multi-token name (`RAVINDRA ARIBOWO TARUNOKUSUMO`), international phone/location (`Jakarta, Indonesia`), tab/space-aligned inline dates on role headers, `B.Sc. in Computer Science`, and multiple roles/degrees.
   - `03-collapsed-dense.txt`: Dense layout without blank lines between roles or pipe separators (`Company` on line 1, `Title` on line 2, `Date` on line 3, followed by bullets), testing feature-scoring disambiguation of title vs company.
   - `04-academic-career-switcher.txt`: Alternative section headings (`Qualifications`, `Employment History`, `Core Competencies`, `Selected Projects`, `Credentials`), `M.S. in Data Science`, research & industry roles, and inline skills.
   - `05-minimal-and-edge-cases.txt`: Single-role junior/intern CV with inline `Skills:` and `Languages:`, plus malformed/noise resilience.
2. **Real Binary PDF & DOCX Sample Generation & End-to-End Tests (`web/__tests__/resume-extract-and-parse.test.ts` + `web/scripts/test-cv-extraction.ts`):**
   - Deterministic helper that builds valid binary PDF (with positioned text operators `Td`/`Tj`/`Tm` testing coordinate line reconstruction and horizontal tab gaps) and valid binary DOCX (`.docx` zip with `word/document.xml` paragraphs) for sample CVs.
   - Unit and integration tests in Vitest verifying `extractResumeText(bytes, mimeType)` $\rightarrow$ `parseResumeStructure(rawText)` across all sample CVs.
   - Standalone CLI script `web/scripts/test-cv-extraction.ts` (`npx tsx scripts/test-cv-extraction.ts`) that runs all sample CVs (text, PDF, DOCX) through the extraction pipeline and prints a structured accuracy summary table.

## 5. Acceptance Criteria

- [ ] `scripts/gliner_resume_parse.py` and `web/lib/resume/parse-with-gliner.ts` are removed; `web/app/actions/resume.ts` has zero GLiNER references.
- [ ] `extractResumeText` reconstructs lines and horizontal column/date gaps from PDF text item coordinates via `unpdf`.
- [ ] `parseResumeStructure` extracts contact (including ALL-CAPS/multi-token names and international locations/phones), summary, multi-role experience (title, company, location, startDate, endDate, description), multi-degree education (institution, degree, field, dates), categorized skills, projects, certifications, and languages across all 5 sample CV archetypes.
- [ ] Real binary PDF and DOCX sample CVs pass end-to-end extraction (`extractResumeText` $\rightarrow$ `parseResumeStructure`).
- [ ] CLI evaluation script `web/scripts/test-cv-extraction.ts` runs cleanly and reports pass across all sample CVs.
- [ ] Full `web/` verification suite passes: `npm run lint && npm run typecheck && npm test && npm run build`.
