import {
  applicationStages,
  type ApplicationStage,
} from "@/lib/validation/application";

const TERMINAL: ReadonlySet<ApplicationStage> = new Set([
  "offer",
  "rejected",
  "withdrawn",
]);

/** Pipeline order for non-terminal stages (offer is a success terminal). */
const PIPELINE_ORDER: ApplicationStage[] = [
  "interested",
  "preparing",
  "applied",
  "interview",
  "offer",
];

export function isApplicationStage(value: string): value is ApplicationStage {
  return (applicationStages as readonly string[]).includes(value);
}

export function isTerminalStage(stage: ApplicationStage): boolean {
  return TERMINAL.has(stage);
}

/**
 * Valid stage moves for the tracker:
 * - Same stage is always allowed (no-op).
 * - Any non-archived application can move to any other known stage
 *   (real searches skip steps; users correct mistakes).
 * - Rejected/withdrawn can reopen to interested/preparing/applied.
 */
export function canTransitionStage(
  from: ApplicationStage,
  to: ApplicationStage
): boolean {
  if (from === to) return true;
  return isApplicationStage(from) && isApplicationStage(to);
}

export function assertStageTransition(
  from: string,
  to: string
): { ok: true; from: ApplicationStage; to: ApplicationStage } | { ok: false; error: string } {
  if (!isApplicationStage(from)) {
    return { ok: false, error: `Unknown current stage: ${from}` };
  }
  if (!isApplicationStage(to)) {
    return { ok: false, error: `Unknown target stage: ${to}` };
  }
  if (!canTransitionStage(from, to)) {
    return {
      ok: false,
      error: `Cannot move from ${from} to ${to}`,
    };
  }
  return { ok: true, from, to };
}

export type ActionUrgency = "overdue" | "upcoming" | "none";

const UPCOMING_MS = 7 * 24 * 60 * 60 * 1000;

export function classifyActionUrgency(
  nextActionDue: Date | string | null | undefined,
  now: Date = new Date()
): ActionUrgency {
  if (nextActionDue == null) return "none";
  const due =
    typeof nextActionDue === "string" ? new Date(nextActionDue) : nextActionDue;
  if (Number.isNaN(due.getTime())) return "none";
  const t = due.getTime();
  const n = now.getTime();
  if (t < n) return "overdue";
  if (t - n <= UPCOMING_MS) return "upcoming";
  return "none";
}

export type WorkspaceApplication = {
  id: string;
  company: string;
  role: string;
  stage: string;
  status: string;
  nextAction: string | null;
  nextActionDue: Date | string | null;
  updatedAt: Date | string;
};

export type WorkspaceActionItem = WorkspaceApplication & {
  urgency: ActionUrgency;
};

/** Active apps with a next action, overdue first then soonest due. */
export function listWorkspaceActions(
  apps: WorkspaceApplication[],
  now: Date = new Date()
): WorkspaceActionItem[] {
  const withActions = apps
    .filter((a) => a.status === "active" && a.nextAction && a.nextActionDue)
    .map((a) => ({
      ...a,
      urgency: classifyActionUrgency(a.nextActionDue, now),
    }))
    .filter((a) => a.urgency === "overdue" || a.urgency === "upcoming");

  return withActions.sort((a, b) => {
    if (a.urgency !== b.urgency) {
      return a.urgency === "overdue" ? -1 : 1;
    }
    const da = new Date(a.nextActionDue as string | Date).getTime();
    const db = new Date(b.nextActionDue as string | Date).getTime();
    return da - db;
  });
}

export function stageLabel(stage: string): string {
  switch (stage) {
    case "interested":
      return "Interested";
    case "preparing":
      return "Preparing";
    case "applied":
      return "Applied";
    case "interview":
      return "Interview";
    case "offer":
      return "Offer";
    case "rejected":
      return "Rejected";
    case "withdrawn":
      return "Withdrawn";
    default:
      return stage;
  }
}

export function pipelineIndex(stage: ApplicationStage): number {
  const idx = PIPELINE_ORDER.indexOf(stage);
  return idx >= 0 ? idx : PIPELINE_ORDER.length;
}
