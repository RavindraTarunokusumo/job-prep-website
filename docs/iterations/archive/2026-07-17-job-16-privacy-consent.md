# Archive — JOB-16 privacy, consent, and AI-use disclaimers

| Field | Value |
|-------|-------|
| **Merged** | 2026-07-17 |
| **PR** | https://github.com/RavindraTarunokusumo/job-prep-website/pull/8 |
| **Merge commit** | `a900b092ae28783bd27f387cc57bca1fef383059` |
| **Branch** | `feat/job-16-privacy` |
| **Spec** | `docs/specs/2026-07-17-mvp-job-16-privacy-consent.md` |
| **Plan** | `docs/superpowers/plans/2026-07-17-job-16-privacy-consent.md` |
| **Linear parent** | JOB-16 |
| **Children** | JOB-71, JOB-72, JOB-73, JOB-74 |
| **Worktree** | `.worktree/job-16-privacy` |

## Feature commits

| Hash | Subject |
|------|---------|
| `9601923` | docs: accept JOB-16 privacy and consent spec (Wave 1) |
| `5b47253` | feat(legal): privacy and AI-use copy plus legal pages (JOB-71) |
| `babb245` | feat(privacy): upload and AI consent gates (JOB-72) |
| `d7303df` | feat(privacy): data export and deletion requests (JOB-73) |
| `00d8639` | docs(privacy): QA checklist for consent and disclaimer coverage (JOB-74) |
| `05215e8` | fix(privacy): reliable export download and deletion confirm |

## Completed phase section (snapshot)

## JOB-16 — Privacy, consent, and AI-use disclaimers

**Linear parent:** JOB-16 · Milestone 4 (shipped early with Wave 1) · Medium→High children

### Tasks

- [x] **JOB-71** Privacy / AI-use copy and legal pages — `5b47253`
- [x] **JOB-72** Upload and AI consent gates — `babb245`
- [x] **JOB-73** Data export and deletion requests — `d7303df`
- [x] **JOB-74** QA checklist for consent and disclaimer coverage — `00d8639`
- Review fix: reliable export download and deletion confirm — `05215e8`

### Outcomes

- Centralized legal/privacy copy on `/privacy` and `/ai-use`
- Consent gates before CV upload and first AI analysis on career materials
- Settings path for data export and deletion requests
- QA checklist documenting disclaimer coverage across AI surfaces

### Exit criteria

- Users see clear privacy/AI-use messaging and can request export/deletion
- Sensitive actions require acknowledgment before proceeding

### Merge ID

Wave 1 Autopilot merge: PR #8 → `a900b092ae28783bd27f387cc57bca1fef383059`

### Open follow-ups

- None for JOB-16 scope; keep disclaimer coverage in mind when adding new AI surfaces (Phase 6 feedback, report, etc.)
