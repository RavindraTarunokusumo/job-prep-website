"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createVideoAction } from "@/app/actions/video";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { parseTagList } from "@/lib/validation/video";

export function VideoAdminForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const form = e.currentTarget;
    const fd = new FormData(form);
    const title = String(fd.get("title") ?? "").trim();
    const url = String(fd.get("url") ?? "").trim();
    const categoryTags = parseTagList(String(fd.get("categoryTags") ?? ""));
    const targetRoles = parseTagList(String(fd.get("targetRoles") ?? ""));
    const targetIndustries = parseTagList(
      String(fd.get("targetIndustries") ?? "")
    );
    const experienceLevels = parseTagList(
      String(fd.get("experienceLevels") ?? "")
    );
    const summary = String(fd.get("summary") ?? "").trim() || null;
    const transcript = String(fd.get("transcript") ?? "").trim() || null;
    const published = fd.get("published") === "on";

    startTransition(async () => {
      const result = await createVideoAction({
        title,
        url,
        categoryTags,
        targetRoles,
        targetIndustries,
        experienceLevels,
        summary,
        transcript,
        published,
        sortOrder: 0,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setSuccess("Video entry saved to the global library.");
      form.reset();
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required maxLength={200} disabled={pending} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="url">Public watch URL</Label>
        <Input
          id="url"
          name="url"
          type="url"
          required
          placeholder="https://www.youtube.com/watch?v=…"
          disabled={pending}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="categoryTags">Category tags (comma-separated)</Label>
        <Input
          id="categoryTags"
          name="categoryTags"
          required
          placeholder="behavioral, general"
          disabled={pending}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="targetRoles">Roles (optional)</Label>
          <Input
            id="targetRoles"
            name="targetRoles"
            placeholder="Software Engineer"
            disabled={pending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="targetIndustries">Industries (optional)</Label>
          <Input
            id="targetIndustries"
            name="targetIndustries"
            placeholder="Technology"
            disabled={pending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="experienceLevels">Experience (optional)</Label>
          <Input
            id="experienceLevels"
            name="experienceLevels"
            placeholder="entry, mid"
            disabled={pending}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="summary">Summary</Label>
        <Textarea
          id="summary"
          name="summary"
          rows={3}
          maxLength={2000}
          disabled={pending}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="transcript">Transcript / notes (optional)</Label>
        <Textarea
          id="transcript"
          name="transcript"
          rows={4}
          maxLength={50000}
          disabled={pending}
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="published"
          defaultChecked
          disabled={pending}
          className="size-4 rounded border-input"
        />
        Published (visible in library)
      </label>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="text-sm text-green-700 dark:text-green-400" role="status">
          {success}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Add video"}
      </Button>
    </form>
  );
}
