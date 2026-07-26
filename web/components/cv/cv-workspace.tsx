"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createCvDocumentAction,
  duplicateCvVersionAction,
  exportCvPdfAction,
  restoreCvVersionAction,
  saveCvVersionAction,
  type CvDocumentListItem,
  type CvVersionDetail,
  type CvVersionListItem,
} from "@/app/actions/cv";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { StructuredCv } from "@/lib/validation/cv";

type Props = {
  documents: CvDocumentListItem[];
  versions: CvVersionListItem[];
  selected: CvVersionDetail | null;
  loadError?: string | null;
};

type EditorProps = {
  selected: CvVersionDetail;
  pending: boolean;
  onSave: (summary: string, skills: string, versionName: string) => void;
  onDuplicate: () => void;
  onExport: () => void;
};

/**
 * Keyed by selected version id so local fields remount when switching versions
 * (avoids stale summary/skills wiping another version on save).
 */
function CvEditorForm({
  selected,
  pending,
  onSave,
  onDuplicate,
  onExport,
}: EditorProps) {
  const [summary, setSummary] = useState(selected.content.summary ?? "");
  const [skills, setSkills] = useState(
    (selected.content.skills ?? []).join(", ")
  );
  const [versionName, setVersionName] = useState("v2");

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          Editor — {selected.name}
        </CardTitle>
        <CardDescription>
          Apply rewrites carefully: verified employers and dates are protected
          from silent mutation.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {selected.outdated ? (
          <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
            Source profile or confirmed evidence changed since this version was
            saved.
          </p>
        ) : null}
        <div className="space-y-1.5">
          <Label htmlFor="cv-summary">Summary</Label>
          <Textarea
            id="cv-summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={3}
            disabled={pending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cv-skills">Skills (comma-separated)</Label>
          <Input
            id="cv-skills"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            disabled={pending}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Experience (read-only preview)</Label>
          <ul className="space-y-2 text-sm">
            {selected.content.experience.length === 0 ? (
              <li className="text-muted-foreground">No experience rows.</li>
            ) : (
              selected.content.experience.map((e, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-border px-3 py-2"
                >
                  <span className="font-semibold">
                    {e.title ?? "Role"} — {e.company ?? "Company"}
                  </span>
                  {e.verified ? (
                    <Badge className="ml-2" variant="secondary">
                      verified
                    </Badge>
                  ) : null}
                  {e.description ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {e.description}
                    </p>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="ver-name">Save as version name</Label>
            <Input
              id="ver-name"
              value={versionName}
              onChange={(e) => setVersionName(e.target.value)}
              disabled={pending}
            />
          </div>
          <Button
            type="button"
            disabled={pending}
            onClick={() => onSave(summary, skills, versionName)}
          >
            Save version
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={onDuplicate}
          >
            Duplicate
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={onExport}
          >
            Export PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function CvWorkspace({
  documents,
  versions,
  selected,
  loadError,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function refresh(qs?: string) {
    router.push(qs ? `/cv?${qs}` : "/cv");
    router.refresh();
  }

  function onCreate() {
    setError(null);
    startTransition(async () => {
      const res = await createCvDocumentAction({ fromProfile: true });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      refresh(`documentId=${res.documentId}&versionId=${res.versionId}`);
    });
  }

  function onSaveVersion(summary: string, skills: string, versionName: string) {
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      const content: StructuredCv = {
        ...selected.content,
        summary,
        skills: skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      const res = await saveCvVersionAction({
        documentId: selected.documentId,
        name: versionName,
        content,
        sectionConfig: selected.sectionConfig,
        setCurrent: true,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      refresh(`documentId=${selected.documentId}&versionId=${res.versionId}`);
    });
  }

  function onDuplicate() {
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      const res = await duplicateCvVersionAction(selected.id);
      if (!res.ok) setError(res.error);
      else
        refresh(
          `documentId=${selected.documentId}&versionId=${res.versionId}`
        );
    });
  }

  function onRestore(id: string, documentId: string) {
    setError(null);
    startTransition(async () => {
      const res = await restoreCvVersionAction(id);
      if (!res.ok) setError(res.error);
      else refresh(`documentId=${documentId}&versionId=${id}`);
    });
  }

  function onExport() {
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      const res = await exportCvPdfAction(selected.id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const bin = atob(res.base64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.filename;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <div className="space-y-6">
      {(loadError || error) && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error || loadError}
        </p>
      )}

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">CV documents</CardTitle>
          <CardDescription>
            Create a structured CV from confirmed profile and evidence data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button type="button" onClick={onCreate} disabled={pending}>
            {pending ? "Working…" : "Create CV from profile"}
          </Button>
          {documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No CV documents yet.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {documents.map((d) => (
                <li
                  key={d.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3"
                >
                  <div>
                    <p className="font-semibold">{d.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Current: {d.currentVersionName ?? "—"}
                    </p>
                    {d.outdated ? (
                      <Badge variant="destructive" className="mt-1">
                        Profile/evidence changed — version may be outdated
                      </Badge>
                    ) : null}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!d.currentVersionId || pending}
                    onClick={() =>
                      refresh(
                        `documentId=${d.id}&versionId=${d.currentVersionId}`
                      )
                    }
                  >
                    Open
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {selected ? (
        <>
          <CvEditorForm
            key={selected.id}
            selected={selected}
            pending={pending}
            onSave={onSaveVersion}
            onDuplicate={onDuplicate}
            onExport={onExport}
          />

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Versions</CardTitle>
              <CardDescription>
                Duplicate, compare via open, or restore a prior version.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-border">
                {versions.map((v) => (
                  <li
                    key={v.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold">
                        {v.name}{" "}
                        {v.isCurrent ? (
                          <Badge variant="default">current</Badge>
                        ) : null}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(v.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          refresh(
                            `documentId=${v.documentId}&versionId=${v.id}`
                          )
                        }
                      >
                        Open
                      </Button>
                      {!v.isCurrent ? (
                        <Button
                          size="sm"
                          disabled={pending}
                          onClick={() => onRestore(v.id, v.documentId)}
                        >
                          Restore
                        </Button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
