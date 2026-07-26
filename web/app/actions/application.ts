"use server";

import { revalidatePath } from "next/cache";
import {
  listWorkspaceActions,
  assertStageTransition,
  type WorkspaceApplication,
} from "@/lib/applications/stage";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import {
  applicationStageSchema,
  createApplicationSchema,
  updateApplicationSchema,
} from "@/lib/validation/application";

type ActionErr = { ok: false; error: string };
type ActionOkId = { ok: true; id: string };

function emptyToNull(v: string | null | undefined): string | null {
  if (v == null || v === "") return null;
  return v;
}

function parseOptionalDate(
  value: string | null | undefined
): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value == null || value === "") return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export type ApplicationListItem = {
  id: string;
  company: string;
  role: string;
  stage: string;
  status: string;
  location: string | null;
  sourceUrl: string | null;
  nextAction: string | null;
  nextActionDue: string | null;
  appliedAt: string | null;
  closingDate: string | null;
  contactName: string | null;
  contactEmail: string | null;
  notes: string | null;
  jobDescriptionId: string | null;
  jobMatchAnalysisId: string | null;
  applicationDraftId: string | null;
  interviewSessionId: string | null;
  preparationPlanId: string | null;
  createdAt: string;
  updatedAt: string;
};

function serialize(
  row: {
    id: string;
    company: string;
    role: string;
    stage: string;
    status: string;
    location: string | null;
    sourceUrl: string | null;
    nextAction: string | null;
    nextActionDue: Date | null;
    appliedAt: Date | null;
    closingDate: Date | null;
    contactName: string | null;
    contactEmail: string | null;
    notes: string | null;
    jobDescriptionId: string | null;
    jobMatchAnalysisId: string | null;
    applicationDraftId: string | null;
    interviewSessionId: string | null;
    preparationPlanId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }
): ApplicationListItem {
  return {
    id: row.id,
    company: row.company,
    role: row.role,
    stage: row.stage,
    status: row.status,
    location: row.location,
    sourceUrl: row.sourceUrl,
    nextAction: row.nextAction,
    nextActionDue: row.nextActionDue?.toISOString() ?? null,
    appliedAt: row.appliedAt?.toISOString() ?? null,
    closingDate: row.closingDate?.toISOString() ?? null,
    contactName: row.contactName,
    contactEmail: row.contactEmail,
    notes: row.notes,
    jobDescriptionId: row.jobDescriptionId,
    jobMatchAnalysisId: row.jobMatchAnalysisId,
    applicationDraftId: row.applicationDraftId,
    interviewSessionId: row.interviewSessionId,
    preparationPlanId: row.preparationPlanId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function getOwned(userId: string, id: string) {
  const row = await prisma.jobApplication.findUnique({ where: { id } });
  if (!row || row.userId !== userId) return null;
  return row;
}

export async function listApplicationsAction(
  options: { includeArchived?: boolean } = {}
): Promise<
  { ok: true; applications: ApplicationListItem[] } | ActionErr
> {
  try {
    const user = await requireUser();
    const rows = await prisma.jobApplication.findMany({
      where: {
        userId: user.id,
        ...(options.includeArchived ? {} : { status: "active" }),
      },
      orderBy: [{ updatedAt: "desc" }],
    });
    return { ok: true, applications: rows.map(serialize) };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to list applications",
    };
  }
}

export async function getApplicationAction(
  id: string
): Promise<{ ok: true; application: ApplicationListItem } | ActionErr> {
  try {
    const user = await requireUser();
    const row = await getOwned(user.id, id);
    if (!row) return { ok: false, error: "Application not found." };
    return { ok: true, application: serialize(row) };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to load application",
    };
  }
}

export async function createApplicationAction(
  raw: unknown
): Promise<ActionOkId | ActionErr> {
  try {
    const user = await requireUser();
    const parsed = createApplicationSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Invalid application input",
      };
    }
    const data = parsed.data;
    const row = await prisma.jobApplication.create({
      data: {
        userId: user.id,
        company: data.company,
        role: data.role,
        stage: data.stage,
        sourceUrl: emptyToNull(data.sourceUrl),
        location: data.location ?? null,
        appliedAt: parseOptionalDate(data.appliedAt) ?? null,
        closingDate: parseOptionalDate(data.closingDate) ?? null,
        nextAction: data.nextAction ?? null,
        nextActionDue: parseOptionalDate(data.nextActionDue) ?? null,
        contactName: data.contactName ?? null,
        contactEmail: emptyToNull(data.contactEmail),
        notes: data.notes ?? null,
        jobDescriptionId: data.jobDescriptionId ?? null,
        jobMatchAnalysisId: data.jobMatchAnalysisId ?? null,
        applicationDraftId: data.applicationDraftId ?? null,
        interviewSessionId: data.interviewSessionId ?? null,
        preparationPlanId: data.preparationPlanId ?? null,
        status: "active",
      },
    });
    revalidatePath("/applications");
    revalidatePath("/dashboard");
    return { ok: true, id: row.id };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to create application",
    };
  }
}

