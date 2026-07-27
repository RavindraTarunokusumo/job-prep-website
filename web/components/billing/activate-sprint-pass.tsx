"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { activateSprintPassAction } from "@/app/actions/billing";
import { Button } from "@/components/ui/button";

export function ActivateSprintPassButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [endsAt, setEndsAt] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <Button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError(null);
            const result = await activateSprintPassAction();
            if (!result.ok) {
              setError(result.error);
              return;
            }
            setEndsAt(result.endsAt);
            router.refresh();
          })
        }
      >
        {pending ? "Activating…" : "Activate 30-day Sprint Pass (stub)"}
      </Button>
      {endsAt ? (
        <p className="text-xs text-muted-foreground">Active until {endsAt.slice(0, 10)}</p>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
