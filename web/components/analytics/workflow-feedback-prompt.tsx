"use client";

import { useState, useTransition } from "react";
import { submitFeedbackAction } from "@/app/actions/analytics";
import type { FeedbackContext } from "@/lib/analytics/events";
import { FEEDBACK_COMMENT_MAX_CHARS } from "@/lib/analytics/events";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type WorkflowFeedbackPromptProps = {
  context: FeedbackContext;
  relatedId?: string;
  title?: string;
  className?: string;
};

/**
 * Lightweight post-workflow 1–5 rating + optional comment (JOB-78).
 * Stored as AnalyticsEvent name=feedback_rating.
 * Parent should pass a stable `key` including relatedId so state resets on new entity.
 */
export function WorkflowFeedbackPrompt({
  context,
  relatedId,
  title = "How useful was this?",
  className,
}: WorkflowFeedbackPromptProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    setError(null);
    if (rating == null) {
      setError("Pick a rating from 1 to 5.");
      return;
    }
    startTransition(async () => {
      const result = await submitFeedbackAction({
        context,
        rating,
        comment: comment.trim() || undefined,
        relatedId,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDone(true);
    });
  }

  if (done) {
    return (
      <div
        className={
          className ??
          "rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-foreground"
        }
        role="status"
      >
        Thanks for the feedback.
      </div>
    );
  }

  return (
    <div
      className={
        className ??
        "space-y-3 rounded-lg border border-border bg-muted/20 px-4 py-4"
      }
    >
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Rating 1 to 5">
        {[1, 2, 3, 4, 5].map((n) => (
          <Button
            key={n}
            type="button"
            size="sm"
            variant={rating === n ? "default" : "outline"}
            disabled={pending}
            onClick={() => setRating(n)}
            aria-pressed={rating === n}
          >
            {n}
          </Button>
        ))}
      </div>
      <div className="space-y-2">
        <Label htmlFor={`feedback-comment-${context}`}>
          Optional comment
        </Label>
        <Textarea
          id={`feedback-comment-${context}`}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={FEEDBACK_COMMENT_MAX_CHARS}
          placeholder="What worked or what should improve?"
          rows={2}
          disabled={pending}
        />
      </div>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button
        type="button"
        size="sm"
        onClick={handleSubmit}
        disabled={pending || rating == null}
      >
        {pending ? "Sending…" : "Submit feedback"}
      </Button>
    </div>
  );
}
