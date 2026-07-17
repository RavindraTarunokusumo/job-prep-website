# Lightweight plan: JOB-16 — Privacy, consent, AI disclaimers

**Spec:** [docs/specs/2026-07-17-mvp-job-16-privacy-consent.md](../../specs/2026-07-17-mvp-job-16-privacy-consent.md)  
**Branch / worktree:** `feat/job-16-privacy` @ `.worktree/job-16-privacy`  
**Implementer:** grok handoff; **no git**

---

## File structure

```
web/
  prisma/schema.prisma
  prisma/migrations/<ts>_job16_privacy/
  lib/legal/copy.ts
  lib/legal/consent.ts
  lib/validation/privacy.ts
  app/actions/privacy.ts
  app/privacy/page.tsx
  app/ai-use/page.tsx
  app/settings/page.tsx
  components/legal/ai-consent.tsx
  components/legal/disclaimer-banner.tsx
  components/resume/upload-form.tsx          # consent checkbox
  app/actions/resume.ts                     # require upload consent
  app/actions/resume-review.ts              # requireAiConsent helper
  app/actions/job-match.ts
  app/actions/prep-plan.ts
  app/actions/application-draft.ts
  __tests__/legal-copy.test.ts
  __tests__/privacy-consent-schema.test.ts
docs/database.md
docs/privacy-qa-checklist.md
TODO.md
```

---

## Tasks

### T1 — JOB-71 Copy + legal pages

`lib/legal/copy.ts`; real `/privacy` and `/ai-use`; unit test non-empty keys.

### T2 — JOB-72 Consent model + gates

Prisma `UserConsent`; `acceptConsentAction` / `requireAiConsent`; upload checkbox + server check; wire AI actions with minimal diff; shared banner/checkbox components.

### T3 — JOB-73 Data requests

Prisma `DataRequest`; settings UI; export JSON + deletion request actions.

### T4 — JOB-74 QA checklist + tests

`docs/privacy-qa-checklist.md`; any remaining tests; full suite.

---

## Build order

`T1 → T2 → T3 → T4`

## Risks

- Merge conflicts on shared action files with other Wave 1 branches — keep AI consent as a **tiny** helper call at top of each action
- Do not implement interview/assessment features
- Avoid legal overclaiming
