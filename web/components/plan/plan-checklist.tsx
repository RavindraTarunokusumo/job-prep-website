"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  generatePrepPlanAction,
  updatePlanItemStatusAction,
} from "@/app/actions/prep-plan";
import { WorkflowFeedbackPrompt } from "@/components/analytics/workflow-feedback-prompt";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { videoHrefForPlanItem } from "@/lib/videos/recommend";
import type { PrepPlanItemStatus } from "@/lib/validation/prep-plan";

export type PlanItemSnapshot = {
  id: string;
  category: string;
  title: string;
  description: string | null;
  reason: string | null;
  priority: number;
  status: string;
  href: string | null;
};

export type PlanSnapshot = {
  id: string;
  summary: string | null;
  status: string;
  items: PlanItemSnapshot[];
};

type PlanChecklistProps = {
  plan: PlanSnapshot | null;
  stale: boolean;
  canGenerate: boolean;
};

const categoryLabels: Record<string, string> = {
  cv: "CV",
  application: "Application",
  interview: "Interview",
  skills: "Skills",
  other: "Other",
};

function categoryBadgeVariant(
  category: string
): "default" | "secondary" | "outline" {
  switch (category) {
    case "cv":
      return "default";
    case "application":
      return "secondary";
    default:
      return "outline";
  }
}

export function PlanChecklist({ plan, stale, canGenerate }: PlanChecklistProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [feedbackPlanId, setFeedbackPlanId] = useState<string | null>(null);

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const result = await generatePrepPlanAction();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setFeedbackPlanId(result.planId);
      router.refresh();
    });
  }

  function handleRefresh() {
    setError(null);
    startTransition(async () => {
      const result = await generatePrepPlanAction();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setFeedbackPlanId(result.planId);
      router.refresh();
    });
  }

  function handleStatusChange(itemId: string, status: PrepPlanItemStatus) {
    setError(null);
    startTransition(async () => {
      const result = await updatePlanItemStatusAction(itemId, status);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  if (!canGenerate) {
    return (
      <p className="rounded-lg border border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
        Complete onboarding and upload a parsed resume on the{" "}
        <a href="/resume" className="font-semibold text-brand-blue hover:underline">
          resume page
        </a>{" "}
        before generating a plan.
      </p>
    );
  }

  const doneCount =
    plan?.items.filter((item) => item.status === "done").length ?? 0;
  const totalCount = plan?.items.length ?? 0;
  const progress =
    totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {plan ? (
            <p className="text-sm text-muted-foreground">
              {doneCount} of {totalCount} done ({progress}%)
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              No active plan yet. Generate one from your profile and latest review.
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {!plan ? (
            <Button type="button" onClick={handleGenerate} disabled={pending}>
              {pending ? "Generating…" : "Generate plan"}
            </Button>
          ) : stale ? (
            <Button type="button" onClick={handleRefresh} disabled={pending}>
              {pending ? "Refreshing…" : "Refresh plan"}
            </Button>
          ) : null}
        </div>
      </div>

      {stale && plan ? (
        <div className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-foreground">
          <span className="font-semibold">Plan may be outdated.</span> Your profile,
          resume review, or job match has changed since this plan was generated.
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {feedbackPlanId ? (
        <WorkflowFeedbackPrompt
          key={`prep_plan-${feedbackPlanId}`}
          context="prep_plan"
          relatedId={feedbackPlanId}
          title="How useful is this prep plan?"
        />
      ) : null}

      {plan?.summary ? (
        <Card className="border-brand-blue/20 bg-brand-blue/5 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold">Plan summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{plan.summary}</p>
          </CardContent>
        </Card>
      ) : null}

      {plan && plan.items.length > 0 ? (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Checklist</CardTitle>
            <CardDescription>
              Mark items done or skipped as you progress.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              {plan.items
                .slice()
                .sort((a, b) => a.priority - b.priority)
                .map((item) => (
                  <li
                    key={item.id}
                    className={`rounded-lg border px-4 py-3 ${
                      item.status === "done"
                        ? "border-success/30 bg-success/5 opacity-80"
                        : item.status === "skipped"
                          ? "border-border bg-muted/10 opacity-60"
                          : "border-border bg-muted/20"
                    }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="shrink-0">
                            P{item.priority}
                          </Badge>
                          <Badge variant={categoryBadgeVariant(item.category)}>
                            {categoryLabels[item.category] ?? item.category}
                          </Badge>
                          {item.status !== "todo" ? (
                            <Badge
                              variant={
                                item.status === "done" ? "default" : "secondary"
                              }
                            >
                              {item.status}
                            </Badge>
                          ) : null}
                        </div>
                        <p className="text-sm font-semibold">{item.title}</p>
                        {item.description ? (
                          <p className="text-sm text-muted-foreground">
                            {item.description}
                          </p>
                        ) : null}
                        {item.reason ? (
                          <p className="text-xs text-muted-foreground">
                            Why: {item.reason}
                          </p>
                        ) : null}
                        {item.href ? (
                          <Link
                            href={item.href}
                            className="text-xs font-semibold text-brand-blue hover:underline"
                          >
                            Open related tool →
                          </Link>
                        ) : null}
                        {(() => {
                          const videoHref = videoHrefForPlanItem(item);
                          // Avoid duplicating when primary href already points at videos
                          if (
                            !videoHref ||
                            (item.href && item.href.startsWith("/videos"))
                          ) {
                            return null;
                          }
                          return (
                            <Link
                              href={videoHref}
                              className="block text-xs font-semibold text-brand-blue hover:underline"
                            >
                              Watch related interview videos →
                            </Link>
                          );
                        })()}
                      </div>
                      {item.status === "todo" ? (
                        <div className="flex shrink-0 gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={pending}
                            onClick={() => handleStatusChange(item.id, "done")}
                          >
                            Done
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={pending}
                            onClick={() => handleStatusChange(item.id, "skipped")}
                          >
                            Skip
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </li>
                ))}
            </ol>
          </CardContent>
        </Card>
      ) : plan ? (
        <p className="text-sm text-muted-foreground">No checklist items in this plan.</p>
      ) : null}
    </div>
  );
}