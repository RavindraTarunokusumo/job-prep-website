"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import {
  generateCoverLetterAction,
  regenerateCoverLetterSectionAction,
  saveApplicationDraftAction,
} from "@/app/actions/application-draft";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  composeContentFromSections,
  type Length,
  type Tone,
} from "@/lib/validation/application-draft";

const selectClassName =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50";

const TONE_OPTIONS: { value: Tone; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "enthusiastic", label: "Enthusiastic" },
  { value: "formal", label: "Formal" },
  { value: "concise", label: "Concise" },
];

const LENGTH_OPTIONS: { value: Length; label: string }[] = [
  { value: "short", label: "Short" },
  { value: "medium", label: "Medium" },
  { value: "long", label: "Long" },
];

export type ResumeOption = {
  id: string;
  originalFilename: string;
};

export type JobOption = {
  id: string;
  title: string | null;
  company: string | null;
};

export type DraftSections = {
  intro: string;
  body: string;
  closing: string;
};

export type DraftSnapshot = {
  id: string;
  title: string;
  content: string;
  status: string;
  tone: string | null;
  length: string | null;
  sections: DraftSections | null;
  resumeDocumentId: string | null;
  jobDescriptionId: string | null;
  errorMessage: string | null;
  version: number;
};

type DraftEditorProps = {
  resumes: ResumeOption[];
  jobs: JobOption[];
  targetRole: string | null;
  initialDraft: DraftSnapshot | null;
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

function parseLength(value: string | null | undefined): Length {
  if (value === "short" || value === "medium" || value === "long") {
    return value;
  }
  return "medium";
}

function jobLabel(job: JobOption): string {
  const parts = [job.title, job.company].filter(Boolean);
  return parts.length > 0 ? parts.join(" at ") : "Untitled posting";
}

export function DraftEditor({
  resumes,
  jobs,
  targetRole,
  initialDraft,
}: DraftEditorProps) {
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
  const [intro, setIntro] = useState(initialDraft?.sections?.intro ?? "");
  const [body, setBody] = useState(initialDraft?.sections?.body ?? "");
  const [closing, setClosing] = useState(initialDraft?.sections?.closing ?? "");
  const [hasSections, setHasSections] = useState(
    initialDraft?.sections != null
  );
  const [tone, setTone] = useState<Tone>(parseTone(initialDraft?.tone));
  const [length, setLength] = useState<Length>(
    parseLength(initialDraft?.length)
  );
  const [resumeDocumentId, setResumeDocumentId] = useState(
    initialDraft?.resumeDocumentId ?? resumes[0]?.id ?? ""
  );
  const [jobDescriptionId, setJobDescriptionId] = useState(
    initialDraft?.jobDescriptionId ?? ""
  );

  // Parent remounts this component via key={draftId} when selection changes.

  const selectedResume = useMemo(
    () => resumes.find((r) => r.id === resumeDocumentId) ?? null,
    [resumes, resumeDocumentId]
  );
  const selectedJob = useMemo(
    () => jobs.find((j) => j.id === jobDescriptionId) ?? null,
    [jobs, jobDescriptionId]
  );

  const composedFromSections = useMemo(() => {
    if (!hasSections) return null;
    if (!intro.trim() || !body.trim() || !closing.trim()) return null;
    return composeContentFromSections({ intro, body, closing });
  }, [hasSections, intro, body, closing]);

  const updateSection = useCallback(
    (key: keyof DraftSections, value: string) => {
      const next = {
        intro: key === "intro" ? value : intro,
        body: key === "body" ? value : body,
        closing: key === "closing" ? value : closing,
      };
      if (key === "intro") setIntro(value);
      if (key === "body") setBody(value);
      if (key === "closing") setClosing(value);
      setContent(composeContentFromSections(next));
    },
    [intro, body, closing]
  );

  function applySections(sections: DraftSections, nextContent: string) {
    setHasSections(true);
    setIntro(sections.intro);
    setBody(sections.body);
    setClosing(sections.closing);
    setContent(nextContent);
  }

  function runAction(
    label: string,
    action: () => Promise<
      | {
          ok: true;
          draftId?: string;
          content?: string;
          sections?: DraftSections;
        }
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

      if ("sections" in result && result.sections && result.content) {
        applySections(result.sections, result.content);
      }

      if ("draftId" in result && result.draftId) {
        setDraftId(result.draftId);
        // New version / first generate navigates; same-id section regen stays.
        if (result.draftId !== draftId) {
          router.push(`/cover-letter?draftId=${result.draftId}`);
        }
        router.refresh();
        return;
      }

      router.refresh();
    });
  }

  function handleGenerate() {
    runAction("Cover letter generated.", async () =>
      generateCoverLetterAction({
        resumeDocumentId: resumeDocumentId || undefined,
        jobDescriptionId: jobDescriptionId || undefined,
        tone,
        length,
      })
    );
  }

  function handleRegenerateFull() {
    if (!draftId) {
      handleGenerate();
      return;
    }
    runAction("Full letter regenerated as a new version.", async () =>
      generateCoverLetterAction({
        resumeDocumentId: resumeDocumentId || undefined,
        jobDescriptionId: jobDescriptionId || undefined,
        tone,
        length,
        supersedesId: draftId,
      })
    );
  }

  function handleRegenerateSection(section: "intro" | "body" | "closing") {
    if (!draftId) {
      setError("Generate a cover letter first before regenerating a section.");
      return;
    }
    runAction(`Regenerated ${section}.`, async () =>
      regenerateCoverLetterSectionAction({
        draftId,
        section,
        tone,
        length,
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

    // Keep structured sections only when full letter still matches them.
    // Free-editing the main textarea drops section metadata so save cannot
    // overwrite user content by recomposing intro/body/closing.
    const sectionsInSync =
      hasSections &&
      composedFromSections != null &&
      content.trim() === composedFromSections.trim();

    const sectionsPayload = sectionsInSync
      ? { intro: intro.trim(), body: body.trim(), closing: closing.trim() }
      : hasSections
        ? null
        : undefined;

    if (hasSections && !sectionsInSync) {
      setHasSections(false);
    }

    runAction("Draft saved.", async () =>
      saveApplicationDraftAction({
        draftId,
        title: title.trim() || undefined,
        content: content.trim(),
        sections: sectionsPayload,
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
          <Label htmlFor="cl-tone">Tone</Label>
          <select
            id="cl-tone"
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
          <Label htmlFor="cl-length">Length</Label>
          <select
            id="cl-length"
            className={selectClassName}
            value={length}
            onChange={(event) => setLength(event.target.value as Length)}
            disabled={pending}
          >
            {LENGTH_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="cl-resume">Resume</Label>
          <select
            id="cl-resume"
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
          <Label htmlFor="cl-job">Job description (optional)</Label>
          <select
            id="cl-job"
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
        <Label htmlFor="cl-title">Title</Label>
        <Input
          id="cl-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="e.g. Cover letter — Acme Senior Engineer"
          disabled={pending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="cl-content">Cover letter</Label>
        <Textarea
          id="cl-content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Generate a draft or write your letter here…"
          rows={14}
          disabled={pending}
          className="min-h-[280px] font-normal"
        />
      </div>

      {hasSections ? (
        <div className="space-y-4 rounded-lg border border-border bg-muted/10 p-4">
          <p className="text-sm font-medium text-foreground">
            Sections{" "}
            <span className="font-normal text-muted-foreground">
              (synced into the full letter when you edit a section)
            </span>
          </p>
          {(
            [
              { key: "intro" as const, label: "Intro", value: intro },
              { key: "body" as const, label: "Body", value: body },
              { key: "closing" as const, label: "Closing", value: closing },
            ] as const
          ).map((section) => (
            <div key={section.key} className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label htmlFor={`cl-${section.key}`}>{section.label}</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pending || !draftId}
                  onClick={() => handleRegenerateSection(section.key)}
                >
                  Regenerate {section.label.toLowerCase()}
                </Button>
              </div>
              <Textarea
                id={`cl-${section.key}`}
                value={section.value}
                onChange={(event) =>
                  updateSection(section.key, event.target.value)
                }
                rows={section.key === "body" ? 6 : 3}
                disabled={pending}
              />
            </div>
          ))}
        </div>
      ) : null}

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
          onClick={handleRegenerateFull}
        >
          Regenerate full
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
