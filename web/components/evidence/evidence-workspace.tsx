"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  archiveEvidenceAction,
  confirmEvidenceAction,
  createEvidenceAction,
  createStarFromEvidenceAction,
  createStarStoryAction,
  updateStarStoryAction,
  type EvidenceItem,
  type StarStoryItem,
} from "@/app/actions/evidence";
import { evidenceSourceTypes } from "@/lib/validation/evidence";
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

type Props = {
  evidence: EvidenceItem[];
  stories: StarStoryItem[];
  loadError?: string | null;
};

export function EvidenceWorkspace({ evidence, stories, loadError }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [sourceType, setSourceType] = useState<(typeof evidenceSourceTypes)[number]>("employment");
  const [organization, setOrganization] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [achievements, setAchievements] = useState("");
  const [metrics, setMetrics] = useState("");

  const [starTitle, setStarTitle] = useState("");
  const [situation, setSituation] = useState("");
  const [task, setTask] = useState("");
  const [action, setAction] = useState("");
  const [result, setResult] = useState("");

  function refresh() {
    router.refresh();
  }

  function onCreateEvidence(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createEvidenceAction({
        title,
        sourceType,
        organization: organization || undefined,
        roleTitle: roleTitle || undefined,
        achievements: achievements || undefined,
        metrics: metrics || undefined,
        verification: "unconfirmed",
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setTitle("");
      setOrganization("");
      setRoleTitle("");
      setAchievements("");
      setMetrics("");
      refresh();
    });
  }

  function onConfirm(id: string) {
    setError(null);
    startTransition(async () => {
      const res = await confirmEvidenceAction(id);
      if (!res.ok) setError(res.error);
      else refresh();
    });
  }

  function onArchive(id: string) {
    setError(null);
    startTransition(async () => {
      const res = await archiveEvidenceAction(id);
      if (!res.ok) setError(res.error);
      else refresh();
    });
  }

  function onStarFromEvidence(id: string) {
    setError(null);
    startTransition(async () => {
      const res = await createStarFromEvidenceAction(id);
      if (!res.ok) setError(res.error);
      else refresh();
    });
  }

  function onCreateStar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createStarStoryAction({
        title: starTitle,
        situation,
        task,
        action,
        result,
        readiness: "draft",
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setStarTitle("");
      setSituation("");
      setTask("");
      setAction("");
      setResult("");
      refresh();
    });
  }

  function onMarkReady(id: string) {
    setError(null);
    startTransition(async () => {
      const res = await updateStarStoryAction({ id, readiness: "ready" });
      if (!res.ok) setError(res.error);
      else refresh();
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
          <CardTitle className="text-base font-semibold">
            Add career evidence
          </CardTitle>
          <CardDescription>
            Capture facts only. Confirm after you verify — the system never
            invents metrics or achievements.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onCreateEvidence} className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="ev-title">Title</Label>
              <Input
                id="ev-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={pending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ev-type">Source type</Label>
              <select
                id="ev-type"
                className="h-8 w-full rounded-lg border border-border bg-background px-2 text-sm"
                value={sourceType}
                onChange={(e) =>
                  setSourceType(e.target.value as typeof sourceType)
                }
                disabled={pending}
              >
                {evidenceSourceTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ev-org">Organization</Label>
              <Input
                id="ev-org"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                disabled={pending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ev-role">Role</Label>
              <Input
                id="ev-role"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                disabled={pending}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="ev-ach">Achievements (optional, user-known only)</Label>
              <Textarea
                id="ev-ach"
                value={achievements}
                onChange={(e) => setAchievements(e.target.value)}
                disabled={pending}
                rows={2}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="ev-met">Metrics (optional, user-known only)</Label>
              <Input
                id="ev-met"
                value={metrics}
                onChange={(e) => setMetrics(e.target.value)}
                disabled={pending}
                placeholder="Only numbers you can stand behind"
              />
            </div>
            <div>
              <Button type="submit" disabled={pending || !title}>
                {pending ? "Saving…" : "Add evidence"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Evidence bank</CardTitle>
          <CardDescription>
            Confirm facts before using them to seed STAR stories.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {evidence.length === 0 ? (
            <p className="rounded-lg border border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
              No evidence yet. Add employment, education, projects, or other
              experience above.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {evidence.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:justify-between"
                >
                  <div className="space-y-1">
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {[item.roleTitle, item.organization, item.sourceType]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    <Badge
                      variant={
                        item.verification === "confirmed"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {item.verification}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.verification !== "confirmed" ? (
                      <Button
                        size="sm"
                        disabled={pending}
                        onClick={() => onConfirm(item.id)}
                      >
                        Confirm
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() => onStarFromEvidence(item.id)}
                      >
                        Seed STAR
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => onArchive(item.id)}
                    >
                      Archive
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">STAR story bank</CardTitle>
          <CardDescription>
            Situation · Task · Action · Result — only use confirmed facts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={onCreateStar} className="grid gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="star-title">Title</Label>
              <Input
                id="star-title"
                value={starTitle}
                onChange={(e) => setStarTitle(e.target.value)}
                required
                disabled={pending}
              />
            </div>
            {(
              [
                ["situation", situation, setSituation],
                ["task", task, setTask],
                ["action", action, setAction],
                ["result", result, setResult],
              ] as const
            ).map(([key, val, setVal]) => (
              <div key={key} className="space-y-1.5">
                <Label htmlFor={`star-${key}`}>{key}</Label>
                <Textarea
                  id={`star-${key}`}
                  value={val}
                  onChange={(e) => setVal(e.target.value)}
                  required
                  disabled={pending}
                  rows={2}
                />
              </div>
            ))}
            <Button type="submit" disabled={pending || !starTitle}>
              Add STAR story
            </Button>
          </form>

          {stories.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No STAR stories yet. Seed from confirmed evidence or write one
              manually.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {stories.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:justify-between"
                >
                  <div>
                    <p className="font-semibold">{s.title}</p>
                    <Badge variant="outline">{s.readiness}</Badge>
                    <p className="mt-2 text-xs text-muted-foreground line-clamp-3">
                      {s.situation}
                    </p>
                  </div>
                  {s.readiness !== "ready" ? (
                    <Button
                      size="sm"
                      disabled={pending}
                      onClick={() => onMarkReady(s.id)}
                    >
                      Mark ready
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
