"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { generatePerformanceReportAction } from "@/app/actions/performance-report";
import { Button } from "@/components/ui/button";

type GenerateReportButtonProps = {
  /** Label when user already has reports (regenerate). */
  hasReports?: boolean;
  className?: string;
};

export function GenerateReportButton({
  hasReports = false,
  className,
}: GenerateReportButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const result = await generatePerformanceReportAction();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/report?reportId=${result.reportId}`);
      router.refresh();
    });
  }

  return (
    <div className={className}>
      <Button
        type="button"
        size="sm"
        disabled={pending}
        onClick={handleGenerate}
      >
        {pending
          ? "Generating…"
          : hasReports
            ? "Regenerate report"
            : "Generate report"}
      </Button>
      {error ? (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
