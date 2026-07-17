"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  generateShortMessageAction,
  saveApplicationDraftAction,
} from "@/app/actions/application-draft";
import type { JobOption, ResumeOption } from "@/components/cover-letter/draft-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Tone } from "@/lib/validation/application-draft";

const selectClassName =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50";

const TONE_OPTIONS: { value: Tone; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "enthusiastic", label: "Enthusiastic" },
  { value: "formal", label: "Formal" },
  { value: "concise", label: "Concise" },
];

export type ShortMessageTypeOption =
  | "recruiter_dm"
  | "referral_request"
  | "application_note";

const MESSAGE_TYPE_OPTIONS: {
  value: ShortMessageTypeOption;
  label: string;
}[] = [
  { value: "recruiter_dm", label: "Recruiter DM" },
  { value: "referral_request", label: "Referral request" },
  { value: "application_note", label: "Application note" },
];

export type MessageDraftSnapshot = {
  id: string;
  title: string;
  content: string;
  status: string;
  type: string;
  tone: string | null;
  resumeDocumentId: string | null;
  jobDescriptionId: string | null;
  errorMessage: string | null;
  version: number;
};

type MessageEditorProps = {
  resumes: ResumeOption[];
  jobs: JobOption[];
  targetRole: string | null;
  initialDraft: MessageDraftSnapshot | null;
};

function parseTone(value: string | null | undefined): Tone {
  if (
    value === "professional" ||
    value === "enthusiastic" ||
    value === "formal" ||
    value === "concise"
  ) {
    return value;
  }
  return "professional";
}

function parseMessageType(
  value: string | null | undefined
): ShortMessageTypeOption {
  if (
    value === "recruiter_dm" ||
    value === "referral_request" ||
    value === "application_note"
  ) {
    return value;
  }
  return "recruiter_dm";
}

function jobLabel(job: JobOption): string {
  const parts = [job.title, job.company].filter(Boolean);
  return parts.length > 0 ? parts.join(" at ") : "Untitled posting";
}

