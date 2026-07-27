"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { generateRequirementMatchesAction } from "@/app/actions/matching";
import { Button } from "@/components/ui/button";

export function GenerateMatchesButton({ jobDescriptionId }: { jobDescriptionId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState<number | null>(null);

  return (
    <div className="space-y-2">
      <Button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError(null);
            const result = await generateRequirementMatchesAction({ jobDescriptionId });
            if (!result.ok) {
              setError(result.error);
              return;
            }
            setCount(result.count);
            router.refresh();
          })
        }
      >
        {pending ? "Mapping…" : "Regenerate requirement mappings"}
      </Button>
      {count != null ? (
        <p className="text-xs text-muted-foreground">Saved {count} suggested mappings.</p>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