export async function updateApplicationAction(
  raw: unknown
): Promise<ActionOkId | ActionErr> {
  try {
    const user = await requireUser();
    const parsed = updateApplicationSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Invalid update",
      };
    }
    const { id, ...rest } = parsed.data;
    const existing = await getOwned(user.id, id);
    if (!existing) return { ok: false, error: "Application not found." };

    const data: Record<string, unknown> = {};
    if (rest.company !== undefined) data.company = rest.company;
    if (rest.role !== undefined) data.role = rest.role;
    if (rest.stage !== undefined) {
      const t = assertStageTransition(existing.stage, rest.stage);
      if (!t.ok) return { ok: false, error: t.error };
      data.stage = rest.stage;
    }
    if (rest.sourceUrl !== undefined) data.sourceUrl = emptyToNull(rest.sourceUrl);
    if (rest.location !== undefined) data.location = rest.location ?? null;
    if (rest.appliedAt !== undefined)
      data.appliedAt = parseOptionalDate(rest.appliedAt) ?? null;
    if (rest.closingDate !== undefined)
      data.closingDate = parseOptionalDate(rest.closingDate) ?? null;
    if (rest.nextAction !== undefined) data.nextAction = rest.nextAction ?? null;
    if (rest.nextActionDue !== undefined)
      data.nextActionDue = parseOptionalDate(rest.nextActionDue) ?? null;
    if (rest.contactName !== undefined)
      data.contactName = rest.contactName ?? null;
    if (rest.contactEmail !== undefined)
      data.contactEmail = emptyToNull(rest.contactEmail);
    if (rest.notes !== undefined) data.notes = rest.notes ?? null;
    if (rest.jobDescriptionId !== undefined)
      data.jobDescriptionId = rest.jobDescriptionId;
    if (rest.jobMatchAnalysisId !== undefined)
      data.jobMatchAnalysisId = rest.jobMatchAnalysisId;
    if (rest.applicationDraftId !== undefined)
      data.applicationDraftId = rest.applicationDraftId;
    if (rest.interviewSessionId !== undefined)
      data.interviewSessionId = rest.interviewSessionId;
    if (rest.preparationPlanId !== undefined)
      data.preparationPlanId = rest.preparationPlanId;

    await prisma.jobApplication.update({ where: { id }, data });
    revalidatePath("/applications");
    revalidatePath("/dashboard");
    return { ok: true, id };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to update application",
    };
  }
}

export async function moveApplicationStageAction(
  id: string,
  stage: string
): Promise<ActionOkId | ActionErr> {
  const stageParsed = applicationStageSchema.safeParse(stage);
  if (!stageParsed.success) {
    return { ok: false, error: "Invalid stage." };
  }
  return updateApplicationAction({ id, stage: stageParsed.data });
}

export async function archiveApplicationAction(
  id: string
): Promise<ActionOkId | ActionErr> {
  try {
    const user = await requireUser();
    const existing = await getOwned(user.id, id);
    if (!existing) return { ok: false, error: "Application not found." };
    await prisma.jobApplication.update({
      where: { id },
      data: { status: "archived" },
    });
    revalidatePath("/applications");
    revalidatePath("/dashboard");
    return { ok: true, id };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to archive application",
    };
  }
}

export async function getWorkspaceActionsAction(): Promise<
  | {
      ok: true;
      overdue: ApplicationListItem[];
      upcoming: ApplicationListItem[];
    }
  | ActionErr
> {
  try {
    const user = await requireUser();
    const rows = await prisma.jobApplication.findMany({
      where: { userId: user.id, status: "active" },
    });
    const workspace: WorkspaceApplication[] = rows.map((r) => ({
      id: r.id,
      company: r.company,
      role: r.role,
      stage: r.stage,
      status: r.status,
      nextAction: r.nextAction,
      nextActionDue: r.nextActionDue,
      updatedAt: r.updatedAt,
    }));
    const actions = listWorkspaceActions(workspace);
    const byId = new Map(rows.map((r) => [r.id, r]));
    const overdue = actions
      .filter((a) => a.urgency === "overdue")
      .map((a) => serialize(byId.get(a.id)!));
    const upcoming = actions
      .filter((a) => a.urgency === "upcoming")
      .map((a) => serialize(byId.get(a.id)!));
    return { ok: true, overdue, upcoming };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to load workspace actions",
    };
  }
}
