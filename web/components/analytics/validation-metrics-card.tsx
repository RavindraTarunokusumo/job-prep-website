import {
  ANALYTICS_EVENTS,
  FUNNEL_EVENT_NAMES,
  type AnalyticsEventName,
} from "@/lib/analytics/events";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const EVENT_LABELS: Record<AnalyticsEventName, string> = {
  [ANALYTICS_EVENTS.ONBOARDING_COMPLETE]: "Onboarding complete",
  [ANALYTICS_EVENTS.CV_UPLOAD]: "CV upload",
  [ANALYTICS_EVENTS.JD_ANALYSIS]: "JD analysis",
  [ANALYTICS_EVENTS.PREP_PLAN_GEN]: "Prep plan generated",
  [ANALYTICS_EVENTS.MOCK_INTERVIEW_START]: "Mock interview start",
  [ANALYTICS_EVENTS.MOCK_INTERVIEW_COMPLETE]: "Mock interview complete",
  [ANALYTICS_EVENTS.REPORT_GEN]: "Report generated",
  [ANALYTICS_EVENTS.FEEDBACK_RATING]: "Feedback ratings",
  [ANALYTICS_EVENTS.COVER_LETTER_GEN]: "Cover letter generated",
};

const EXTRA_ROWS: AnalyticsEventName[] = [
  ANALYTICS_EVENTS.COVER_LETTER_GEN,
  ANALYTICS_EVENTS.FEEDBACK_RATING,
];

type ValidationMetricsCardProps = {
  counts: Record<string, number>;
};

/**
 * Per-user funnel counts for MVP validation (JOB-77).
 * Team-wide dashboard is documented in docs/analytics-taxonomy.md (later).
 */
export function ValidationMetricsCard({ counts }: ValidationMetricsCardProps) {
  const rows = [...FUNNEL_EVENT_NAMES, ...EXTRA_ROWS];
  const total = rows.reduce((sum, name) => sum + (counts[name] ?? 0), 0);

  return (
    <Card className="shadow-sm sm:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">
          Validation metrics
        </CardTitle>
        <CardDescription className="text-xs">
          Your event counts for the MVP funnel (first-party analytics). Team
          rollups query Postgres later — see docs/analytics-taxonomy.md.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-border rounded-lg border border-border">
          {rows.map((name) => {
            const n = counts[name] ?? 0;
            return (
              <li
                key={name}
                className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
              >
                <span className="text-muted-foreground">
                  {EVENT_LABELS[name] ?? name}
                </span>
                <span className="font-mono text-xs font-semibold tabular-nums text-foreground">
                  {n}
                </span>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          Total tracked events (listed):{" "}
          <span className="font-semibold text-foreground">{total}</span>
        </p>
      </CardContent>
    </Card>
  );
}
