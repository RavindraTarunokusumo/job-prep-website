"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  startAttemptAction,
  type CategoryListItem,
} from "@/app/actions/assessment";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PRACTICE_ONLY_DISCLAIMER } from "@/lib/assessment/disclaimer";


type CategoryListProps = {
  categories: CategoryListItem[];
  seedHint: string | null;
};

export function CategoryList({ categories, seedHint }: CategoryListProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [startingSlug, setStartingSlug] = useState<string | null>(null);

  function handleStart(slug: string) {
    setError(null);
    setStartingSlug(slug);
    startTransition(async () => {
      const result = await startAttemptAction(slug);
      setStartingSlug(null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/assessments?attemptId=${result.attemptId}`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        {PRACTICE_ONLY_DISCLAIMER}
      </div>

      {seedHint ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-100">
          {seedHint}
        </p>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {categories.length === 0 && !seedHint ? (
        <p className="text-sm text-muted-foreground">
          No practice categories available yet.
        </p>
      ) : null}

      <ul className="grid gap-4">
        {categories.map((category) => {
          const isReflection = category.slug === "work_style";
          const busy = pending && startingSlug === category.slug;

          return (
            <li key={category.id}>
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                  <div className="space-y-1.5">
                    <CardTitle className="text-lg font-bold">
                      {category.name}
                    </CardTitle>
                    <CardDescription>
                      {category.description ??
                        "Aptitude-style practice for preparation."}
                    </CardDescription>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <Badge variant="secondary">
                      {category.questionCount}{" "}
                      {category.questionCount === 1 ? "question" : "questions"}
                    </Badge>
                    {isReflection ? (
                      <Badge variant="outline">Self-reflection</Badge>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    {isReflection
                      ? "Not scored. For personal reflection only — not a clinical label."
                      : "Multiple choice. Immediate feedback after each answer."}
                  </p>
                  <Button
                    type="button"
                    disabled={pending || category.questionCount === 0}
                    onClick={() => handleStart(category.slug)}
                  >
                    {busy ? "Starting…" : "Start practice"}
                  </Button>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
