"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { runResumeReviewAction } from "@/app/actions/resume-review";
import { BulletRewrite } from "@/components/resume/bullet-rewrite";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ResumeReviewResult } from "@/lib/validation/resume-review";

export type ParsedDocumentOption = {
  id: string;
  originalFilename: string;
  updatedAt: string;
};

export type ReviewSnapshot = {
  id: string;
  status: string;
  overallScore: number | null;
  errorMessage: string | null;
  createdAt: string;
  result: ResumeReviewResult | null;
};

type CheckDashboardProps = {
  documents: ParsedDocumentOption[];
  selectedDocumentId: string | null;
  latestReview: ReviewSnapshot | null;
  targetRole: string;
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

export function CheckDashboard({
  documents,
  selectedDocumentId,
  latestReview,
  targetRole,
}: CheckDashboardProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const activeDocumentId = selectedDocumentId ?? documents[0]?.id ?? null;

  function handleDocumentChange(documentId: string) {
    router.push(`/resume/check?documentId=${documentId}`);
  }

  function handleRunReview() {
    if (!activeDocumentId) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await runResumeReviewAction(activeDocumentId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  if (documents.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
        No parsed resumes yet. Upload and parse a CV on the{" "}
        <a href="/resume" className="font-semibold text-brand-blue hover:underline">
          resume page
        </a>{" "}
        first.
      </p>
    );
  }

  const result = latestReview?.result ?? null;
  const isRunning =
    pending || latestReview?.status === "pending";

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <label
              htmlFor="resume-select"
              className="text-sm font-medium text-foreground"
            >
              Resume to review
            </label>
            <select
              id="resume-select"
              className="w-full max-w-md rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              value={activeDocumentId ?? ""}
              onChange={(event) => handleDocumentChange(event.target.value)}
              disabled={pending}
            >
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.originalFilename} · {formatDate(doc.updatedAt)}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Target role: <span className="font-medium">{targetRole}</span>
            </p>
          </div>
          <Button
            type="button"
            onClick={handleRunReview}
            disabled={!activeDocumentId || isRunning}
          >
            {isRunning ? "Running review…" : "Run review"}
          </Button>
        </div>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        {latestReview?.status === "failed" && latestReview.errorMessage ? (
          <p className="text-sm text-destructive" role="alert">
            Last review failed: {latestReview.errorMessage}
          </p>
        ) : null}
      </section>

      {latestReview?.status === "completed" && result ? (
        <div className="space-y-6">
          <Card className="border-brand-blue/20 bg-brand-blue/5 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold">Overall score</CardTitle>
              <CardDescription>
                Review from {formatDate(latestReview.createdAt)} — fit for your
                target role, not a hire guarantee.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <span className="text-4xl font-extrabold tracking-tight text-foreground">
                  {result.overallScore}
                </span>
                <Badge variant={scoreBadgeVariant(result.overallScore)}>
                  / 100
                </Badge>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{result.summary}</p>
            </CardContent>
          </Card>

          {result.sectionScores.length > 0 ? (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  Section scores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-border">
                  {result.sectionScores.map((section) => (
                    <li
                      key={section.section}
                      className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium">{section.section}</p>
                        {section.note ? (
                          <p className="text-xs text-muted-foreground">
                            {section.note}
                          </p>
                        ) : null}
                      </div>
                      <Badge variant={scoreBadgeVariant(section.score)}>
                        {section.score}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}

          <div className="grid gap-6 md:grid-cols-2">
            <ReviewListCard title="Strengths" items={result.strengths} />
            <ReviewListCard title="Weaknesses" items={result.weaknesses} />
            <ReviewListCard title="ATS risks" items={result.atsRisks} />
            <ReviewListCard
              title="Missing metrics"
              items={result.missingMetrics}
            />
          </div>

          {result.priorityActions.length > 0 ? (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  Priority actions
                </CardTitle>
                <CardDescription>
                  Tackle lower numbers first for the biggest impact.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="space-y-4">
                  {result.priorityActions
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

          {result.rewriteSuggestions.length > 0 ? (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  Rewrite suggestions
                </CardTitle>
                <CardDescription>
                  AI-suggested improvements grounded in your resume text.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {result.rewriteSuggestions.map((suggestion) => (
                  <div
                    key={suggestion.original}
                    className="space-y-3 rounded-lg border border-border px-4 py-4"
                  >
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Original
                      </p>
                      <p className="mt-1 text-sm">{suggestion.original}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Suggested
                      </p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {suggestion.suggested}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {suggestion.rationale}
                      </p>
                    </div>
                    <BulletRewrite
                      original={suggestion.original}
                      label="Get more alternatives"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <BulletRewrite
            original=""
            label="Rewrite a custom bullet"
            allowCustomInput
          />
        </div>
      ) : latestReview?.status === "pending" ? (
        <p className="text-sm text-muted-foreground">Review in progress…</p>
      ) : (
        <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          No completed review yet. Run a review to see scores and recommendations.
        </p>
      )}
    </div>
  );
}

function ReviewListCard({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          {items.map((item) => (
            <li key={item} className="text-foreground">
              {item}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}