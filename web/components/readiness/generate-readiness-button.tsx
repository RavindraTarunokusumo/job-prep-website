"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { generateReadinessScoreAction } from "@/app/actions/readiness";
import { Button } from "@/components/ui/button";

export function GenerateReadinessButton({
  jobDescriptionId,
}: {
  jobDescriptionId: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="secondary"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError(null);
            const result = await generateReadinessScoreAction({ jobDescriptionId });
            if (!result.ok) {
              setError(result.error);
              return;
            }
            router.refresh();
          })
        }
      >
        {pending ? "Scoring…" : "Compute readiness score"}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
