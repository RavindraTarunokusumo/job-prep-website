# Spec batch: JOB-87…92 — outcome-first product surfaces

| Field | Value |
|-------|--------|
| **Status** | Accepted (Autopilot self-accept) |
| **Date** | 2026-07-27 |
| **Branch** | `feat/job-85-92-outcome-first` |
| **Depends on** | JOB-85 ontology, JOB-86 mapping |

---

## JOB-87 — Application-specific readiness model

### Goal
Transparent multi-dimension readiness per application; coaching only.

### Data model
`ApplicationReadinessScore` — see schema; `dimensions` JSON via `readinessDimensionsSchema`.

### Interfaces
- `computeApplicationReadiness(input)` pure scorer
- `generateReadinessScoreAction({ jobDescriptionId })` — ownership check, persist versioned row
- UI: `/readiness` shows dimensions + highest-impact actions

### Acceptance
- Dimension scores + confidence bands; sparse data lowers confidence
- No hire-probability language
- User can regenerate score after mapping changes

---

## JOB-88 — Gap-driven mock interviews

### Goal
Practice questions sourced from application gaps, not only generic role banks.

### Interfaces
- `generateGapDrivenQuestions(matches, stories)` pure
- `startInterviewSessionAction({ jobDescriptionId, gapDriven })` — when a JD is selected, loads/creates matches, generates gap questions, falls back to AI bank if none
- UI: interview start form preselects `?jobId=`; readiness links to interview

### Acceptance
- Selecting a job starts gap-driven practice when mappings exist
- Each gap question records source requirement key in question text
- Entitlement `mock_interview` enforced server-side
- No false STAR grounding on unlinked gaps

---

## JOB-89 — Application outcomes

### Goal
Capture stages and feedback; separate employer vs user interpretation.

### Interfaces
- `recordApplicationOutcomeAction` + ownership on JD
- `getOutcomeInsightsAction` / page aggregation with sample-size gate
- UI: `/outcomes`

### Acceptance
- Stages: applied…no_response
- Insights withhold rates below sample size 3
- Sensitive by default

---

## JOB-90 — Model routing & cost telemetry

### Goal
Route AI by task class; measure cost/latency without raw content.

### Interfaces
- `resolveModelRoute` / `selectModelCandidates`
- `generateObjectWithFallback({ workflow, taskClass, userId })` tags attempts and calls `recordAiUsageEvent` → `AiUsageEvent`

### Acceptance
- job_match extraction/matching and mock_interview generation pass workflow tags
- Telemetry meta strips raw content keys
- Failures still record unsuccessful attempts

---

## JOB-91 — Subscription entitlements & Sprint Pass

### Goal
Plan-based access without token balances.

### Interfaces
- `checkEntitlement` + `requireFeatureEntitlement` (grants + subscription)
- `activateSprintPassAction` (30-day stub checkout)
- `processBillingWebhookAction` idempotent on `providerEventId`
- UI: `/billing`

### Enforcement points
- `job_match`, `resume_review`, `mock_interview` server actions call `requireFeatureEntitlement`

### Acceptance
- Free includes core prep features; paid unlocks unlimited_match etc.
- Sprint Pass duration 30 days
- Duplicate webhooks not double-applied

---

## JOB-92 — Journey tests

### Goal
Protect the outcome-first spine in CI.

### Delivery
- `application-journey.test.ts` — graduate / experienced / switcher fixtures driving real domain functions
- `shipped-action-wiring.test.ts` — verifies action modules import/call domain + entitlement + gap-driven paths
- `openrouter-routing-integration.test.ts` — real `selectModelCandidates` path
- Browser E2E: deferred; release checklist: pages `/evidence`, `/readiness`, `/outcomes`, `/interview?jobId=`, `/billing` must load for onboarded users

### Ownership
- Every action that accepts IDs checks `userId` equality and returns access denied

---

## Success criteria (batch)

- Full `web/` lint, typecheck, test, build green
- Domain helpers imported by server actions and pages (not tests-only)
- Linear issues stay **In Review** until PR merges to main
