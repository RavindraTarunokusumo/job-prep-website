"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { JobMatchResult } from "@/lib/validation/job-match";

export type MatchSnapshot = {
  id: string;
  status: string;
  matchScore: number | null;
  errorMessage: string | null;
  createdAt: string;
  result: JobMatchResult | null;
  jobTitle: string | null;
  jobCompany: string | null;
};

type MatchResultsProps = {
  match: MatchSnapshot;
};

function scoreBadgeVariant(
  score: number | null
): "default" | "secondary" | "destructive" | "outline" {
  if (score == null) {
    return "outline";
  }
  if (score >= 75) {
    return "default";
  }
  if (score >= 50) {
    return "secondary";
  }
  return "destructive";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function MatchResults({ match }: MatchResultsProps) {
  if (match.status === "pending") {
    return (
      <p className="text-sm text-muted-foreground">Match analysis in progress…</p>
    );
  }

  if (match.status === "failed") {
    return (
      <p className="text-sm text-destructive" role="alert">
        Analysis failed: {match.errorMessage ?? "Unknown error"}
      </p>
    );
  }

  const result = match.result;
  if (!result) {
    return (
      <p className="text-sm text-muted-foreground">No match results available.</p>
    );
  }

  const jobLabel = [match.jobTitle, match.jobCompany].filter(Boolean).join(" at ");

  return (
    <div className="space-y-6">
      <Card className="border-brand-purple/20 bg-brand-purple/5 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold">Match score</CardTitle>
          <CardDescription>
            {jobLabel ? `${jobLabel} — ` : ""}
            {formatDate(match.createdAt)}. Fit score only — not hire probability.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <span className="text-4xl font-extrabold tracking-tight text-foreground">
              {result.matchScore}
            </span>
            <Badge variant={scoreBadgeVariant(result.matchScore)}>/ 100</Badge>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{result.summary}</p>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <ChipListCard
          title="Matched"
          items={result.matched.map((item) => ({
            label: item.item,
            detail: item.evidence,
            variant: "default" as const,
          }))}
        />
        <ChipListCard
          title="Missing"
          items={result.missing.map((item) => ({
            label: item.item,
            detail: item.suggestion,
            variant:
              item.importance === "required"
                ? ("destructive" as const)
                : ("secondary" as const),
          }))}
        />
      </div>

      {result.keywordGaps.length > 0 ? (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Keyword gaps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {result.keywordGaps.map((gap) => (
                <Badge key={gap} variant="outline">
                  {gap}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        <StringListCard title="Strengths" items={result.strengths} />
        <StringListCard title="Gaps" items={result.gaps} />
      </div>

      {result.nextActions.length > 0 ? (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Next actions</CardTitle>
            <CardDescription>Lower priority numbers are more urgent.</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              {result.nextActions
                .slice()
                .sort((a, b) => a.priority - b.priority)
                .map((action) => (
                  <li
                    key={`${action.priority}-${action.title}`}
                    className="rounded-lg border border-border bg-muted/20 px-4 py-3"
                  >
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="shrink-0">
                        P{action.priority}
                      </Badge>
                      <div>
                        <p className="text-sm font-semibold">{action.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {action.detail}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
            </ol>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function ChipListCard({
  title,
  items,
}: {
  title: string;
  items: {
    label: string;
    detail?: string;
    variant: "default" | "secondary" | "destructive";
  }[];
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="space-y-1">
            <Badge variant={item.variant}>{item.label}</Badge>
            {item.detail ? (
              <p className="text-xs text-muted-foreground">{item.detail}</p>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function StringListCard({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="list-disc space-y-2 pl-5 text-sm">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}