"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { analyzeJobDescriptionAction } from "@/app/actions/job-match";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type ResumeOption = {
  id: string;
  originalFilename: string;
};

type PasteFormProps = {
  resumes: ResumeOption[];
  defaultResumeId: string | null;
};

export function PasteForm({ resumes, defaultResumeId }: PasteFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [rawText, setRawText] = useState("");
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [resumeDocumentId, setResumeDocumentId] = useState(
    defaultResumeId ?? resumes[0]?.id ?? ""
  );

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await analyzeJobDescriptionAction({
        rawText,
        title: title.trim() || undefined,
        company: company.trim() || undefined,
        resumeDocumentId: resumeDocumentId || undefined,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      router.push(`/jobs/match?matchId=${result.matchId}`);
      router.refresh();
    });
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="jd-title">Job title (optional)</Label>
          <Input
            id="jd-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Senior Software Engineer"
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="jd-company">Company (optional)</Label>
          <Input
            id="jd-company"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            placeholder="e.g. Acme Corp"
            disabled={pending}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="resume-select">Resume to match</Label>
        <select
          id="resume-select"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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
        <Label htmlFor="jd-text">Job description</Label>
        <Textarea
          id="jd-text"
          value={rawText}
          onChange={(event) => setRawText(event.target.value)}
          placeholder="Paste the full job posting here…"
          rows={12}
          disabled={pending}
          required
        />
        <p className="text-xs text-muted-foreground">
          Paste the complete posting for best results (at least a few sentences).
        </p>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending || !rawText.trim()}>
        {pending ? "Analyzing…" : "Analyze match"}
      </Button>
    </form>
  );
}