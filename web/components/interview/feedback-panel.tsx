import { Badge } from "@/components/ui/badge";
import type { InterviewFeedback } from "@/lib/validation/interview";

function scoreBadgeVariant(
  score: number
): "default" | "secondary" | "outline" | "destructive" {
  if (score >= 75) return "default";
  if (score >= 50) return "secondary";
  if (score >= 25) return "outline";
  return "destructive";
}

function dimensionLabel(key: string): string {
  switch (key) {
    case "relevance":
      return "Relevance";
    case "specificity":
      return "Specificity";
    case "starStructure":
      return "STAR structure";
    case "clarity":
      return "Clarity";
    case "roleAlignment":
      return "Role alignment";
    default:
      return key;
  }
}

function BulletList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <ul className="list-disc space-y-1 pl-4 text-sm text-foreground">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

type FeedbackPanelProps = {
  feedback: InterviewFeedback;
  /** Compact layout for inline earlier-answers cards. */
  compact?: boolean;
  className?: string;
};

export function FeedbackPanel({
  feedback,
  compact = false,
  className,
}: FeedbackPanelProps) {
  const dimensionEntries = Object.entries(feedback.dimensions) as [
    keyof InterviewFeedback["dimensions"],
    number,
  ][];

  return (
    <div
      className={[
        "rounded-lg border border-brand-blue/20 bg-brand-blue/5",
        compact ? "space-y-3 px-3 py-3" : "space-y-4 px-4 py-4",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Coaching feedback
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Practice scoring only — not a hiring decision.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={
              compact
                ? "text-2xl font-extrabold tracking-tight text-foreground"
                : "text-3xl font-extrabold tracking-tight text-foreground"
            }
          >
            {feedback.overallScore}
          </span>
          <Badge variant={scoreBadgeVariant(feedback.overallScore)}>
            / 100
          </Badge>
        </div>
      </div>

      <ul
        className={
          compact
            ? "grid grid-cols-2 gap-2 sm:grid-cols-3"
            : "grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5"
        }
      >
        {dimensionEntries.map(([key, value]) => (
          <li
            key={key}
            className="rounded-md border border-border/60 bg-background/60 px-2 py-1.5 text-center"
          >
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {dimensionLabel(key)}
            </p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">
              {value}
              <span className="text-xs font-normal text-muted-foreground">
                /5
              </span>
            </p>
          </li>
        ))}
      </ul>

      <div
        className={
          compact
            ? "space-y-3"
            : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        }
      >
        <BulletList title="Strengths" items={feedback.strengths} />
        <BulletList title="Improvements" items={feedback.improvements} />
        <BulletList title="Missing details" items={feedback.missingDetails} />
      </div>

      <div className="space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Suggested rewrite
        </p>
        <p className="whitespace-pre-wrap rounded-md border border-border bg-background/70 px-3 py-2 text-sm text-foreground">
          {feedback.rewriteSuggestion}
        </p>
      </div>
    </div>
  );
}

type SessionFeedbackSummaryProps = {
  items: Array<{
    id: string;
    question: string;
    feedback: InterviewFeedback | null;
  }>;
};

/**
 * Session-complete overview: average score + per-primary feedback panels.
 */
export function SessionFeedbackSummary({ items }: SessionFeedbackSummaryProps) {
  const scored = items.filter((i) => i.feedback != null);
  if (scored.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No coaching scores for this session yet. Feedback is generated after
        each primary answer settles (including any follow-up).
      </p>
    );
  }

  const avg = Math.round(
    scored.reduce((sum, i) => sum + (i.feedback?.overallScore ?? 0), 0) /
      scored.length
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/20 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Session coaching summary
          </p>
          <p className="text-xs text-muted-foreground">
            Average of {scored.length} scored answer
            {scored.length === 1 ? "" : "s"} — not a hiring decision.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-3xl font-extrabold tracking-tight text-foreground">
            {avg}
          </span>
          <Badge variant={scoreBadgeVariant(avg)}>/ 100</Badge>
        </div>
      </div>

      <ul className="space-y-4">
        {items.map((item, index) =>
          item.feedback ? (
            <li key={item.id} className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                <span className="text-xs text-muted-foreground">
                  Q{index + 1} ·{" "}
                </span>
                {item.question}
              </p>
              <FeedbackPanel feedback={item.feedback} compact />
            </li>
          ) : null
        )}
      </ul>
    </div>
  );
}
