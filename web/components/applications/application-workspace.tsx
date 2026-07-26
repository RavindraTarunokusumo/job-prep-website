"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  archiveApplicationAction,
  createApplicationAction,
  moveApplicationStageAction,
  type ApplicationListItem,
} from "@/app/actions/application";
import { applicationStages } from "@/lib/validation/application";
import { stageLabel } from "@/lib/applications/stage";
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

type Props = {
  applications: ApplicationListItem[];
  overdue: ApplicationListItem[];
  upcoming: ApplicationListItem[];
  loadError?: string | null;
};

export function ApplicationWorkspace({
  applications,
  overdue,
  upcoming,
  loadError,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [nextActionDue, setNextActionDue] = useState("");

  function refresh() {
    router.refresh();
  }

  function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createApplicationAction({
        company,
        role,
        nextAction: nextAction || undefined,
        nextActionDue: nextActionDue
          ? new Date(nextActionDue).toISOString()
          : undefined,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setCompany("");
      setRole("");
      setNextAction("");
      setNextActionDue("");
      refresh();
    });
  }

  function onStage(id: string, stage: string) {
    setError(null);
    startTransition(async () => {
      const result = await moveApplicationStageAction(id, stage);
      if (!result.ok) setError(result.error);
      else refresh();
    });
  }

  function onArchive(id: string) {
    setError(null);
    startTransition(async () => {
      const result = await archiveApplicationAction(id);
      if (!result.ok) setError(result.error);
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

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Overdue actions</CardTitle>
            <CardDescription className="text-xs">
              Next actions past their deadline
            </CardDescription>
          </CardHeader>
          <CardContent>
            {overdue.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing overdue.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {overdue.map((a) => (
                  <li key={a.id} className="flex justify-between gap-2">
                    <span>
                      <span className="font-semibold">{a.company}</span> —{" "}
                      {a.nextAction}
                    </span>
                    <Badge variant="destructive">Overdue</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Upcoming (7 days)</CardTitle>
            <CardDescription className="text-xs">
              Actions due soon
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming actions.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {upcoming.map((a) => (
                  <li key={a.id} className="flex justify-between gap-2">
                    <span>
                      <span className="font-semibold">{a.company}</span> —{" "}
                      {a.nextAction}
                    </span>
                    <Badge variant="secondary">Upcoming</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Add application
          </CardTitle>
          <CardDescription>
            Track a role from interest through outcome. No job-board scraping.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onCreate} className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
                disabled={pending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
                disabled={pending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nextAction">Next action</Label>
              <Input
                id="nextAction"
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
                disabled={pending}
                placeholder="e.g. Tailor CV"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nextActionDue">Deadline</Label>
              <Input
                id="nextActionDue"
                type="datetime-local"
                value={nextActionDue}
                onChange={(e) => setNextActionDue(e.target.value)}
                disabled={pending}
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={pending || !company || !role}>
                {pending ? "Saving…" : "Create application"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Applications
          </CardTitle>
          <CardDescription>
            Active pipeline. Change stage or archive when done.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <p className="rounded-lg border border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
              No applications yet. Add a company and role above to start your
              workspace.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {applications.map((app) => (
                <li
                  key={app.id}
                  className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="font-semibold text-foreground">
                      {app.role}{" "}
                      <span className="font-normal text-muted-foreground">
                        at {app.company}
                      </span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{stageLabel(app.stage)}</Badge>
                      {app.nextAction ? (
                        <span className="text-xs text-muted-foreground">
                          Next: {app.nextAction}
                          {app.nextActionDue
                            ? ` · ${new Date(app.nextActionDue).toLocaleString()}`
                            : ""}
                        </span>
                      ) : null}
                    </div>
                    {app.notes ? (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {app.notes}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      className="h-8 rounded-lg border border-border bg-background px-2 text-sm"
                      value={app.stage}
                      disabled={pending}
                      onChange={(e) => onStage(app.id, e.target.value)}
                      aria-label={`Stage for ${app.company}`}
                    >
                      {applicationStages.map((s) => (
                        <option key={s} value={s}>
                          {stageLabel(s)}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={pending}
                      onClick={() => onArchive(app.id)}
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

    </div>
  );
}
