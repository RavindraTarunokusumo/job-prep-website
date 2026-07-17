"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import {
  completeAttemptAction,
  submitAnswerAction,
  type AttemptDetail,
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type AttemptWorkspaceProps = {
  attempt: AttemptDetail;
};

export function AttemptWorkspace({ attempt }: AttemptWorkspaceProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const firstUnanswered = useMemo(() => {
    const idx = attempt.questions.findIndex((q) => q.existingAnswer == null);
    return idx === -1 ? Math.max(0, attempt.questions.length - 1) : idx;
  }, [attempt.questions]);

  const [index, setIndex] = useState(firstUnanswered);
  const question = attempt.questions[index];
  const total = attempt.questions.length;

  const [selectedKey, setSelectedKey] = useState(
    question?.existingAnswer?.selectedKey ?? ""
  );
  const [freeText, setFreeText] = useState(
    question?.existingAnswer?.freeText ?? ""
  );
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean | null;
    explanation: string | null;
  } | null>(
    question?.existingAnswer
      ? {
          isCorrect: question.existingAnswer.isCorrect,
          explanation: question.explanation,
        }
      : null
  );

  function goTo(nextIndex: number) {
    const next = attempt.questions[nextIndex];
    if (!next) {
      return;
    }
    setIndex(nextIndex);
    setSelectedKey(next.existingAnswer?.selectedKey ?? "");
    setFreeText(next.existingAnswer?.freeText ?? "");
    setFeedback(
      next.existingAnswer
        ? {
            isCorrect: next.existingAnswer.isCorrect,
            explanation: next.explanation,
          }
        : null
    );
    setError(null);
  }

  function handleSubmit() {
    if (!question) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await submitAnswerAction(
        attempt.id,
        question.id,
        question.isReflection ? undefined : selectedKey || undefined,
        question.isReflection ? freeText : undefined
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setFeedback({
        isCorrect: result.isCorrect,
        explanation: result.explanation,
      });
      // Keep local answered state in sync for navigation
      question.existingAnswer = {
        selectedKey: question.isReflection ? null : selectedKey,
        freeText: question.isReflection ? freeText : null,
        isCorrect: result.isCorrect,
      };
      question.explanation = result.explanation;
      router.refresh();
    });
  }

  function handleComplete() {
    setError(null);
    startTransition(async () => {
      const result = await completeAttemptAction(attempt.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/assessments?attemptId=${attempt.id}&view=results`);
      router.refresh();
    });
  }

  if (!question || total === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        This attempt has no questions.
      </p>
    );
  }

  const answeredCount = attempt.questions.filter(
    (q) => q.existingAnswer != null
  ).length;
  const allAnswered = answeredCount === total;
  const isLast = index === total - 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {attempt.categoryName}
          </p>
          <p className="text-xs text-muted-foreground">
            Question {index + 1} of {total} · {answeredCount} answered
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            router.push("/assessments");
            router.refresh();
          }}
        >
          Back to categories
        </Button>
      </div>

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            {question.isReflection ? (
              <Badge variant="outline">Self-reflection</Badge>
            ) : (
              <Badge variant="secondary">Multiple choice</Badge>
            )}
            {question.difficulty ? (
              <Badge variant="outline">{question.difficulty}</Badge>
            ) : null}
          </div>
          <CardTitle className="text-lg font-bold leading-snug">
            {question.prompt}
          </CardTitle>
          {question.isReflection ? (
            <CardDescription>
              There is no single correct answer. Reflect for your own
              preparation — not a clinical or personality diagnosis.
            </CardDescription>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          {question.isReflection ? (
            <div className="space-y-2">
              <Label htmlFor="reflection">Your notes</Label>
              <Textarea
                id="reflection"
                value={freeText}
                onChange={(event) => setFreeText(event.target.value)}
                rows={5}
                disabled={pending || feedback != null}
                placeholder="Write a short reflection…"
              />
            </div>
          ) : (
            <fieldset className="space-y-2" disabled={pending || feedback != null}>
              <legend className="sr-only">Choices</legend>
              {(question.choices ?? []).map((choice) => {
                const selected = selectedKey === choice.key;
                return (
                  <label
                    key={choice.key}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                      selected
                        ? "border-brand-blue bg-brand-blue/5"
                        : "border-border hover:bg-muted/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${question.id}`}
                      value={choice.key}
                      checked={selected}
                      onChange={() => setSelectedKey(choice.key)}
                      className="mt-0.5"
                    />
                    <span>
                      <span className="font-semibold uppercase text-muted-foreground">
                        {choice.key}.
                      </span>{" "}
                      {choice.label}
                    </span>
                  </label>
                );
              })}
            </fieldset>
          )}

          {feedback ? (
            <div
              className={`rounded-lg border px-4 py-3 text-sm ${
                feedback.isCorrect === true
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-100"
                  : feedback.isCorrect === false
                    ? "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-100"
                    : "border-border bg-muted/30 text-foreground"
              }`}
            >
              {feedback.isCorrect === true ? (
                <p className="font-semibold">Correct</p>
              ) : feedback.isCorrect === false ? (
                <p className="font-semibold">Not quite</p>
              ) : (
                <p className="font-semibold">Reflection saved</p>
              )}
              {feedback.explanation ? (
                <p className="mt-1 text-muted-foreground">
                  {feedback.explanation}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2 pt-2">
            {!feedback ? (
              <Button type="button" disabled={pending} onClick={handleSubmit}>
                {pending ? "Saving…" : "Submit answer"}
              </Button>
            ) : null}

            {feedback && !isLast ? (
              <Button type="button" disabled={pending} onClick={() => goTo(index + 1)}>
                Next question
              </Button>
            ) : null}

            {feedback && isLast ? (
              <Button type="button" disabled={pending} onClick={handleComplete}>
                {pending ? "Finishing…" : "Complete practice"}
              </Button>
            ) : null}

            {allAnswered && feedback ? (
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={handleComplete}
              >
                View results
              </Button>
            ) : null}

            {index > 0 ? (
              <Button
                type="button"
                variant="ghost"
                disabled={pending}
                onClick={() => goTo(index - 1)}
              >
                Previous
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
