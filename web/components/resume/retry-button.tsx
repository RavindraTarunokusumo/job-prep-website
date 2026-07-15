"use client";

import { useTransition } from "react";
import { retryResumeProcessing } from "@/app/actions/resume";
import { Button } from "@/components/ui/button";

type RetryButtonProps = {
  documentId: string;
};

export function RetryButton({ documentId }: RetryButtonProps) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await retryResumeProcessing(documentId);
        });
      }}
    >
      {pending ? "Retrying…" : "Retry extraction"}
    </Button>
  );
}