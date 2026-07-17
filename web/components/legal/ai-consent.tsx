"use client";

import { useState, useTransition } from "react";
import { acceptConsentAction } from "@/app/actions/privacy";
import { DisclaimerBanner } from "@/components/legal/disclaimer-banner";
import { Button } from "@/components/ui/button";

type AiConsentBannerProps = {
  /** Whether the user already has ai_processing consent for the current copy version. */
  initialAccepted: boolean;
  /** Optional extra disclaimer key (defaults to aiGuidanceDisclaimer). */
  disclaimerKey?:
    | "aiGuidanceDisclaimer"
    | "jobFitLimitations"
    | "careerRecommendationLimits";
};

/**
 * Shared AI consent gate UI for resume review, job match, cover letter, and plan.
 * When already accepted, shows a short disclaimer only.
 */
export function AiConsentBanner({
  initialAccepted,
  disclaimerKey = "aiGuidanceDisclaimer",
}: AiConsentBannerProps) {
  const [accepted, setAccepted] = useState(initialAccepted);
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (accepted) {
    return <DisclaimerBanner copyKey={disclaimerKey} />;
  }

  function handleAccept() {
    if (!checked) {
      setError("Check the box to confirm you understand AI processing.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await acceptConsentAction("ai_processing");
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setAccepted(true);
    });
  }

  return (
    <div className="space-y-3 rounded-lg border border-brand-blue/25 bg-brand-blue/5 px-4 py-3">
      <DisclaimerBanner
        copyKey={disclaimerKey}
        className="border-0 bg-transparent px-0 py-0"
      />
      <label className="flex items-start gap-2 text-sm font-medium text-foreground">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => {
            setChecked(event.target.checked);
            setError(null);
          }}
          className="mt-0.5 size-4 shrink-0 rounded border-input"
        />
        <span>
          I understand RoleReady may send my career materials to AI providers to
          generate guidance and drafts for me.
        </span>
      </label>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button
        type="button"
        size="sm"
        onClick={handleAccept}
        disabled={pending || !checked}
      >
        {pending ? "Saving…" : "Accept AI processing"}
      </Button>
    </div>
  );
}