export function MessageEditor({
  resumes,
  jobs,
  targetRole,
  initialDraft,
}: MessageEditorProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(
    initialDraft?.errorMessage ?? null
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [copyDone, setCopyDone] = useState(false);

  const [draftId, setDraftId] = useState<string | null>(
    initialDraft?.id ?? null
  );
  const [title, setTitle] = useState(initialDraft?.title ?? "");
  const [content, setContent] = useState(initialDraft?.content ?? "");
  const [messageType, setMessageType] = useState<ShortMessageTypeOption>(
    parseMessageType(initialDraft?.type)
  );
  const [tone, setTone] = useState<Tone>(parseTone(initialDraft?.tone));
  const [resumeDocumentId, setResumeDocumentId] = useState(
    initialDraft?.resumeDocumentId ?? resumes[0]?.id ?? ""
  );
  const [jobDescriptionId, setJobDescriptionId] = useState(
    initialDraft?.jobDescriptionId ?? ""
  );

  const selectedResume = useMemo(
    () => resumes.find((r) => r.id === resumeDocumentId) ?? null,
    [resumes, resumeDocumentId]
  );
  const selectedJob = useMemo(
    () => jobs.find((j) => j.id === jobDescriptionId) ?? null,
    [jobs, jobDescriptionId]
  );

  function runAction(
    label: string,
    action: () => Promise<
      | { ok: true; draftId?: string }
      | { ok: false; error: string }
      | { ok: true }
    >
  ) {
    setError(null);
    setStatusMessage(null);
    setCopyDone(false);

    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.error);
        return;
      }

      setStatusMessage(label);

      if ("draftId" in result && result.draftId) {
        setDraftId(result.draftId);
        router.push(`/cover-letter?draftId=${result.draftId}`);
        router.refresh();
        return;
      }

      router.refresh();
    });
  }

  function handleGenerate() {
    runAction("Short message generated.", async () =>
      generateShortMessageAction({
        messageType,
        resumeDocumentId: resumeDocumentId || undefined,
        jobDescriptionId: jobDescriptionId || undefined,
        tone,
      })
    );
  }

  function handleRegenerate() {
    // Only supersede when regenerating the same message type as the open draft.
    if (!draftId || (initialDraft && initialDraft.type !== messageType)) {
      handleGenerate();
      return;
    }
    runAction("Message regenerated as a new version.", async () =>
      generateShortMessageAction({
        messageType,
        resumeDocumentId: resumeDocumentId || undefined,
        jobDescriptionId: jobDescriptionId || undefined,
        tone,
        supersedesId: draftId,
      })
    );
  }

  function handleSave() {
    if (!draftId) {
      setError("Generate a draft first, then save your edits.");
      return;
    }
    if (!content.trim()) {
      setError("Draft content cannot be empty.");
      return;
    }

    runAction("Draft saved.", async () =>
      saveApplicationDraftAction({
        draftId,
        title: title.trim() || undefined,
        content: content.trim(),
      })
    );
  }

  async function handleCopy() {
    setError(null);
    setStatusMessage(null);
    if (!content.trim()) {
      setError("Nothing to copy yet.");
      return;
    }
    try {
      await navigator.clipboard.writeText(content);
      setCopyDone(true);
      setStatusMessage("Copied to clipboard.");
    } catch {
      setError("Could not copy to clipboard. Select and copy manually.");
    }
  }

  if (resumes.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
        No parsed resumes yet. Upload and parse a CV on the{" "}
        <a href="/resume" className="font-semibold text-brand-blue hover:underline">
          resume page
        </a>{" "}
        first.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">Editable draft — review before sending</Badge>
        {initialDraft?.status === "generating" ? (
          <Badge variant="outline">Generating…</Badge>
        ) : null}
        {initialDraft?.status === "failed" ? (
          <Badge variant="destructive">Failed</Badge>
        ) : null}
        {draftId && initialDraft?.version ? (
          <Badge variant="outline">v{initialDraft.version}</Badge>
        ) : null}
      </div>

      <div className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Source context</p>
        <ul className="mt-1 space-y-0.5 text-xs sm:text-sm">
          <li>
            Target role:{" "}
            <span className="text-foreground">
              {targetRole?.trim() || "Not set — complete onboarding"}
            </span>
          </li>
          <li>
            Resume:{" "}
            <span className="text-foreground">
              {selectedResume?.originalFilename ?? "None selected"}
            </span>
          </li>
          <li>
            Job:{" "}
            <span className="text-foreground">
              {selectedJob ? jobLabel(selectedJob) : "Profile-only (no JD)"}
            </span>
          </li>
        </ul>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="msg-type">Message type</Label>
          <select
            id="msg-type"
            className={selectClassName}
            value={messageType}
            onChange={(event) =>
              setMessageType(event.target.value as ShortMessageTypeOption)
            }
            disabled={pending}
          >
            {MESSAGE_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="msg-tone">Tone</Label>
          <select
            id="msg-tone"
            className={selectClassName}
            value={tone}
            onChange={(event) => setTone(event.target.value as Tone)}
            disabled={pending}
          >
            {TONE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="msg-resume">Resume</Label>
          <select
            id="msg-resume"
            className={selectClassName}
            value={resumeDocumentId}
            onChange={(event) => setResumeDocumentId(event.target.value)}
            disabled={pending}
          >
            {resumes.map((resume) => (
              <option key={resume.id} value={resume.id}>
                {resume.originalFilename}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="msg-job">Job description (optional)</Label>
          <select
            id="msg-job"
            className={selectClassName}
            value={jobDescriptionId}
            onChange={(event) => setJobDescriptionId(event.target.value)}
            disabled={pending}
          >
            <option value="">None — use profile only</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {jobLabel(job)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="msg-title">Title</Label>
        <Input
          id="msg-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="e.g. Recruiter DM — Acme Engineer"
          disabled={pending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="msg-content">Message</Label>
        <Textarea
          id="msg-content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Generate a short message or write one here…"
          rows={10}
          disabled={pending}
          className="min-h-[200px] font-normal"
        />
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {statusMessage && !error ? (
        <p className="text-sm text-muted-foreground" role="status">
          {statusMessage}
          {copyDone ? " ✓" : null}
        </p>
      ) : null}

      {pending ? (
        <p className="text-sm text-muted-foreground" role="status">
          Working… this can take a few seconds.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={pending || !resumeDocumentId}
          onClick={handleGenerate}
        >
          {pending ? "Working…" : "Generate"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={pending || !resumeDocumentId}
          onClick={handleRegenerate}
        >
          Regenerate
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pending || !draftId || !content.trim()}
          onClick={handleSave}
        >
          Save
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pending || !content.trim()}
          onClick={() => {
            void handleCopy();
          }}
        >
          Copy
        </Button>
      </div>
    </div>
  );
}
