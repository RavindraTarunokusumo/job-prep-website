"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  abandonInterviewSessionAction,
  completeInterviewSessionAction,
  startInterviewSessionAction,
  submitInterviewAnswerAction,
} from "@/app/actions/interview";
import {
  FeedbackPanel,
  SessionFeedbackSummary,
} from "@/components/interview/feedback-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { InterviewFeedback } from "@/lib/validation/interview";

const selectClassName =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50";

export type ResumeOption = {
  id: string;
  originalFilename: string;
};

export type JobOption = {
  id: string;
  title: string | null;
  company: string | null;
};

export type TurnSnapshot = {
  id: string;
  kind: string;
  category: string | null;
  orderIndex: number;
  question: string;
  answer: string | null;
  answeredAt: string | null;
  parentTurnId: string | null;
  feedback: InterviewFeedback | null;
};

export type SessionSnapshot = {
  id: string;
  status: string;
  title: string | null;
  targetRole: string;
  experienceLevel: string | null;
  turns: TurnSnapshot[];
};

type SessionWorkspaceProps = {
  resumes: ResumeOption[];
  jobs: JobOption[];
  targetRole: string | null;
  onboardingComplete: boolean;
  session: SessionSnapshot | null;
};

function jobLabel(job: JobOption): string {
  const parts = [job.title, job.company].filter(Boolean);
  return parts.length > 0 ? parts.join(" at ") : "Untitled posting";
}

function categoryLabel(category: string | null): string {
  if (!category) return "Question";
  return category.replace(/_/g, " ");
}

