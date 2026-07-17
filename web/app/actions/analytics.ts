"use server";

import {
  ANALYTICS_EVENTS,
  FEEDBACK_COMMENT_MAX_CHARS,
  FEEDBACK_CONTEXTS,
  type FeedbackContext,
} from "@/lib/analytics/events";
import { trackEvent } from "@/lib/analytics/track";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export type SubmitFeedbackResult =
  | { ok: true }
  | { ok: false; error: string };

export async function submitFeedbackAction(input: {
  context: string;
  rating: number;
  comment?: string;
  relatedId?: string;
}): Promise<SubmitFeedbackResult> {
  const user = await requireUser();

  if (!(FEEDBACK_CONTEXTS as readonly string[]).includes(input.context)) {
    return { ok: false, error: "Invalid feedback context." };
  }
  const context = input.context as FeedbackContext;

  const rating = Number(input.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: "Choose a rating from 1 to 5." };
  }

  let comment: string | undefined;
  if (input.comment != null && String(input.comment).trim().length > 0) {
    comment = String(input.comment).trim().slice(0, FEEDBACK_COMMENT_MAX_CHARS);
  }

  const relatedId =
    typeof input.relatedId === "string" && input.relatedId.trim()
      ? input.relatedId.trim()
      : undefined;

  const saved = await trackEvent({
    userId: user.id,
    name: ANALYTICS_EVENTS.FEEDBACK_RATING,
    props: {
      context,
      rating,
      ...(comment ? { comment } : {}),
      ...(relatedId ? { relatedId } : {}),
    },
  });

  if (!saved) {
    return {
      ok: false,
      error: "Could not save feedback right now. Please try again.",
    };
  }

  return { ok: true };
}

/** Per-user counts keyed by event name for the validation metrics card. */
export async function getMyEventCounts(): Promise<Record<string, number>> {
  const user = await requireUser();

  const rows = await prisma.analyticsEvent.groupBy({
    by: ["name"],
    where: { userId: user.id },
    _count: { _all: true },
  });

  const counts: Record<string, number> = {};
  for (const row of rows) {
    counts[row.name] = row._count._all;
  }
  return counts;
}
