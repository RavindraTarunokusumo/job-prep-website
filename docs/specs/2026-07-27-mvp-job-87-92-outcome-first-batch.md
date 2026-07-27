# Spec batch: JOB-87…92 (Autopilot self-accepted)

| Issue | Status | Core delivery |
|-------|--------|---------------|
| JOB-87 | Accepted | `ApplicationReadinessScore` + `computeApplicationReadiness` dimension model |
| JOB-88 | Accepted | `generateGapDrivenQuestions` + rehearsal plan from mappings |
| JOB-89 | Accepted | `ApplicationOutcome` + outcome insights (no causation claims) |
| JOB-90 | Accepted | `resolveModelRoute` + `AiUsageEvent` + telemetry sanitization |
| JOB-91 | Accepted | ProductPlan/Subscription/EntitlementGrant/BillingEvent + `checkEntitlement` |
| JOB-92 | Accepted | Journey fixtures driving real shipped functions |

Shared branch: `feat/job-85-92-outcome-first` based on `origin/main`.
Full details: Linear issue bodies; pure domain helpers under `web/lib/{readiness,interview,outcomes,ai,billing,matching}/`.
