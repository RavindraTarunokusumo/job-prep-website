"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  confirmCareerEvidenceAction,
  createCareerEvidenceAction,
  createSkillAction,
  createStarStoryAction,
} from "@/app/actions/evidence";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function CreateSkillForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          const result = await createSkillAction({
            name,
            verification: "confirmed",
          });
          if (!result.ok) {
            setError(result.error);
            return;
          }
          setName("");
          router.refresh();
        });
      }}
    >
      <div className="space-y-1">
        <Label htmlFor="skill-name">Confirmed skill</Label>
        <Input
          id="skill-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. TypeScript"
          required
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={pending || !name.trim()}>
        {pending ? "Saving…" : "Add skill"}
      </Button>
    </form>
  );
}

export function CreateEvidenceForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [organization, setOrganization] = useState("");
  const [responsibilities, setResponsibilities] = useState("");

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          const result = await createCareerEvidenceAction({
            title,
            sourceType: "employment",
            organization: organization || undefined,
            responsibilities: responsibilities || undefined,
            verification: "unconfirmed",
          });
          if (!result.ok) {
            setError(result.error);
            return;
          }
          setTitle("");
          setOrganization("");
          setResponsibilities("");
          router.refresh();
        });
      }}
    >
      <div className="space-y-1">
        <Label htmlFor="ev-title">Evidence title</Label>
        <Input id="ev-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="ev-org">Organization</Label>
        <Input id="ev-org" value={organization} onChange={(e) => setOrganization(e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="ev-resp">Responsibilities / achievements</Label>
        <Textarea
          id="ev-resp"
          value={responsibilities}
          onChange={(e) => setResponsibilities(e.target.value)}
          rows={3}
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={pending || !title.trim()}>
        {pending ? "Saving…" : "Add evidence"}
      </Button>
    </form>
  );
}

export function ConfirmEvidenceButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await confirmCareerEvidenceAction({ id });
          router.refresh();
        })
      }
    >
      Confirm
    </Button>
  );
}

export function CreateStarForm({ evidenceId }: { evidenceId?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [situation, setSituation] = useState("");
  const [task, setTask] = useState("");
  const [action, setAction] = useState("");
  const [result, setResult] = useState("");

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          const res = await createStarStoryAction({
            title,
            situation,
            task,
            action,
            result,
            readiness: "ready",
            verification: "confirmed",
            evidenceId: evidenceId ?? null,
          });
          if (!res.ok) {
            setError(res.error);
            return;
          }
          setTitle("");
          setSituation("");
          setTask("");
          setAction("");
          setResult("");
          router.refresh();
        });
      }}
    >
      <div className="space-y-1">
        <Label>STAR title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Textarea placeholder="Situation" value={situation} onChange={(e) => setSituation(e.target.value)} required />
        <Textarea placeholder="Task" value={task} onChange={(e) => setTask(e.target.value)} required />
        <Textarea placeholder="Action" value={action} onChange={(e) => setAction(e.target.value)} required />
        <Textarea placeholder="Result" value={result} onChange={(e) => setResult(e.target.value)} required />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Add ready STAR story"}
      </Button>
    </form>
  );
}
