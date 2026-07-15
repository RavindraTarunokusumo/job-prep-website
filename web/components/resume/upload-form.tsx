"use client";

import { useActionState, useRef, useState } from "react";
import {
  uploadResume,
  type ResumeActionState,
} from "@/app/actions/resume";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  RESUME_ALLOWED_MIME_TYPES,
  RESUME_MAX_BYTES,
  validateResumeUpload,
} from "@/lib/validation/resume";

const initialState: ResumeActionState = {};

const accept = RESUME_ALLOWED_MIME_TYPES.join(",");

export function UploadForm() {
  const [state, formAction, pending] = useActionState(uploadResume, initialState);
  const [clientError, setClientError] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(file: File | undefined) {
    if (!file) {
      setClientError(null);
      setSelectedName(null);
      return;
    }

    const validation = validateResumeUpload({
      name: file.name,
      type: file.type,
      size: file.size,
    });

    if (!validation.ok) {
      setClientError(validation.error);
      setSelectedName(null);
      return;
    }

    setClientError(null);
    setSelectedName(file.name);
  }

  const error = clientError ?? state.error;

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="resume-file">CV / resume file</Label>
        <div
          className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center"
          onDragOver={(event) => {
            event.preventDefault();
          }}
          onDrop={(event) => {
            event.preventDefault();
            const file = event.dataTransfer.files?.[0];
            if (file && inputRef.current) {
              const dataTransfer = new DataTransfer();
              dataTransfer.items.add(file);
              inputRef.current.files = dataTransfer.files;
              handleFileChange(file);
            }
          }}
        >
          <p className="text-sm font-medium text-foreground">
            Drag and drop your resume here
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            PDF or Word (.docx) · max {RESUME_MAX_BYTES / (1024 * 1024)}MB
          </p>
          <div className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => inputRef.current?.click()}
            >
              Choose file
            </Button>
          </div>
          <input
            ref={inputRef}
            id="resume-file"
            name="file"
            type="file"
            accept={accept}
            className="sr-only"
            required
            onChange={(event) => handleFileChange(event.target.files?.[0])}
          />
        </div>
        {selectedName ? (
          <p className="text-sm text-muted-foreground">
            Selected: <span className="font-medium text-foreground">{selectedName}</span>
          </p>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={pending || Boolean(clientError)}>
        {pending ? "Uploading and parsing…" : "Upload resume"}
      </Button>
    </form>
  );
}