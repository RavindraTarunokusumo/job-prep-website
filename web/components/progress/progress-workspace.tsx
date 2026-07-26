"use client";

import { useMemo, useState } from "react";
import type { ProgressAttempt } from "@/lib/progress/compare";
import { compareAttempts } from "@/lib/progress/compare";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Props = {
  attempts: ProgressAttempt[];
  insights: string[];
  partial: boolean;
  loadError?: string | null;
};

const KIND_LABEL: Record<string, string> = {
  resume_review: "Resume review",
  job_match: "Job match",
  interview: "Interview",
  assessment: "Assessment",
  report: "Report",
};

export function ProgressWorkspace({
  attempts,
  insights,
  partial,
  loadError,
}: Props) {
  const [kind, setKind] = useState<string>("resume_review");
  const [aId, setAId] = useState<string>("");
  const [bId, setBId] = useState<string>("");

  const ofKind = useMemo(
    () => attempts.filter((a) => a.kind === kind),
    [attempts, kind]
  );

  const comparison = useMemo(() => {
    const a = ofKind.find((x) => x.id === aId);
    const b = ofKind.find((x) => x.id === bId);
    if (!a || !b) return null;
    return compareAttempts(a, b);
  }, [ofKind, aId, bId]);

  return (
    <div className="space-y-6">
      {loadError ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {loadError}
        </p>
      ) : null}

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Insights</CardTitle>
          <CardDescription>
            Conservative trends only — never invented when data is thin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {insights.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No history yet. Complete resume reviews, interviews, or assessments
              to build a progress timeline.
            </p>
          ) : (
            <ul className="list-disc space-y-2 pl-5 text-sm">
              {insights.map((line) => (
                <li key={line}>
                  {line}
                  {partial ? (
                    <Badge variant="outline" className="ml-2 text-xs">
                      partial
                    </Badge>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Attempt history
          </CardTitle>
          <CardDescription>
            Completed CV reviews, job matches, interviews, assessments, and
            reports.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {attempts.length === 0 ? (
            <p className="rounded-lg border border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
              Empty history. Your completed work will appear here.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {attempts.map((a) => (
                <li
                  key={`${a.kind}-${a.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-semibold">{a.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {KIND_LABEL[a.kind] ?? a.kind} ·{" "}
                      {new Date(a.completedAt).toLocaleString()}
                      {a.targetRole ? ` · ${a.targetRole}` : ""}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {a.score == null
                      ? "—"
                      : a.maxScore != null
                        ? `${a.score}/${a.maxScore}`
                        : `${a.score}`}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Compare attempts
          </CardTitle>
          <CardDescription>
            Side-by-side comparison requires the same attempt kind. Incompatible
            pairs are flagged.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <select
              className="h-8 rounded-lg border border-border bg-background px-2 text-sm"
              value={kind}
              onChange={(e) => {
                setKind(e.target.value);
                setAId("");
                setBId("");
              }}
            >
              {Object.entries(KIND_LABEL).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
            <select
              className="h-8 min-w-[10rem] flex-1 rounded-lg border border-border bg-background px-2 text-sm"
              value={aId}
              onChange={(e) => setAId(e.target.value)}
            >
              <option value="">Earlier attempt…</option>
              {ofKind.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label} ({a.completedAt.slice(0, 10)})
                </option>
              ))}
            </select>
            <select
              className="h-8 min-w-[10rem] flex-1 rounded-lg border border-border bg-background px-2 text-sm"
              value={bId}
              onChange={(e) => setBId(e.target.value)}
            >
              <option value="">Later attempt…</option>
              {ofKind.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label} ({a.completedAt.slice(0, 10)})
                </option>
              ))}
            </select>
          </div>

          {comparison ? (
            comparison.compatible ? (
              <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm">
                <p className="font-semibold">
                  {comparison.delta == null
                    ? "No numeric delta"
                    : `Delta: ${comparison.delta > 0 ? "+" : ""}${comparison.delta}`}
                </p>
                <p className="mt-1 text-muted-foreground">
                  {comparison.explanation}
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                Incompatible: {comparison.reason}
              </div>
            )
          ) : (
            <p className="text-sm text-muted-foreground">
              Select two attempts of the same kind to compare.
            </p>
          )}

          {/* client-side compare is the real shipped compareAttempts function */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="hidden"
            aria-hidden
          >
            Compare
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
