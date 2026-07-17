# Spec: MVP Phase 5 — Cover letter & application messages

| Field | Value |
|-------|--------|
| **Status** | Accepted (Autopilot grant) |
| **Date** | 2026-07-17 |
| **Branch** | `feat/phase-5-cover-letter-messages` |
| **Worktree** | `.worktree/job-9-cover-letter` |
| **Linear parent** | [JOB-9](https://linear.app/job-prep-website/issue/JOB-9/build-cover-letter-and-application-message-generator) |
| **Children** | [JOB-42](https://linear.app/job-prep-website/issue/JOB-42), [JOB-43](https://linear.app/job-prep-website/issue/JOB-43), [JOB-44](https://linear.app/job-prep-website/issue/JOB-44), [JOB-45](https://linear.app/job-prep-website/issue/JOB-45) |
| **Depends on** | Phase 4 (profile, resume, JD match, OpenRouter stack) |
| **Subagent model** | Composer 2.5 (`grok-composer-2.5-fast`) |
| **AI key** | `OPENROUTER_API_KEY` in `web/.env.local` (server-only) |

## 1. Goal

Authenticated, onboarded users with a parsed resume can:

1. **Generate a tailored cover letter** grounded in their profile + resume and an optional saved job description.
2. **Edit, save, copy, and regenerate** the draft (full or section-aware) without losing ownership of prior versions.
3. **Generate short application messages** (recruiter DM, referral request, application note) with the same grounding rules.
4. See all outputs clearly labeled as **editable draft** content — never as final “send as-is” copy.

This completes Milestone 2’s application-readiness tools after checker / JD match / prep plan (Phase 4).

## 2. AI provider (reuse ADR-003)

No new provider decision. Reuse:

- `web/lib/ai/config.ts` — primary + fallback models
- `web/lib/ai/openrouter.ts` — `generateObjectWithFallback`
- Server-only Server Actions; never expose keys to the client
- Structured output validated with **zod**; reject invalid payloads with a safe user-facing error via `userFacingAiError`
- Prompts **must forbid inventing** experience, employers, dates, metrics, or skills not present in user-provided context

## 3. Scope

### In scope

**JOB-42 — Application draft data model**

- Prisma `ApplicationDraft` (and versioning strategy — see §4)
- Link to authenticated user; optional `jobDescriptionId`, `resumeDocumentId`
- Types: cover letter + short message variants
- Ownership enforced on all reads/writes

**JOB-43 — AI cover letter generation**

- Generate structured draft from profile + resume text (+ optional JD)
- Tone options: `professional` | `enthusiastic` | `formal` | `concise` (concise also constrains length)
- Length options: `short` | `medium` | `long`
- Full regenerate and section regenerate (intro / body / closing) without wiping unrelated sections when section mode is used
- Persist generation metadata (model, options, source IDs)

**JOB-44 — Cover letter editor UI**

- Replace `/cover-letter` placeholder
- Controls: tone, length, resume select, optional JD select, generate, regenerate, section regenerate, save, copy
- Show source context summary (target role, resume filename, JD title/company when set)
- Loading and error states; “Editable draft” banner
- List latest drafts / open a prior draft

**JOB-45 — Short message generator**

- Message types: `recruiter_dm` | `referral_request` | `application_note`
- Same draft model (`type` discriminator)
- Generate / edit / copy / save; draft labeling
- UI can live on the same `/cover-letter` page as a tab or second section

**Shared**

- Auth + ownership on every action
- Unit tests for zod schemas and ownership helpers (mocked AI)
- Dashboard link chip for latest cover letter draft (lightweight)
- Docs: `docs/database.md` model row; architecture note if needed (no new ADR)

### Out of scope

- JOB-79 research
- PDF export / Word download of letters
- Multi-language generation
- Sending email/LinkedIn DMs for the user
- Streaming token-by-token UI (basic loading is enough)
- Claiming hire probability or interview guarantees
- Mock interview / assessments / videos

## 4. Data models

Prefer JSON for AI section payloads where useful; keep queryable columns for list UX.

```prisma
enum ApplicationDraftType {
  // Stored as String in Prisma for MVP simplicity if enums are awkward; prefer string constants:
  // cover_letter | recruiter_dm | referral_request | application_note
}

model ApplicationDraft {
  id                 String   @id @default(cuid())
  userId             String   @db.Uuid
  user               User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  // cover_letter | recruiter_dm | referral_request | application_note
  type               String
  title              String
  // draft | generating | failed
  status             String   @default("draft")
  tone               String?  // professional | enthusiastic | formal | concise
  length             String?  // short | medium | long (cover letter primarily)
  // Editable body the user owns after generation or manual edit
  content            String   @db.Text
  // Optional structured sections for section regenerate (cover letters)
  // { intro?: string, body?: string, closing?: string }
  sections           Json?
  // Snapshot of generation options / provenance
  // { tone, length, messageType?, model?, sourceProfileTargetRole?, … }
  meta               Json?
  jobDescriptionId   String?
  jobDescription     JobDescription? @relation(fields: [jobDescriptionId], references: [id], onDelete: SetNull)
  resumeDocumentId   String?
  resumeDocument     ResumeDocument? @relation(fields: [resumeDocumentId], references: [id], onDelete: SetNull)
  // Version lineage: null = root; pointing to prior draft id when superseding
  supersedesId       String?
  version            Int      @default(1)
  model              String?
  errorMessage       String?
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  @@index([userId])
  @@index([userId, type])
  @@index([jobDescriptionId])
  @@index([resumeDocumentId])
}
```

### Versioning rules

1. **Save edits** update the same row’s `content` / `sections` / `title` / `updatedAt`.
2. **Regenerate full draft** creates a **new** row with `version = prior.version + 1` and `supersedesId = prior.id` (history available), and becomes the latest for that type+sources when listing.
3. **Section regenerate** may update only the targeted section in `sections`, then recompose `content` from sections; still counts as a save on the current row unless the product chooses a new version (MVP: update in place for section regen to avoid history spam).

MVP list UI: show last 10 drafts for the user ordered by `updatedAt desc`.

## 5. Validation schemas (zod)

Location: `web/lib/validation/application-draft.ts`

```ts
export const draftTypeSchema = z.enum([
  "cover_letter",
  "recruiter_dm",
  "referral_request",
  "application_note",
]);
export const toneSchema = z.enum([
  "professional",
  "enthusiastic",
  "formal",
  "concise",
]);
export const lengthSchema = z.enum(["short", "medium", "long"]);
export const sectionKeySchema = z.enum(["intro", "body", "closing"]);

export const coverLetterSectionsSchema = z.object({
  intro: z.string(),
  body: z.string(),
  closing: z.string(),
});

export const coverLetterGenerationSchema = z.object({
  title: z.string(),
  sections: coverLetterSectionsSchema,
  // Full letter for convenience (must match composed sections)
  content: z.string(),
  evidenceNotes: z.array(z.string()).max(12).optional(),
});

export const shortMessageGenerationSchema = z.object({
  title: z.string(),
  content: z.string(),
  evidenceNotes: z.array(z.string()).max(8).optional(),
});
```

Length guidance (prompt, not hard schema max beyond reasonable):

| Length | Cover letter target |
|--------|---------------------|
| short | ~150–250 words |
| medium | ~250–400 words |
| long | ~400–600 words |

Short messages: ~40–120 words depending on type.

## 6. Interfaces

### AI services — `web/lib/ai/cover-letter.ts`

```ts
export type CoverLetterInput = {
  targetRole: string;
  experienceLevel: string;
  targetIndustry?: string;
  skills?: string[];
  resumeText: string;
  jobTitle?: string | null;
  company?: string | null;
  jobText?: string | null;
  tone: z.infer<typeof toneSchema>;
  length: z.infer<typeof lengthSchema>;
};

export async function generateCoverLetter(
  input: CoverLetterInput
): Promise<z.infer<typeof coverLetterGenerationSchema>>;

export async function regenerateCoverLetterSection(
  input: CoverLetterInput & {
    section: "intro" | "body" | "closing";
    currentSections: z.infer<typeof coverLetterSectionsSchema>;
  }
): Promise<z.infer<typeof coverLetterSectionsSchema>>;
```

### AI services — `web/lib/ai/application-message.ts`

```ts
export type ShortMessageInput = {
  messageType: "recruiter_dm" | "referral_request" | "application_note";
  targetRole: string;
  experienceLevel: string;
  resumeText: string;
  jobTitle?: string | null;
  company?: string | null;
  jobText?: string | null;
  tone: z.infer<typeof toneSchema>;
};

export async function generateShortMessage(
  input: ShortMessageInput
): Promise<z.infer<typeof shortMessageGenerationSchema>>;
```

### Server actions — `web/app/actions/application-draft.ts`

```ts
export async function generateCoverLetterAction(form: {
  resumeDocumentId?: string;
  jobDescriptionId?: string;
  tone: string;
  length: string;
  supersedesId?: string;
}): Promise<{ ok: true; draftId: string } | { ok: false; error: string }>;

export async function regenerateCoverLetterSectionAction(form: {
  draftId: string;
  section: "intro" | "body" | "closing";
}): Promise<{ ok: true; draftId: string } | { ok: false; error: string }>;

export async function generateShortMessageAction(form: {
  messageType: "recruiter_dm" | "referral_request" | "application_note";
  resumeDocumentId?: string;
  jobDescriptionId?: string;
  tone: string;
  supersedesId?: string;
}): Promise<{ ok: true; draftId: string } | { ok: false; error: string }>;

export async function saveApplicationDraftAction(form: {
  draftId: string;
  title?: string;
  content: string;
  sections?: { intro: string; body: string; closing: string };
}): Promise<{ ok: true } | { ok: false; error: string }>;

export async function listApplicationDraftsAction(): Promise<
  { ok: true; drafts: Array<{ id: string; type: string; title: string; updatedAt: string }> }
  | { ok: false; error: string }
>;
```

All actions: `requireUser()`, verify ownership of draft / resume / JD, require onboarding + resume content (same patterns as Phase 4).

## 7. UI workflows

### Primary route: `/cover-letter`

1. Server Component loads profile, resumes, recent JDs, latest drafts, optional `?draftId=`.
2. Client editor:
   - Tabs or segmented control: **Cover letter** | **Short messages**
   - Form controls + large textarea (content)
   - For cover letters: optional section panels (intro/body/closing) that stay in sync with content on save
   - Buttons: Generate, Regenerate full, Regenerate section (when section selected), Save, Copy
   - Badge: “Editable draft — review before sending”
3. Empty states: no resume → link to `/resume`; no JD optional with profile-only generation.

### Dashboard

- Card or link: “Cover letter” with “Latest draft” title or “Not started” → `/cover-letter`.

## 8. Edge cases

| Case | Behavior |
|------|----------|
| No onboarding | Error: complete onboarding |
| No parsed resume | Error: upload/parse first |
| Resume empty raw/parsed | Error via `assertResumeHasContent` |
| JD id not owned | Error: not found / access denied |
| AI failure | Draft status `failed` if a pending row was created; or return action error without orphan if generation fails before create — prefer create after success for full generate, or pending→failed pattern consistent with Phase 4 |
| Missing OPENROUTER key | User-facing config message |
| Section regen without sections JSON | Re-split content heuristically or require sections; prefer regenerate full if sections missing |
| Concurrent saves | Last write wins (MVP) |

**Generation persistence preference (align with Phase 4):** create row as `generating`, then update to `draft` with content on success, or `failed` with `errorMessage` on failure.

## 9. Success criteria

- [ ] User can generate a cover letter from profile + resume (+ optional JD)
- [ ] Tone and length options affect generation prompts
- [ ] User can edit, save, and copy drafts
- [ ] Full regenerate creates a new version linked via `supersedesId`
- [ ] Section regenerate updates intro/body/closing without inventing experience
- [ ] Short messages for three types generate, edit, save, copy
- [ ] Ownership enforced; drafts only visible to owner
- [ ] UI labels content as editable draft
- [ ] Unit tests pass for schemas; full `npm test` + typecheck + lint green in `web/`
- [ ] `docs/database.md` updated; Phase 5 tasks checked in `TODO.md`

## 10. Constraints

- Match existing UI patterns (shadcn Card/Button/Textarea/Badge, dashboard layout)
- Keep comments sparse; no compatibility shims
- Single trailing newline on every file
- Implementers: **no git** operations
- Skip JOB-79 entirely
- Do not change OpenRouter model defaults outside `web/lib/ai/config.ts`

## 11. Lightweight plan pointer

See [docs/superpowers/plans/2026-07-17-phase-5-cover-letter-messages.md](../superpowers/plans/2026-07-17-phase-5-cover-letter-messages.md).
