# Archive — Offline Rule-Based CV Extraction & Repo CI/CD Hygiene

**Session:** 2026-11-01  
**Merges:**
- PR #19 `52dd84d69b6341bfa9660afa2d77a343b1dbe69c` (`feat/rule-based-cv-extraction` — https://github.com/RavindraTarunokusumo/job-prep-website/pull/19)
- PR #20 `abdfa916521ceb984c36ed7c9afb86d60f03521c` (`chore/ci-and-repo-hygiene` — https://github.com/RavindraTarunokusumo/job-prep-website/pull/20)

## Completed TODO items

### Offline rule-based CV text & structure extraction (PR #19 — merge `52dd84d`)

- [x] **CV.1** Spec (`7863ac5`), lightweight plan (`4c6cdd0`), and TODO setup
- [x] **CV.2** Remove GLiNER sidecar (`scripts/gliner_resume_parse.py`, `web/lib/resume/parse-with-gliner.ts`, `web/app/actions/resume.ts`), upgrade coordinate-aware PDF line reconstruction in `web/lib/resume/extract-text.ts`, and update ADR-002 in `docs/architecture.md` — `63ca2f4`
- [x] **CV.3** Implement OpenResume-style feature-scoring CV structure parser and expanded gazetteers in `web/lib/resume/parse-structure.ts` — `8b7cb34`
- [x] **CV.4** Write sample CV corpus (`web/__tests__/fixtures/cvs/`), binary PDF/DOCX builders, end-to-end extraction tests, and CLI verification script (`web/scripts/test-cv-extraction.ts`) — `2f020e1`, review polish `a146675`

### Repository CI/CD & branch hygiene (PR #20 — merge `abdfa91`)

- [x] **CI.1** Add GitHub Actions `Web CI` workflow (`.github/workflows/ci.yml`), Dependabot config (`.github/dependabot.yml`), and clean up `.pre-commit-config.yaml` (remove obsolete Python `ruff` hooks, add `check-added-large-files` and `detect-private-key`) — `a71de6a`
- [x] **CI.2** Configure GitHub repository settings (`delete_branch_on_merge: true`) and `main-branch-protection` ruleset (`id: 26326704`) requiring `Web CI` status checks, review thread resolution, and blocking deletion/force-pushes with Repository Admin bypass

## Specs & Plans

- `docs/specs/2026-11-01-rule-based-cv-extraction.md`
- `docs/superpowers/plans/2026-11-01-rule-based-cv-extraction.md`
- `docs/architecture.md` (ADR-002 updated)

## Validation

- `npm run lint` pass
- `npm run typecheck` pass
- `npm test` (41 test files, 273 tests pass)
- `npm run build` pass
- `npx tsx scripts/test-cv-extraction.ts` (7/7 sample CVs across TXT, PDF, DOCX pass)
- GitHub Actions `CI / Web CI` green on PR #20
