# Privacy, consent, and AI-use QA checklist

Use this when shipping AI or document features. MVP copy lives in `web/lib/legal/copy.ts` (`CONSENT_COPY_VERSION`).

## Legal pages

| Route | Must show |
|-------|-----------|
| `/privacy` | Real privacy content (not placeholder); what we collect / how used / data rights |
| `/ai-use` | AI guidance disclaimer; not a hiring decision; user review responsibility |

## Upload

| Surface | Must show / enforce |
|---------|---------------------|
| Resume upload form | `uploadConsent` checkbox required before submit |
| `uploadResume` action | Rejects if upload consent not accepted for current copy version |

## AI processing consent

| Surface | Must show / enforce |
|---------|---------------------|
| Resume check / review | AI consent banner or gate before generate |
| Job match | AI consent banner or gate |
| Cover letter / messages | AI consent banner or gate |
| Prep plan | AI consent banner or gate |
| AI generate server actions | `requireAiConsent` (or equivalent) returns clear error if missing |

## Practice / coaching disclaimers

| Surface | Must show |
|---------|-----------|
| Mock interview (when present) | Coaching / not a hiring decision (`interviewFeedbackDisclaimer`) |
| Assessments (when present) | Non-clinical practice-only (`assessmentNonClinical`) |
| Job match results | Fit score limitations (`jobFitLimitations`) |
| Prep plan | Career recommendation limits (`careerRecommendationLimits`) |

## Data rights

| Surface | Must show / enforce |
|---------|---------------------|
| Settings → Your data | Export request + deletion request |
| Export | Immediate metadata JSON (no file bytes) + pending `DataRequest` |
| Deletion | Records pending request only (no silent full wipe in MVP) |

## Copy quality

- [ ] No clinical / diagnostic claims for assessments
- [ ] No hire / no-hire guarantees from AI scores
- [ ] No overclaimed deletion SLAs
- [ ] Consent version string stored with `UserConsent` rows
