# Spec: Jev rubric scoring for resume review

| Field | Value |
|-------|--------|
| **Status** | Draft — **blocked** on open question 1 (API credentials) |
| **Date** | 2026-09-18 |
| **Vendor** | TypeSafe AI, `jev-1.13.0` via `POST /v1/systemone` |
| **Refs** | [docs.typesafe.ai/models](https://docs.typesafe.ai/models) |
| **Depends on** | Nothing. Independent of the parser fix. |

## Context

`resumeReviewResultSchema` (`web/lib/validation/resume-review.ts:27`) carries an
`overallScore` and per-section `sectionScores`, both 0–100 integers produced by a
general LLM. They are not reproducible, not calibrated, and carry no confidence
signal — the same CV can score differently across runs, and nothing tells us when the
model was guessing.

Jev is a "System One" model: it returns typed decisions and probability distributions
and generates **no text**. Its `score` primitive returns an ordinal level on a 2–10
point rubric plus a distribution and a confidence value. That is a direct fit for the
numeric half of resume review, and a non-fit for everything else.

## Goal

Replace LLM-invented review scores with calibrated ordinal rubric scores computed by
Jev, with the 0–100 mapping performed deterministically in our own code. Prove the
swap is sound on a synthetic corpus **before** wiring it to real user CVs.

## Scope

**In:** `overallScore`, `sectionScores[]`.
**Out:** `strengths`, `weaknesses`, `atsRisks`, `missingMetrics`, `priorityActions`,
`rewriteSuggestions`, `summary` — all prose, all remain on the existing LLM path.

## Rubric

Five `score` questions evaluated against one shared `state` (the CV text), each a
5-level ordinal with explicit per-level criteria:

| Dimension | Weight |
|-----------|--------|
| Impact evidence & quantification | 30% |
| ATS structure & parseability | 20% |
| Role relevance | 20% |
| Clarity & concision | 15% |
| Completeness | 15% |

Weights are a stated product decision recorded here, not a model output. Ordinal →
0–100 mapping is deterministic and unit-tested. `overallScore` is the weighted sum;
`sectionScores[]` carries each dimension with its Jev confidence attached.

## Interfaces

```
// lib/ai/jev.ts
askJev(input: { state: string; questions: Record<string, JevQuestion> })
  : Promise<Record<string, JevAnswer>>
//   JevQuestion = { type: "noul" | "choice" | "score", instructions, criteria }
//   JevAnswer   = noul{noul} | choice{choice,confidence,probabilities}
//                              | score{score,confidence,legend,probabilities}
//   Reuses recordAiUsageEvent + sanitizeTelemetryMeta from lib/ai/openrouter.ts
//   Env: TYPESAFE_API_KEY, JEV_MODEL (default jev-latest)

// lib/ai/resume-rubric.ts
scoreResumeRubric(cvText: string, opts: { userId?: string | null })
  : Promise<{ overallScore: number; sectionScores: ResumeReviewSectionScore[] }>
// Consumes: raw CV text. Produces: the numeric half of ResumeReviewResult.

// scripts/jev-rubric-eval.ts — offline harness, not a unit test
```

Constraints from the vendor docs that shape the design: 64k tokens per request
(32k for `state` plus the longest question), text input only, English-optimal,
$0.042/MTok input with free output, 70–500ms typical latency.

## Evaluation

A synthetic corpus of 12–15 plain-text CVs under `web/__tests__/fixtures/cvs/`, each
tagged with an expected rubric band, spanning: strong-quantified vs vague-duties;
well-sectioned vs collapsed single-column PDF text; junior vs senior; ATS-hostile
artifacts; near-empty. Plus 2–3 **adversarial pairs** differing on exactly one rubric
dimension.

`scripts/jev-rubric-eval.ts` runs the corpus and reports expected band vs actual
score, confidence, and the full probability distribution per question. Each CV runs
3× to measure determinism. Latency and cost per CV are captured.

## Acceptance

Criteria fixed **before** results are seen, so the verdict is not written to fit them:

1. **Ordering** — the corpus ranks in the order the fixtures specify. Monotonicity
   matters more than absolute values.
2. **Discrimination** — adversarial pairs separate on the intended dimension and not
   on the others.
3. **Calibration** — `confidence` is measurably lower on the deliberately ambiguous
   fixtures. Uniformly high confidence is a failure, not a pass.
4. **Stability** — 3× reruns land within one ordinal level.

Claude reviews the report against each criterion and issues a written verdict with
failing cases quoted. On pass, the path ships behind a flag alongside the existing LLM
scorer and is compared on real CVs before any switch. On fail, the work is abandoned
at the cost of one afternoon.

Full `web/` suite green before any commit.

## Risks

- The ordinal → 0–100 mapping is a judgment call and will need tuning.
- Synthetic CVs are cleaner than real extracted PDF text; passing here is necessary
  but not sufficient.
- `jev-1.13.0` is early access; documented rate limits may change without notice.
- Vendor performance claims (40–200×) are unverified by us.

## Privacy

Routing CV text to TypeSafe adds a fourth-party processor. `lib/legal/copy.ts:62`
already discloses "third-party AI providers" generically, but adding a subprocessor is
a privacy decision, not a code decision — `docs/privacy-qa-checklist.md` must be walked
before any real user CV reaches this path. The synthetic-corpus evaluation involves no
user data and is unaffected.

## Open questions

1. **(Blocking)** Is a TypeSafe API key available? Tasks 1, 4 and 5 cannot run without
   one. Rubric definition and the synthetic corpus can be built meanwhile.
2. (Non-blocking) Should `sectionScores[]` surface confidence to the user, or stay
   internal for gating?