function StartForm({
  resumes,
  jobs,
  targetRole,
  onboardingComplete,
}: {
  resumes: ResumeOption[];
  jobs: JobOption[];
  targetRole: string | null;
  onboardingComplete: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [resumeDocumentId, setResumeDocumentId] = useState(
    resumes[0]?.id ?? ""
  );
  const [jobDescriptionId, setJobDescriptionId] = useState("");

  function handleStart() {
    setError(null);
    startTransition(async () => {
      const result = await startInterviewSessionAction({
        resumeDocumentId: resumeDocumentId || undefined,
        jobDescriptionId: jobDescriptionId || undefined,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/interview?sessionId=${result.sessionId}`);
      router.refresh();
    });
  }

  if (!onboardingComplete) {
    return (
      <p className="rounded-lg border border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
        Complete{" "}
        <a
          href="/onboarding"
          className="font-semibold text-brand-blue hover:underline"
        >
          onboarding
        </a>{" "}
        first so we know your target role before starting a mock interview.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        Preparing for{" "}
        <span className="font-semibold text-foreground">
          {targetRole ?? "your target role"}
        </span>
        . We generate 3–8 role-aligned practice questions. Optional resume and
        job description context improve relevance — we never invent experience.
      </div>

      {resumes.length > 0 ? (
        <div className="space-y-2">
          <Label htmlFor="interview-resume">Resume (optional)</Label>
          <select
            id="interview-resume"
            className={selectClassName}
            value={resumeDocumentId}
            onChange={(e) => setResumeDocumentId(e.target.value)}
            disabled={pending}
          >
            <option value="">No resume context</option>
            {resumes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.originalFilename}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {jobs.length > 0 ? (
        <div className="space-y-2">
          <Label htmlFor="interview-job">Job description (optional)</Label>
          <select
            id="interview-job"
            className={selectClassName}
            value={jobDescriptionId}
            onChange={(e) => setJobDescriptionId(e.target.value)}
            disabled={pending}
          >
            <option value="">No job description</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {jobLabel(j)}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {error ? (
        <p
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <Button type="button" onClick={handleStart} disabled={pending}>
        {pending ? "Generating questions…" : "Start mock interview"}
      </Button>
    </div>
  );
}

function ActiveSession({ session }: { session: SessionSnapshot }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");

  const currentTurn = useMemo(
    () => session.turns.find((t) => t.answeredAt == null) ?? null,
    [session.turns]
  );

  const answeredCount = session.turns.filter((t) => t.answeredAt != null).length;
  const totalCount = session.turns.length;
  const progressPct =
    totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;
  const allAnswered = totalCount > 0 && answeredCount === totalCount;

  const primaryWithFeedback = session.turns.filter(
    (t) => t.kind === "primary" && t.feedback != null
  );

  function handleSubmit() {
    if (!currentTurn) return;
    setError(null);
    setStatusMessage(null);
    const trimmed = answer.trim();
    if (!trimmed) {
      setError("Write an answer before submitting.");
      return;
    }

    startTransition(async () => {
      const result = await submitInterviewAnswerAction({
        sessionId: session.id,
        turnId: currentTurn.id,
        answer: trimmed,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setAnswer("");
      if (result.followUp) {
        setStatusMessage(
          "Follow-up question ready — dig into the missing detail."
        );
      } else if (result.sessionComplete) {
        setStatusMessage(
          "All questions answered. Review coaching feedback, then complete the session."
        );
      } else if (result.feedback) {
        setStatusMessage("Answer saved with coaching feedback.");
      }
      router.refresh();
    });
  }

  function handleComplete() {
    setError(null);
    setStatusMessage(null);
    startTransition(async () => {
      const result = await completeInterviewSessionAction({
        sessionId: session.id,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setStatusMessage("Session completed.");
      router.refresh();
    });
  }

  function handleAbandon() {
    setError(null);
    setStatusMessage(null);
    startTransition(async () => {
      const result = await abandonInterviewSessionAction({
        sessionId: session.id,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/interview");
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            {session.title || "Mock interview"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Role:{" "}
            <span className="font-medium text-foreground">
              {session.targetRole}
            </span>
            {session.experienceLevel
              ? ` · ${session.experienceLevel.replace(/_/g, " ")}`
              : null}
          </p>
        </div>
        <Badge variant="default" className="capitalize">
          {session.status}
        </Badge>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Progress: {answeredCount} of {totalCount}
          </span>
          <span>{progressPct}%</span>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-brand-blue transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {currentTurn ? (
        <div className="space-y-3 rounded-lg border border-border bg-background p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {categoryLabel(currentTurn.category)}
            </Badge>
            {currentTurn.kind === "follow_up" ? (
              <Badge variant="secondary">Follow-up</Badge>
            ) : null}
            <span className="text-xs text-muted-foreground">
              Question {answeredCount + 1} of {totalCount}
            </span>
          </div>
          <p className="text-sm font-medium leading-relaxed text-foreground">
            {currentTurn.question}
          </p>
          <div className="space-y-2">
            <Label htmlFor="interview-answer">Your answer</Label>
            <Textarea
              id="interview-answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer here. Use STAR (Situation, Task, Action, Result) when it fits."
              disabled={pending}
              rows={6}
            />
          </div>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={pending || !answer.trim()}
          >
            {pending
              ? "Submitting (may generate follow-up or feedback)…"
              : "Submit answer"}
          </Button>
        </div>
      ) : allAnswered ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/20 px-4 py-4 text-sm text-muted-foreground">
            You have answered every question. Review coaching feedback below,
            then complete the session.
          </div>
          <SessionFeedbackSummary
            items={session.turns
              .filter((t) => t.kind === "primary")
              .map((t) => ({
                id: t.id,
                question: t.question,
                feedback: t.feedback,
              }))}
          />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No questions available for this session.
        </p>
      )}

      {answeredCount > 0 ? (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">
            Earlier answers
          </h4>
          <ul className="space-y-3">
            {session.turns
              .filter((t) => t.answeredAt != null)
              .map((t) => (
                <li
                  key={t.id}
                  className="space-y-3 rounded-lg border border-border bg-muted/10 px-3 py-3 text-sm"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {categoryLabel(t.category)}
                    </Badge>
                    {t.kind === "follow_up" ? (
                      <Badge variant="secondary">Follow-up</Badge>
                    ) : null}
                  </div>
                  <p className="font-medium text-foreground">{t.question}</p>
                  <p className="whitespace-pre-wrap text-muted-foreground">
                    {t.answer}
                  </p>
                  {t.feedback ? (
                    <FeedbackPanel feedback={t.feedback} compact />
                  ) : null}
                </li>
              ))}
          </ul>
          {primaryWithFeedback.length > 0 && currentTurn ? (
            <p className="text-xs text-muted-foreground">
              Coaching feedback appears under each scored primary answer after
              any follow-up is resolved.
            </p>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {statusMessage ? (
        <p className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
          {statusMessage}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {allAnswered ? (
          <Button type="button" onClick={handleComplete} disabled={pending}>
            {pending ? "Saving…" : "Complete session"}
          </Button>
        ) : null}
        <Button
          type="button"
          variant="outline"
          onClick={handleAbandon}
          disabled={pending}
        >
          Abandon session
        </Button>
      </div>
    </div>
  );
}

function ClosedSession({ session }: { session: SessionSnapshot }) {
  const primaries = session.turns.filter((t) => t.kind === "primary");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            {session.title || "Mock interview"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Role:{" "}
            <span className="font-medium text-foreground">
              {session.targetRole}
            </span>
          </p>
        </div>
        <Badge
          variant={session.status === "completed" ? "secondary" : "outline"}
          className="capitalize"
        >
          {session.status}
        </Badge>
      </div>

      <SessionFeedbackSummary
        items={primaries.map((t) => ({
          id: t.id,
          question: t.question,
          feedback: t.feedback,
        }))}
      />

      <ul className="space-y-3">
        {session.turns.map((t, index) => (
          <li
            key={t.id}
            className="space-y-3 rounded-lg border border-border bg-muted/10 px-3 py-3 text-sm"
          >
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Q{index + 1}
              </span>
              {t.category ? (
                <Badge variant="outline" className="capitalize">
                  {categoryLabel(t.category)}
                </Badge>
              ) : null}
              {t.kind === "follow_up" ? (
                <Badge variant="secondary">Follow-up</Badge>
              ) : null}
            </div>
            <p className="font-medium text-foreground">{t.question}</p>
            {t.answer ? (
              <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
                {t.answer}
              </p>
            ) : (
              <p className="mt-2 text-xs italic text-muted-foreground">
                No answer recorded.
              </p>
            )}
            {t.feedback ? (
              <FeedbackPanel feedback={t.feedback} compact />
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SessionWorkspace({
  resumes,
  jobs,
  targetRole,
  onboardingComplete,
  session,
}: SessionWorkspaceProps) {
  if (!session) {
    return (
      <StartForm
        resumes={resumes}
        jobs={jobs}
        targetRole={targetRole}
        onboardingComplete={onboardingComplete}
      />
    );
  }

  if (session.status === "active") {
    return <ActiveSession session={session} />;
  }

  return <ClosedSession session={session} />;
}
