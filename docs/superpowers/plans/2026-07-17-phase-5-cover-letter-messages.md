# Lightweight plan: Phase 5 — Cover letter & application messages

**Spec:** [docs/specs/2026-07-17-mvp-phase-5-cover-letter-messages.md](../../specs/2026-07-17-mvp-phase-5-cover-letter-messages.md)  
**Branch / worktree:** `feat/phase-5-cover-letter-messages` @ `.worktree/job-9-cover-letter`  
**Implementer:** Composer 2.5 via `HOME=/root grok -p … -m grok-composer-2.5-fast --yolo --output-format json`  
**No git from implementers** — main agent commits + notes.

Cross-task **contract** only. Implementers regenerate code from signatures and Phase 4 patterns (`job-match`, `resume-review`).

---

## File structure (new/touched)

```
web/
  prisma/schema.prisma
  prisma/migrations/<ts>_phase5_application_drafts/
  lib/validation/application-draft.ts
  lib/ai/cover-letter.ts
  lib/ai/application-message.ts
  app/actions/application-draft.ts
  app/cover-letter/page.tsx
  components/cover-letter/draft-editor.tsx
  components/cover-letter/draft-list.tsx
  app/dashboard/page.tsx                 # latest draft chip/link
  __tests__/application-draft-schema.test.ts
docs/database.md
docs/specs/README.md                     # register active spec (orchestrator)
TODO.md                                  # phase 5 checkboxes (orchestrator)
```

---

## Task decomposition

### T1 — JOB-42 Application draft data model (`5.1`)

**Consumes:** existing `User`, `ResumeDocument`, `JobDescription`  
**Produces:** Prisma `ApplicationDraft` + relations + migration; validation module; tests; `docs/database.md` row

**Interfaces:**

```ts
// web/lib/validation/application-draft.ts
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
  content: z.string(),
  evidenceNotes: z.array(z.string()).max(12).optional(),
});
export const shortMessageGenerationSchema = z.object({
  title: z.string(),
  content: z.string(),
  evidenceNotes: z.array(z.string()).max(8).optional(),
});
export function parseCoverLetterGeneration(data: unknown): …;
export function parseShortMessageGeneration(data: unknown): …;
export function composeContentFromSections(sections: { intro: string; body: string; closing: string }): string;
```

Prisma fields per spec §4. Add `applicationDrafts ApplicationDraft[]` on `User`, `ResumeDocument`, `JobDescription`.

**Tests:** schema accepts fixtures; rejects empty required strings / bad enums.

**Build order:** first (blocks all).

---

### T2 — JOB-43 AI cover letter generation (`5.2`)

**Consumes:** T1 schemas, OpenRouter helpers, `assertResumeHasContent`, auth session  
**Produces:** `web/lib/ai/cover-letter.ts`, actions for generate + section regenerate (cover letter only)

**Interfaces:**

```ts
// cover-letter.ts
export type CoverLetterInput = { /* spec §6 */ };
export async function generateCoverLetter(input: CoverLetterInput): Promise<CoverLetterGeneration>;
export async function regenerateCoverLetterSection(
  input: CoverLetterInput & {
    section: "intro" | "body" | "closing";
    currentSections: CoverLetterSections;
  }
): Promise<CoverLetterSections>;
export function getCoverLetterModelId(): string;

// actions (cover letter subset in application-draft.ts)
export async function generateCoverLetterAction(...): Promise<Result>;
export async function regenerateCoverLetterSectionAction(...): Promise<Result>;
export async function saveApplicationDraftAction(...): Promise<Result>;
```

**Rules:**

- System prompt: no invented experience; mark placeholders as `[your detail]` only when needed
- Tone/length reflected in system or user prompt
- Full generate: create `generating` row → fill content/sections/meta/model → `draft` (or `failed`)
- Full regenerate with `supersedesId`: new row, `version = prior.version + 1`
- Section regen: in-place update of owned draft
- Ownership on draft/resume/JD; require onboarding

**Tests:** unit tests can mock AI module or only test pure helpers; schema tests already in T1.

**Depends on:** T1

---

### T3 — JOB-44 Cover letter editor UI (`5.3`)

**Consumes:** T2 actions + T1 list of drafts  
**Produces:** `/cover-letter` real page; `draft-editor.tsx`, `draft-list.tsx`; dashboard link

**Interfaces:**

- Server page loads: profile, resumes, recent job descriptions (id, title, company), drafts (last 10), selected draft by `?draftId=`
- Client `DraftEditor` props: options + optional initial draft
- Copy uses `navigator.clipboard.writeText`
- Banner: “Editable draft — review before sending”
- Loading/error for generate paths

**Depends on:** T2

---

### T4 — JOB-45 Short message generator (`5.4`)

**Consumes:** T1 model, OpenRouter, T3 UI shell  
**Produces:** `web/lib/ai/application-message.ts`, `generateShortMessageAction`, UI tab/section on `/cover-letter`

**Interfaces:**

```ts
export async function generateShortMessage(input: ShortMessageInput): Promise<ShortMessageGeneration>;
export async function generateShortMessageAction(form: {
  messageType: "recruiter_dm" | "referral_request" | "application_note";
  resumeDocumentId?: string;
  jobDescriptionId?: string;
  tone: string;
  supersedesId?: string;
}): Promise<{ ok: true; draftId: string } | { ok: false; error: string }>;
```

**Rules:** same grounding; draft type = messageType; length optional (omit or fixed short); edit/save/copy reuse save action.

**Depends on:** T1, T3 (UI integration); can share T2 action file patterns.

---

## Build order

```
T1 (schema + prisma) → T2 (cover letter AI + actions) → T3 (UI) → T4 (short messages + UI tab)
```

Sequential only (shared files: schema, actions, cover-letter page).

---

## Risks

| Risk | Mitigation |
|------|------------|
| Free models return weak structured JSON | `generateObjectWithFallback` + zod; user-facing error |
| Section/content drift | `composeContentFromSections` after section regen; save validates both when sections provided |
| Orphan generating rows | Always transition to draft/failed; actions return errors |
| Scope creep into export/email | Out of scope in spec |

---

## Orchestrator validation gate (every commit)

```bash
cd web && npm test && npx tsc --noEmit && npm run lint
```

Plus GitNexus `detect_changes` when available; specific `git add`; git notes template; no force-push/amend.
