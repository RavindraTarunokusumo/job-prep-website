# Lightweight plan: JOB-85 — Shared career evidence ontology

**Spec:** [docs/specs/2026-07-27-mvp-job-85-career-evidence-ontology.md](../../specs/2026-07-27-mvp-job-85-career-evidence-ontology.md)  
**Branch / worktree:** `feat/job-85-92-outcome-first` @ `.worktree/autopilot-job-85-92`  
**Base:** `origin/main`  
**No git from implementers.**

## File structure

```
docs/ontology.md
docs/database.md                              # model table rows
docs/specs/2026-07-27-mvp-job-85-...
docs/superpowers/plans/2026-07-27-job-85-...
web/prisma/schema.prisma
web/prisma/migrations/<ts>_job85_career_evidence_ontology/migration.sql
web/lib/validation/ontology.ts
web/lib/ontology/normalize.ts
web/lib/ontology/retrieval.ts
web/lib/ontology/snapshot.ts
web/lib/ontology/index.ts
web/lib/prisma.ts                             # schema version bump if present
web/__tests__/ontology-schema.test.ts
web/__tests__/ontology-normalize.test.ts
web/__tests__/ontology-retrieval.test.ts
TODO.md
```

## Tasks

### T1 — Docs + TODO (`85.1`)

**Consumes:** Linear JOB-85, existing schema audit  
**Produces:** spec (accepted), this plan, `docs/ontology.md` diagram, TODO entries  

### T2 — Prisma models + migration (`85.2`)

**Consumes:** T1  
**Produces:** Skill, CareerEvidence, Achievement, StarStory, SenioritySignal, TargetRole, EvidenceSkillLink; User relations; migration SQL; `docs/database.md` update  

### T3 — Validation + domain helpers (`85.3`)

**Consumes:** T2  
**Produces:** zod enums/schemas; normalizeSkillName; mergeDuplicateSkills; getTrustedEvidence; getReadyStarStories; buildCandidateOntologySnapshot  

### T4 — Unit tests (`85.4`)

**Consumes:** T3  
**Produces:** schema reject/accept; normalize dedupe; trusted retrieval never promotes inferred  

## Build order

```
T1 → T2 → T3 → T4
```

## Interfaces (cross-task)

```ts
// lib/validation/ontology.ts
export const verificationStates = ["imported","inferred","unconfirmed","confirmed","archived"] as const
export const evidenceSourceTypes = [...] as const
export type OntologySnapshot = {
  skills: SkillRecord[]
  evidence: CareerEvidenceRecord[]
  achievements: AchievementRecord[]
  stories: StarStoryRecord[]
  signals: SenioritySignalRecord[]
  targets: TargetRoleRecord[]
  generatedAt: string
}

// lib/ontology/retrieval.ts
export function getTrustedEvidence(items: { verification: string }[]): typeof items
export function getReadyStarStories(items: { readiness: string; verification?: string }[]): typeof items

// lib/ontology/normalize.ts
export function normalizeSkillName(name: string): string
export function mergeDuplicateSkills(skills: { id: string; normalizedName: string; verification: string }[]): {
  keepId: string; mergeIds: string[]
}[]
```

## Risks

- PR #13 already defines narrower CareerEvidence/StarStory — names aligned intentionally; merge conflict expected when PR #13 lands; ontology is canonical.  
- No live DB required for unit tests (pure functions).  
