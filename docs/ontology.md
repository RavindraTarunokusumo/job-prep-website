# Career evidence ontology

**Linear:** [JOB-85](https://linear.app/job-prep-website/issue/JOB-85)  
**Spec:** [docs/specs/2026-07-27-mvp-job-85-career-evidence-ontology.md](./specs/2026-07-27-mvp-job-85-career-evidence-ontology.md)

## Relationship diagram

```text
                         ┌──────────────┐
                         │     User     │
                         └──────┬───────┘
            ┌───────────┬───────┼────────┬────────────┬────────────┐
            ▼           ▼       ▼        ▼            ▼            ▼
       ┌────────┐ ┌──────────┐ ┌────┐ ┌────────┐ ┌──────────┐ ┌──────────┐
       │ Skill  │ │ Career   │ │Star│ │Seniority│ │ Target   │ │(existing)│
       │        │ │ Evidence │ │Story│ │ Signal │ │ Role     │ │ Profile  │
       └───┬────┘ └────┬─────┘ └──┬─┘ └────────┘ └──────────┘ └──────────┘
           │           │          │
           │     ┌─────┴─────┐    │
           │     ▼           ▼    │
           │ ┌──────────┐ ┌───────┴────────┐
           │ │Achievement│ │ evidenceId?   │
           │ └──────────┘ └────────────────┘
           │
           └──── EvidenceSkillLink ────► CareerEvidence
```

## Verification ladder

```text
inferred ──► unconfirmed ──► confirmed ──► (archived)
imported ──► unconfirmed ──► confirmed
```

Only **confirmed** facts are trusted for grounding CV rewrites and interview answers.  
**Inferred** never becomes confirmed without an explicit user action.

## Consumer contracts

| Workflow | Reads |
|----------|--------|
| JD requirement mapping (JOB-86) | trusted evidence + skills + ready STAR |
| Readiness model (JOB-87) | snapshot + match strength |
| Gap-driven interview (JOB-88) | gaps + weak evidence + ready STAR |
| Outcomes (JOB-89) | application stage + optional evidence links |
| Reports / CV | `buildCandidateOntologySnapshot` |

## Enums (shared)

- **verification:** `imported` | `inferred` | `unconfirmed` | `confirmed` | `archived`
- **evidence sourceType:** `employment` | `education` | `volunteering` | `freelance` | `project` | `competition` | `other`
- **STAR readiness:** `draft` | `ready` | `archived`
- **skill category:** `technical` | `soft` | `domain` | `tool` | `language` | `other`
