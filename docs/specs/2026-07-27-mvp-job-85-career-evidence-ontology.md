# Spec: JOB-85 — Shared career evidence ontology

| Field | Value |
|-------|--------|
| **Status** | Accepted (Autopilot self-accept) |
| **Date** | 2026-07-27 |
| **Branch** | `feat/job-85-92-outcome-first` |
| **Worktree** | `.worktree/autopilot-job-85-92` |
| **Linear** | [JOB-85](https://linear.app/job-prep-website/issue/JOB-85) |
| **Depends on** | Profile, ResumeDocument, JobDescription on `origin/main`; JOB-81–84 models live on unmerged PR #13 — this ontology is the canonical target both main and PR13 consumers should use |
| **Blocks** | JOB-86 (requirement→evidence mapping) |
| **AI** | None for ontology itself |

## 1. Goal

Define a **canonical, reusable data model** for candidate skills, achievements, evidence, STAR stories, seniority signals and role targets so every workflow uses the same verified source of truth.

## 2. Audit of existing sources (origin/main)

| Source | What it holds | Gap vs ontology |
|--------|---------------|-----------------|
| `Profile` | targetRole, skills[], experienceLevel, certifications[] | Free-text arrays; no verification/provenance |
| `ResumeDocument.parsedData` | Heuristic/GLiNER structure | Inferred only; not confirmed facts |
| `JobMatchAnalysis.result` | Fit bullets, scores | Ephemeral AI output; not reusable evidence |
| `InterviewTurn.feedback` | Coaching scores | Practice signal, not career fact |
| PR #13 (unmerged) `CareerEvidence` / `StarStory` | User evidence + STAR | Missing Skill entity, confidence, version, achievements, target roles, seniority signals |

## 3. Canonical entities

```
User
 ├─ Skill[]                    (normalized skill labels per user)
 ├─ CareerEvidence[]           (verified career facts)
 │   ├─ Achievement[]          (metrics/outcomes under evidence)
 │   ├─ EvidenceSkillLink[]    (M:N skills)
 │   └─ StarStory[]            (optional STAR grounded on evidence)
 ├─ StarStory[]                (also top-level for orphan drafts)
 ├─ SenioritySignal[]          (years, level, scope signals)
 └─ TargetRole[]               (role/industry targets with priority)
```

### 3.1 Skill

| Field | Type | Notes |
|-------|------|--------|
| id | cuid | |
| userId | uuid FK | cascade |
| name | string | display label |
| normalizedName | string | lowercased trimmed key for dedupe |
| category | string? | technical \| soft \| domain \| tool \| language \| other |
| verification | string | imported \| inferred \| unconfirmed \| confirmed \| archived |
| confidence | float 0–1 | default 0.5; confirmed → 1.0 |
| sourceType | string? | profile \| resume \| user \| match \| other |
| sourceId | string? | optional pointer (resume id, etc.) |
| version | int | default 1 |
| createdAt / updatedAt | | |

Unique: `(userId, normalizedName)` where not archived (enforced in app; DB unique on pair).

### 3.2 CareerEvidence

| Field | Type | Notes |
|-------|------|--------|
| id | cuid | |
| userId | uuid FK | cascade |
| title | string | |
| sourceType | string | employment \| education \| volunteering \| freelance \| project \| competition \| other |
| organization / roleTitle | string? | |
| startDate / endDate | string? | free-form periods |
| responsibilities / achievements / metrics | text? | body fields (achievements also has child table for structured) |
| verification | string | imported \| inferred \| unconfirmed \| confirmed \| archived |
| confidence | float 0–1 | |
| provenance | Json? | `{ importedFrom?, parser?, notes? }` |
| sourceNote | string? | |
| version | int | |
| createdAt / updatedAt | | |

### 3.3 Achievement

| Field | Type | Notes |
|-------|------|--------|
| id | cuid | |
| evidenceId | FK | cascade |
| userId | uuid FK | ownership |
| statement | text | |
| metricLabel / metricValue | string? | optional quantified claim |
| verification | string | same enum |
| confidence | float | |
| createdAt / updatedAt | | |

### 3.4 StarStory

| Field | Type | Notes |
|-------|------|--------|
| id | cuid | |
| userId | uuid FK | |
| evidenceId | FK? | SetNull on evidence delete |
| title | string | |
| situation / task / action / result | text | |
| readiness | string | draft \| ready \| archived |
| verification | string | unconfirmed \| confirmed \| archived (default unconfirmed) |
| confidence | float | |
| version | int | |
| createdAt / updatedAt | | |

### 3.5 SenioritySignal

| Field | Type | Notes |
|-------|------|--------|
| id | cuid | |
| userId | uuid FK | |
| kind | string | years_experience \| level_label \| scope \| team_size \| other |
| value | string | e.g. "5", "senior", "led 8" |
| verification / confidence / sourceType / sourceId | | |
| createdAt / updatedAt | | |

### 3.6 TargetRole

| Field | Type | Notes |
|-------|------|--------|
| id | cuid | |
| userId | uuid FK | |
| title | string | role name |
| industry | string? | |
| priority | int | default 0; higher = primary |
| sourceType | string? | profile \| user |
| isPrimary | boolean | default false |
| createdAt / updatedAt | | |

### 3.7 EvidenceSkillLink

| Field | Type | Notes |
|-------|------|--------|
| evidenceId + skillId | composite PK | |
| userId | uuid | denormalized ownership |
| strength | string | primary \| secondary \| mentioned |

## 4. Verification & provenance rules

1. **imported** — from resume parse/profile bulk import; not user-confirmed.  
2. **inferred** — AI or heuristic; never treated as confirmed.  
3. **unconfirmed** — user-created or reviewed but not confirmed.  
4. **confirmed** — user explicitly confirmed; `confidence = 1.0`.  
5. **archived** — soft-removed from retrieval defaults.

Trusted retrieval for CV/interview grounding: **confirmed** only (or confirmed + unconfirmed when user opts in).  
Never promote inferred → confirmed without explicit user action.

## 5. Retrieval contracts (TypeScript)

Pure functions in `web/lib/ontology/`:

```ts
// Types + zod live in lib/validation/ontology.ts
// Retrieval contracts (no I/O):
getTrustedEvidence(items: CareerEvidenceRecord[]): CareerEvidenceRecord[]
getReadyStarStories(items: StarStoryRecord[]): StarStoryRecord[]
normalizeSkillName(name: string): string
mergeDuplicateSkills(skills: SkillRecord[]): SkillMergePlan
buildCandidateOntologySnapshot(input: {
  skills, evidence, achievements, stories, signals, targets
}): OntologySnapshot
```

`OntologySnapshot` is the payload JOB-86+ consumers use (matching, readiness, interviews, reports).

## 6. Migration

- Additive tables only; no destructive changes to Profile/Resume.  
- Optional later backfill from `Profile.skills` / `targetRole` via pure helper (tested, not auto-run in prod).  
- Prisma migration `job85_career_evidence_ontology`.

## 7. Acceptance criteria mapping

| Criterion | Delivery |
|-----------|----------|
| Documented ontology + diagram | this spec §3 + `docs/ontology.md` |
| Prisma + TS consistent enums | schema + `lib/validation/ontology.ts` |
| Traceable facts | verification + confidence + provenance/source* |
| Safe skill/evidence normalize | `normalizeSkillName`, `mergeDuplicateSkills` tests |
| JOB-81–84 can consume | same entity names as PR13 evidence + extensions; retrieval snapshot API |
| Migration/rollback tests | schema zod tests + normalize unit tests; migration SQL additive |

## 8. Out of scope

- Full UI for evidence bank (JOB-82 on PR #13)  
- Requirement↔evidence matching (JOB-86)  
- Billing (JOB-91)  

## 9. Success criteria

- Full `web/` lint, typecheck, test, build green.  
- New models generate under Prisma client.  
- Unit tests cover normalize/merge/trusted retrieval.  
