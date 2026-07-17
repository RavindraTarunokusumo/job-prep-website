import Link from "next/link";

import type { AttemptDetail } from "@/app/actions/assessment";
import { buttonVariants } from "@/components/ui/button";
import { PRACTICE_ONLY_DISCLAIMER } from "@/lib/assessment/disclaimer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ResultsSummaryProps = {
  attempt: AttemptDetail;
};

export function ResultsSummary({ attempt }: ResultsSummaryProps) {
  const score = attempt.score ?? 0;
  const maxScore = attempt.maxScore ?? 0;
  const percent =
    maxScore > 0 ? Math.round((score / maxScore) * 100) : null;
  const reflectionCount = attempt.questions.filter((q) => q.isReflection).length;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        {PRACTICE_ONLY_DISCLAIMER}
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-extrabold tracking-tight">
            Practice results
          </CardTitle>
          <CardDescription>{attempt.categoryName}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {maxScore > 0 ? (
            <p className="text-lg font-semibold">
              Score: {score} / {maxScore}
              {percent != null ? (
                <span className="ml-2 text-muted-foreground">({percent}%)</span>
              ) : null}
            </p>
          ) : (
            <p className="text-lg font-semibold">
              Reflection complete — no numeric score.
            </p>
          )}

          {reflectionCount > 0 ? (
            <p className="text-sm text-muted-foreground">
              {reflectionCount} self-reflection prompt
              {reflectionCount === 1 ? "" : "s"} excluded from scoring.
            </p>
          ) : null}

          <p className="text-sm text-muted-foreground">
            Detailed per-question review and category tips arrive in a later
            pass. Use this score only as practice feedback.
          </p>

          <div className="flex flex-wrap gap-2 pt-2">
            <Link
              href="/assessments"
              className={cn(buttonVariants({ variant: "default" }))}
            >
              Practice another category
            </Link>
            <Link
              href="/dashboard"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Back to dashboard
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
