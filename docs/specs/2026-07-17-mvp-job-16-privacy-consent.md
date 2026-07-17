# Spec: JOB-16 — Privacy, consent, and AI-use disclaimers

| Field | Value |
|-------|--------|
| **Status** | Accepted (Autopilot grant — Wave 1) |
| **Date** | 2026-07-17 |
| **Branch** | `feat/job-16-privacy` |
| **Worktree** | `.worktree/job-16-privacy` |
| **Linear parent** | [JOB-16](https://linear.app/job-prep-website/issue/JOB-16) |
| **Children** | JOB-71…74 |
| **Depends on** | Existing auth, resume upload, AI surfaces |
| **Subagent model** | Composer 2.5 (`grok-composer-2.5-fast`); fallback `grok-4.5` |

## 1. Goal

Make the MVP safer and more trustworthy by:

1. Clear **privacy / AI-use copy** on legal pages and near sensitive actions
2. **Consent gates** before CV upload and before first AI analysis on career materials (session-persisted acknowledgment)
3. Practical **data deletion / export request** path from Settings
4. Lightweight **QA checklist** doc for privacy messaging coverage

## 2. Scope

### JOB-71 — Copy

Centralize reusable copy in `web/lib/legal/copy.ts` (or `web/content/legal.ts`):

| Key | Purpose |
|-----|---------|
| `privacySummary` | Short privacy bullets |
| `uploadConsent` | Before CV upload |
| `aiGuidanceDisclaimer` | AI outputs are guidance / drafts |
| `jobFitLimitations` | Match scores are not hiring decisions |
| `interviewFeedbackDisclaimer` | Coaching only |
| `assessmentNonClinical` | Practice only, non-clinical |
| `careerRecommendationLimits` | Plans are suggestions |
| `dataRights` | Export/delete request language |

Fill `/privacy` and `/ai-use` with real readable pages (not placeholders) using this copy + expanded body.

### JOB-72 — Consent gates

- **Upload:** checkbox “I understand RoleReady will store my CV to parse and review it…” must be checked before submit (`UploadForm` + server reject if missing)
- **AI workflows:** lightweight `AiConsentBanner` or gate on first use of AI actions — store acknowledgment:
  - Prefer **Prisma** `UserConsent` model: `userId`, `kind` (`upload` | `ai_processing`), `version`, `acceptedAt`
  - Or cookie + DB; DB preferred for auditability
- Server actions for resume review / job match / cover letter / prep plan: if no `ai_processing` consent, return error prompting accept (or accept via action param + checkbox on forms)
- Keep UX simple: one shared `AiUseConsent` client component reused on AI pages

**MVP scope of AI gate pages:** resume review, job match, cover letter, prep plan (existing). Interview/assessment can show disclaimer banners only if those features are not on this branch — use copy keys so other branches can import later without conflict. **Do not implement interview/assessment features here.**

### JOB-73 — Deletion / export request

- Settings section “Your data”
- Actions:
  - `requestDataExportAction` — creates `DataRequest` row (`type=export`, `status=pending`) and shows confirmation
  - `requestDataDeletionAction` — creates `DataRequest` (`type=deletion`)
- MVP does **not** auto-delete all storage; records the request for operator handling; show expected response language (“we’ll process within …”)
- Optional: export JSON of profile + non-file metadata immediately as downloadable response for true MVP value (`exportUserDataAction` returning JSON) **plus** log the request

Recommended dual approach:

1. Immediate JSON export of profile, document metadata (not file bytes), recent analysis ids
2. Persist request for full deletion/file handling

### JOB-74 — QA checklist

- `docs/privacy-qa-checklist.md` listing routes/components that must show consent/disclaimers
- Unit test: copy keys non-empty; consent schema validates

### Out of scope

- Full legal counsel-approved privacy policy (plainspoken MVP copy only)
- Automated GDPR erasure pipeline for storage objects
- Cookie consent banner for marketing analytics (no marketing pixels yet)
- Implementing JOB-11/13 features

## 3. Data models

```prisma
model UserConsent {
  id         String   @id @default(cuid())
  userId     String   @db.Uuid
  user       User     @relation(...)
  // upload | ai_processing
  kind       String
  version    String   // copy version string e.g. "2026-07-17"
  acceptedAt DateTime @default(now())
  createdAt  DateTime @default(now())

  @@unique([userId, kind, version])
  @@index([userId])
}

model DataRequest {
  id          String   @id @default(cuid())
  userId      String   @db.Uuid
  user        User     @relation(...)
  // export | deletion
  type        String
  // pending | completed | rejected
  status      String   @default("pending")
  note        String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId])
}
```

## 4. Interfaces

```ts
export const CONSENT_COPY_VERSION = "2026-07-17";
export async function acceptConsentAction(kind: "upload" | "ai_processing"): Promise<Result>;
export async function hasConsent(userId: string, kind: ...): Promise<boolean>;
export async function requestDataExportAction(): Promise<Result & { requestId?: string; payload?: object }>;
export async function requestDataDeletionAction(): Promise<Result & { requestId?: string }>;
```

## 5. Success criteria

- [ ] `/privacy` and `/ai-use` are real pages
- [ ] Upload blocked without consent checkbox + server check
- [ ] AI consent recorded before/with first AI action path
- [ ] Settings offers export + deletion request
- [ ] Checklist doc + simple tests
- [ ] Full `web/` lint, typecheck, test, build

## 6. Constraints

- Do not block public marketing routes
- Avoid legal overclaiming (“guaranteed deletion in 24h”, “HIPAA”, etc.)
- Minimal touch to AI action files: prefer shared `requireAiConsent(userId)` helper
- Single trailing newline; no git from implementers
`
