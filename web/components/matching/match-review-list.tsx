"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { reviewRequirementMatchAction } from "@/app/actions/matching";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type MatchRow = {
  id: string;
  requirementKey: string;
  requirementText: string;
  importance: string;
  matchType: string;
  evidenceStrength: number;
  explanation: string;
  userReview: string;
  safeAction: string | null;
};

export function MatchReviewList({ matches }: { matches: MatchRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  if (matches.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No mappings yet. Run a job match analysis or generate mappings for a job.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {matches.map((m) => (
        <li key={m.id} className="rounded-lg border border-border p-4 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{m.requirementText}</span>
            <Badge variant="outline">{m.matchType}</Badge>
            <Badge variant="secondary">{m.importance}</Badge>
            <Badge variant="outline">{m.userReview}</Badge>
            <span className="text-muted-foreground">strength {m.evidenceStrength}</span>
          </div>
          <p className="mt-2 text-muted-foreground">{m.explanation}</p>
          {m.safeAction ? (
            <p className="mt-1 text-xs text-foreground/80">Next: {m.safeAction}</p>
          ) : null}
          {m.userReview === "suggested" ? (
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    await reviewRequirementMatchAction({
                      id: m.id,
                      userReview: "confirmed",
                    });
                    router.refresh();
                  })
                }
              >
                Confirm
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    await reviewRequirementMatchAction({
                      id: m.id,
                      userReview: "rejected",
                    });
                    router.refresh();
                  })
                }
              >
                Reject
              </Button>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
