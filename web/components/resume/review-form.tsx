"use client";

import { useActionState, useMemo, useState } from "react";
import {
  saveParsedResume,
  type ResumeActionState,
} from "@/app/actions/resume";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ParsedResume } from "@/lib/validation/resume";

const initialState: ResumeActionState = {};

const textareaClassName =
  "min-h-24 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type ReviewFormProps = {
  documentId: string;
  initialData: ParsedResume;
  status: string;
  parseError: string | null;
  rawText: string | null;
};

export function ReviewForm({
  documentId,
  initialData,
  status,
  parseError,
  rawText,
}: ReviewFormProps) {
  const [state, formAction, pending] = useActionState(saveParsedResume, initialState);
  const [data, setData] = useState<ParsedResume>(initialData);

  const serialized = useMemo(() => JSON.stringify(data), [data]);

  function updateContact(field: keyof ParsedResume["contact"], value: string) {
    setData((prev) => ({
      ...prev,
      contact: { ...prev.contact, [field]: value },
    }));
  }

  function updateListField(
    field: "skills" | "certifications" | "languages",
    value: string
  ) {
    setData((prev) => ({
      ...prev,
      [field]: value
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0),
    }));
  }

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="documentId" value={documentId} />
      <input type="hidden" name="parsedData" value={serialized} readOnly />

      {status === "failed" && parseError ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Parsing failed: {parseError}. You can correct fields below or re-upload.
        </p>
      ) : null}

      {status === "parsed" &&
      !data.summary &&
      data.experience.length === 0 &&
      data.education.length === 0 &&
      data.skills.length === 0 &&
      rawText ? (
        <p className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          Structured fields look sparse for this file. Expand{" "}
          <span className="font-medium text-foreground">extracted raw text</span>{" "}
          below and paste into the fields, or use{" "}
          <span className="font-medium text-foreground">Retry processing</span>{" "}
          after an update.
        </p>
      ) : null}

      {rawText ? (
        <details
          open={
            !data.summary &&
            data.experience.length === 0 &&
            data.skills.length === 0
          }
          className="rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm"
        >
          <summary className="cursor-pointer font-medium text-foreground">
            Extracted raw text ({rawText.length.toLocaleString()} characters)
          </summary>
          <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">
            {rawText}
          </pre>
        </details>
      ) : (
        <p className="text-sm text-muted-foreground">
          No extracted text is stored for this document yet.
        </p>
      )}

      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">Contact</h2>
          <p className="text-sm text-muted-foreground">
            Verify how employers can reach you.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="contact-name">Full name</Label>
            <Input
              id="contact-name"
              value={data.contact.name ?? ""}
              onChange={(event) => updateContact("name", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-email">Email</Label>
            <Input
              id="contact-email"
              type="email"
              value={data.contact.email ?? ""}
              onChange={(event) => updateContact("email", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-phone">Phone</Label>
            <Input
              id="contact-phone"
              value={data.contact.phone ?? ""}
              onChange={(event) => updateContact("phone", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-location">Location</Label>
            <Input
              id="contact-location"
              value={data.contact.location ?? ""}
              onChange={(event) => updateContact("location", event.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="contact-linkedin">LinkedIn</Label>
            <Input
              id="contact-linkedin"
              value={data.contact.linkedin ?? ""}
              onChange={(event) => updateContact("linkedin", event.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <Label htmlFor="summary">Professional summary</Label>
        <textarea
          id="summary"
          className={textareaClassName}
          value={data.summary ?? ""}
          onChange={(event) =>
            setData((prev) => ({ ...prev, summary: event.target.value }))
          }
        />
      </section>

      <section className="space-y-2">
        <Label htmlFor="skills">Skills (comma-separated)</Label>
        <Input
          id="skills"
          value={data.skills.join(", ")}
          onChange={(event) => updateListField("skills", event.target.value)}
        />
      </section>

      <section className="space-y-2">
        <Label htmlFor="experience">Experience (one role per block)</Label>
        <textarea
          id="experience"
          className={`${textareaClassName} min-h-40`}
          value={data.experience
            .map((entry) => {
              const header = [entry.title, entry.company].filter(Boolean).join(" at ");
              const dates = [entry.startDate, entry.endDate].filter(Boolean).join(" – ");
              const lines = [header, dates, entry.description].filter(Boolean);
              return lines.join("\n");
            })
            .join("\n\n")}
          onChange={(event) => {
            const blocks = event.target.value
              .split(/\n{2,}/)
              .map((block) => block.trim())
              .filter((block) => block.length > 0);
            setData((prev) => ({
              ...prev,
              experience: blocks.map((block) => {
                const lines = block.split("\n");
                const titleLine = lines[0] ?? "";
                const titleParts = titleLine.split(/\s+at\s+/i);
                return {
                  title: titleParts[0]?.trim(),
                  company: titleParts[1]?.trim(),
                  startDate: lines[1]?.includes("–") ? lines[1].split("–")[0]?.trim() : undefined,
                  endDate: lines[1]?.includes("–") ? lines[1].split("–")[1]?.trim() : lines[1],
                  description: lines.slice(2).join("\n") || undefined,
                };
              }),
            }));
          }}
        />
      </section>

      <section className="space-y-2">
        <Label htmlFor="education">Education (one entry per block)</Label>
        <textarea
          id="education"
          className={`${textareaClassName} min-h-32`}
          value={data.education
            .map((entry) => {
              const header = [entry.degree, entry.institution].filter(Boolean).join(" — ");
              const dates = [entry.startDate, entry.endDate].filter(Boolean).join(" – ");
              const lines = [header, dates, entry.description].filter(Boolean);
              return lines.join("\n");
            })
            .join("\n\n")}
          onChange={(event) => {
            const blocks = event.target.value
              .split(/\n{2,}/)
              .map((block) => block.trim())
              .filter((block) => block.length > 0);
            setData((prev) => ({
              ...prev,
              education: blocks.map((block) => {
                const lines = block.split("\n");
                const header = lines[0] ?? "";
                const headerParts = header.split(/\s+—\s+/);
                return {
                  degree: headerParts[0]?.trim(),
                  institution: headerParts[1]?.trim(),
                  startDate: lines[1]?.includes("–") ? lines[1].split("–")[0]?.trim() : undefined,
                  endDate: lines[1]?.includes("–") ? lines[1].split("–")[1]?.trim() : lines[1],
                  description: lines.slice(2).join("\n") || undefined,
                };
              }),
            }));
          }}
        />
      </section>

      <section className="space-y-2">
        <Label htmlFor="certifications">Certifications (comma-separated)</Label>
        <Input
          id="certifications"
          value={data.certifications.join(", ")}
          onChange={(event) => updateListField("certifications", event.target.value)}
        />
      </section>

      <section className="space-y-2">
        <Label htmlFor="languages">Languages (comma-separated)</Label>
        <Input
          id="languages"
          value={data.languages.join(", ")}
          onChange={(event) => updateListField("languages", event.target.value)}
        />
      </section>

      {state.error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Saving…" : "Save corrections"}
      </Button>
    </form>
  );
}