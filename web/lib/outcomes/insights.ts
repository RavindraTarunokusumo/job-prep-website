import type { OutcomeInsight, OutcomeStage } from "@/lib/validation/outcome";
import { outcomeInsightSchema } from "@/lib/validation/outcome";

export type OutcomeRow = {
  stage: OutcomeStage | string;
  outcome?: string | null;
};

const MIN_SAMPLE = 3;

/**
 * Aggregate rates without claiming causation. Insights require sufficient sample size.
 */
export function aggregateOutcomeInsights(rows: OutcomeRow[]): OutcomeInsight[] {
  const n = rows.length;
  if (n === 0) {
    return [
      outcomeInsightSchema.parse({
        label: "no_data",
        sampleSize: 0,
        rate: null,
        caveat: "No outcomes recorded yet.",
      }),
    ];
  }

  const count = (pred: (r: OutcomeRow) => boolean) => rows.filter(pred).length;
  const rateOrNull = (c: number) => (n >= MIN_SAMPLE ? c / n : null);

  const interview = count((r) =>
    ["interview", "final", "offer", "rejected"].includes(r.stage),
  );
  const offer = count((r) => r.stage === "offer" || r.outcome === "offer");
  const rejected = count((r) => r.stage === "rejected");
  const noResponse = count((r) => r.stage === "no_response");

  const insights: OutcomeInsight[] = [
    outcomeInsightSchema.parse({
      label: "interview_rate",
      sampleSize: n,
      rate: rateOrNull(interview),
      caveat:
        n < MIN_SAMPLE
          ? `Sample size ${n} is below ${MIN_SAMPLE}; rate withheld to avoid false precision.`
          : "Descriptive only — not causal.",
    }),
    outcomeInsightSchema.parse({
      label: "offer_rate",
      sampleSize: n,
      rate: rateOrNull(offer),
      caveat:
        n < MIN_SAMPLE
          ? `Sample size ${n} is below ${MIN_SAMPLE}; rate withheld.`
          : "Descriptive only — not causal.",
    }),
    outcomeInsightSchema.parse({
      label: "rejection_rate",
      sampleSize: n,
      rate: rateOrNull(rejected),
      caveat: "Employer feedback and user interpretation must stay separate in UI.",
    }),
    outcomeInsightSchema.parse({
      label: "no_response_rate",
      sampleSize: n,
      rate: rateOrNull(noResponse),
      caveat: "No-response is not the same as rejection.",
    }),
  ];
  return insights;
}

/** Separate factual employer text from user interpretation in stored shape. */
export function splitFeedbackFields(input: {
  employerFeedback?: string | null;
  userInterpretation?: string | null;
}): {
  employerFeedback: string | null;
  userInterpretation: string | null;
  meta: { sources: { employer: boolean; user: boolean; ai: boolean } };
} {
  return {
    employerFeedback: input.employerFeedback?.trim() || null,
    userInterpretation: input.userInterpretation?.trim() || null,
    meta: {
      sources: {
        employer: Boolean(input.employerFeedback?.trim()),
        user: Boolean(input.userInterpretation?.trim()),
        ai: false,
      },
    },
  };
}
