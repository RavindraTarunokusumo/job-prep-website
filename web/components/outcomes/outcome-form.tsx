"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { recordApplicationOutcomeAction } from "@/app/actions/outcomes";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const STAGES = [
  "applied",
  "screening",
  "interview",
  "final",
  "offer",
  "rejected",
  "withdrawn",
  "no_response",
] as const;

export function OutcomeForm({
  jobs,
}: {
  jobs: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [jobDescriptionId, setJobDescriptionId] = useState(jobs[0]?.id ?? "");
  const [stage, setStage] = useState<(typeof STAGES)[number]>("applied");
  const [employerFeedback, setEmployerFeedback] = useState("");
  const [userInterpretation, setUserInterpretation] = useState("");

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          const result = await recordApplicationOutcomeAction({
            jobDescriptionId: jobDescriptionId || null,
            stage,
            employerFeedback: employerFeedback || null,
            userInterpretation: userInterpretation || null,
            isSensitive: true,
          });
          if (!result.ok) {
            setError(result.error);
            return;
          }
          setEmployerFeedback("");
          setUserInterpretation("");
          router.refresh();
        });
      }}
    >
      <div className="space-y-1">
        <Label htmlFor="job">Job</Label>
        <select
          id="job"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          value={jobDescriptionId}
          onChange={(e) => setJobDescriptionId(e.target.value)}
        >
          <option value="">No linked job</option>
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>
              {j.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="stage">Stage</Label>
        <select
          id="stage"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          value={stage}
          onChange={(e) => setStage(e.target.value as (typeof STAGES)[number])}
        >
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="employer">Employer feedback (factual)</Label>
        <Textarea
          id="employer"
          value={employerFeedback}
          onChange={(e) => setEmployerFeedback(e.target.value)}
          rows={2}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="user-view">Your interpretation</Label>
        <Textarea
          id="user-view"
          value={userInterpretation}
          onChange={(e) => setUserInterpretation(e.target.value)}
          rows={2}
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save outcome"}
      </Button>
    </form>
  );
}
