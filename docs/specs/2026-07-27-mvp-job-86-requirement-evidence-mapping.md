# Spec: JOB-86 — Job requirement→evidence mapping

| Field | Value |
|-------|--------|
| **Status** | Accepted (Autopilot self-accept) |
| **Date** | 2026-07-27 |
| **Branch** | `feat/job-85-92-outcome-first` |
| **Linear** | [JOB-86](https://linear.app/job-prep-website/issue/JOB-86) |
| **Depends on** | JOB-85 ontology |
| **Blocks** | JOB-87, JOB-88, JOB-92 |

## Goal

Map each material job requirement to verified candidate evidence so gaps and strengths are explainable and reusable.

## Data model: `RequirementEvidenceMatch`

| Field | Notes |
|-------|--------|
| id, userId | ownership cascade |
| jobDescriptionId | FK |
| requirementKey | stable key e.g. `requiredSkills:typescript` |
| requirementText | display text |
| importance | required \| preferred \| other |
| matchType | strong \| partial \| keyword_only \| transferable \| gap |
| evidenceStrength | 0–100 denormalized |
| confidence | 0–1 |
| explanation | why this mapping |
| evidenceId / skillId / starStoryId | optional FKs (nullable) |
| userReview | suggested \| confirmed \| rejected \| replaced |
| safeAction | optional coaching next step (no fabrication) |
| version | int |
| createdAt / updatedAt | |

## Deterministic matcher

`mapRequirementsToEvidence(requirements, snapshot)`:

1. Expand JD `requiredSkills`, `preferredSkills`, `tools`, `keywords`, key responsibilities into requirement rows.  
2. For each requirement, score against **trusted** skills + evidence text + ready STAR (token overlap / normalized skill equality).  
3. Classify: exact skill confirmed → strong; partial text → partial; keyword in untrusted only → keyword_only; gap if nothing.  
4. Never set `userReview=confirmed` from AI/heuristic — always `suggested`.  
5. Safe actions for gaps: “Add evidence or practice STAR” — never invent achievements.

## Interfaces

```ts
// lib/matching/map-requirements.ts
export function mapRequirementsToEvidence(
  jobDescriptionId: string,
  userId: string,
  requirements: JobRequirements,
  snapshot: OntologySnapshot,
): RequirementMatchDraft[]

// lib/validation/requirement-match.ts — zod for matchType, userReview, drafts
```

## Acceptance

- Material requirements produce a row (strong or gap).  
- Deterministic signals primary; AI optional later.  
- User can confirm/reject/replace (actions).  
- Inferred facts never become confirmed via mapping.  
- Unit tests cover multi-requirement, sparse profile, ownership-shaped drafts.

## Product surfaces (in scope)

- `generateRequirementMatchesAction` / `reviewRequirementMatchAction` / `listRequirementMatchesAction`
- Auto-persist mappings after successful job match analysis
- `/readiness` match review list (confirm / reject)
- Ownership: all actions scope by `userId`

## Out of scope

Full JOB-81 application tracker workspace UI (PR #13).
