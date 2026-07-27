# Lightweight plan: JOB-86

**Spec:** docs/specs/2026-07-27-mvp-job-86-requirement-evidence-mapping.md  
**Build order:** T1 model → T2 mapper → T3 validation/actions → T4 tests

### Interfaces

**T1** Produces: `RequirementEvidenceMatch` prisma + migration  
**T2** Consumes: JobRequirements, OntologySnapshot; Produces: `mapRequirementsToEvidence`  
**T3** Produces: zod + `suggestRequirementMatchesAction` shape (pure-ready)  
**T4** Produces: unit tests for classifications and no-fabrication actions
