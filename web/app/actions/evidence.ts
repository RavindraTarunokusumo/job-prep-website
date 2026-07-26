"use server";

import { revalidatePath } from "next/cache";
import {
  assertStarFromConfirmedEvidence,
  canConfirmEvidence,
  listConfirmedEvidence,
  listReadyStars,
  transitionVerification,
} from "@/lib/evidence/verification";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import {
  createEvidenceSchema,
  createStarStorySchema,
  updateEvidenceSchema,
  updateStarStorySchema,
} from "@/lib/validation/evidence";

type ActionErr = { ok: false; error: string };
type ActionOkId = { ok: true; id: string };

export type EvidenceItem = {
  id: string;
  title: string;
  sourceType: string;
  organization: string | null;
  roleTitle: string | null;
  startDate: string | null;
  endDate: string | null;
  responsibilities: string | null;
  achievements: string | null;
  metrics: string | null;
  verification: string;
  sourceNote: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StarStoryItem = {
  id: string;
  title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  readiness: string;
  evidenceId: string | null;
  createdAt: string;
  updatedAt: string;
};

function serializeEvidence(row: {
  id: string;
  title: string;
  sourceType: string;
  organization: string | null;
  roleTitle: string | null;
  startDate: string | null;
  endDate: string | null;
  responsibilities: string | null;
  achievements: string | null;
  metrics: string | null;
  verification: string;
  sourceNote: string | null;
  createdAt: Date;
  updatedAt: Date;
}): EvidenceItem {
  return {
    id: row.id,
    title: row.title,
    sourceType: row.sourceType,
    organization: row.organization,
    roleTitle: row.roleTitle,
    startDate: row.startDate,
    endDate: row.endDate,
    responsibilities: row.responsibilities,
    achievements: row.achievements,
    metrics: row.metrics,
    verification: row.verification,
    sourceNote: row.sourceNote,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function serializeStar(row: {
  id: string;
  title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  readiness: string;
  evidenceId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): StarStoryItem {
  return {
    id: row.id,
    title: row.title,
    situation: row.situation,
    task: row.task,
    action: row.action,
    result: row.result,
    readiness: row.readiness,
    evidenceId: row.evidenceId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function ownedEvidence(userId: string, id: string) {
  const row = await prisma.careerEvidence.findUnique({ where: { id } });
  if (!row || row.userId !== userId) return null;
  return row;
}

async function ownedStar(userId: string, id: string) {
  const row = await prisma.starStory.findUnique({ where: { id } });
  if (!row || row.userId !== userId) return null;
  return row;
}

export async function listEvidenceAction(): Promise<
  { ok: true; evidence: EvidenceItem[] } | ActionErr
> {
  try {
    const user = await requireUser();
    const rows = await prisma.careerEvidence.findMany({
      where: { userId: user.id, verification: { not: "archived" } },
      orderBy: { updatedAt: "desc" },
    });
    return { ok: true, evidence: rows.map(serializeEvidence) };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to list evidence",
    };
  }
}

export async function createEvidenceAction(
  raw: unknown
): Promise<ActionOkId | ActionErr> {
  try {
    const user = await requireUser();
    const parsed = createEvidenceSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Invalid evidence",
      };
    }
    const d = parsed.data;
    // Never auto-mark as confirmed on create unless explicitly requested
    const verification =
      d.verification === "confirmed" ? "confirmed" : d.verification;
    const row = await prisma.careerEvidence.create({
      data: {
        userId: user.id,
        title: d.title,
        sourceType: d.sourceType,
        organization: d.organization ?? null,
        roleTitle: d.roleTitle ?? null,
        startDate: d.startDate ?? null,
        endDate: d.endDate ?? null,
        responsibilities: d.responsibilities ?? null,
        achievements: d.achievements ?? null,
        metrics: d.metrics ?? null,
        verification,
        sourceNote: d.sourceNote ?? null,
      },
    });
    revalidatePath("/evidence");
    return { ok: true, id: row.id };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to create evidence",
    };
  }
}

export async function updateEvidenceAction(
  raw: unknown
): Promise<ActionOkId | ActionErr> {
  try {
    const user = await requireUser();
    const parsed = updateEvidenceSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Invalid update",
      };
    }
    const { id, ...rest } = parsed.data;
    const existing = await ownedEvidence(user.id, id);
    if (!existing) return { ok: false, error: "Evidence not found." };

    if (rest.verification !== undefined) {
      const t = transitionVerification(existing.verification, rest.verification);
      if (!t.ok) return { ok: false, error: t.error };
    }

    await prisma.careerEvidence.update({
      where: { id },
      data: {
        ...(rest.title !== undefined ? { title: rest.title } : {}),
        ...(rest.sourceType !== undefined ? { sourceType: rest.sourceType } : {}),
        ...(rest.organization !== undefined
          ? { organization: rest.organization ?? null }
          : {}),
        ...(rest.roleTitle !== undefined
          ? { roleTitle: rest.roleTitle ?? null }
          : {}),
        ...(rest.startDate !== undefined
          ? { startDate: rest.startDate ?? null }
          : {}),
        ...(rest.endDate !== undefined ? { endDate: rest.endDate ?? null } : {}),
        ...(rest.responsibilities !== undefined
          ? { responsibilities: rest.responsibilities ?? null }
          : {}),
        ...(rest.achievements !== undefined
          ? { achievements: rest.achievements ?? null }
          : {}),
        ...(rest.metrics !== undefined ? { metrics: rest.metrics ?? null } : {}),
        ...(rest.verification !== undefined
          ? { verification: rest.verification }
          : {}),
        ...(rest.sourceNote !== undefined
          ? { sourceNote: rest.sourceNote ?? null }
          : {}),
      },
    });
    revalidatePath("/evidence");
    return { ok: true, id };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to update evidence",
    };
  }
}

export async function confirmEvidenceAction(
  id: string
): Promise<ActionOkId | ActionErr> {
  try {
    const user = await requireUser();
    const existing = await ownedEvidence(user.id, id);
    if (!existing) return { ok: false, error: "Evidence not found." };
    if (!canConfirmEvidence(existing.verification)) {
      if (existing.verification === "confirmed") {
        return { ok: true, id };
      }
      return {
        ok: false,
        error: `Cannot confirm evidence in state ${existing.verification}`,
      };
    }
    const t = transitionVerification(existing.verification, "confirmed");
    if (!t.ok) return { ok: false, error: t.error };
    await prisma.careerEvidence.update({
      where: { id },
      data: { verification: "confirmed" },
    });
    revalidatePath("/evidence");
    return { ok: true, id };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to confirm evidence",
    };
  }
}

export async function archiveEvidenceAction(
  id: string
): Promise<ActionOkId | ActionErr> {
  return updateEvidenceAction({ id, verification: "archived" });
}

export async function listStarStoriesAction(): Promise<
  { ok: true; stories: StarStoryItem[] } | ActionErr
> {
  try {
    const user = await requireUser();
    const rows = await prisma.starStory.findMany({
      where: { userId: user.id, readiness: { not: "archived" } },
      orderBy: { updatedAt: "desc" },
    });
    return { ok: true, stories: rows.map(serializeStar) };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to list STAR stories",
    };
  }
}

export async function createStarStoryAction(
  raw: unknown
): Promise<ActionOkId | ActionErr> {
  try {
    const user = await requireUser();
    const parsed = createStarStorySchema.safeParse(raw);
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Invalid STAR story",
      };
    }
    const d = parsed.data;
    const evidenceId = d.evidenceId ?? null;

    if (evidenceId) {
      const evidence = await ownedEvidence(user.id, evidenceId);
      if (!evidence) return { ok: false, error: "Linked evidence not found." };
      if (d.requireConfirmedEvidence || evidence.verification !== "confirmed") {
        // Strict path when requireConfirmedEvidence; also refuse inventing from non-confirmed when linking for seed
        if (d.requireConfirmedEvidence) {
          const gate = assertStarFromConfirmedEvidence(evidence);
          if (!gate.ok) return { ok: false, error: gate.error };
        }
      }
    }

    // Optional seed-from-evidence when only evidenceId provided with empty STAR fields is handled by caller;
    // here we persist user-supplied STAR text only — never invent metrics.
    const row = await prisma.starStory.create({
      data: {
        userId: user.id,
        evidenceId,
        title: d.title,
        situation: d.situation,
        task: d.task,
        action: d.action,
        result: d.result,
        readiness: d.readiness,
      },
    });
    revalidatePath("/evidence");
    return { ok: true, id: row.id };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to create STAR story",
    };
  }
}

export async function createStarFromEvidenceAction(
  evidenceId: string
): Promise<ActionOkId | ActionErr> {
  try {
    const user = await requireUser();
    const evidence = await ownedEvidence(user.id, evidenceId);
    if (!evidence) return { ok: false, error: "Evidence not found." };
    const gate = assertStarFromConfirmedEvidence(evidence);
    if (!gate.ok) return { ok: false, error: gate.error };
    const row = await prisma.starStory.create({
      data: {
        userId: user.id,
        evidenceId: evidence.id,
        title: gate.seed.title,
        situation: gate.seed.situation,
        task: gate.seed.task || "Describe the task you owned.",
        action: gate.seed.action || "Describe the actions you took.",
        result: gate.seed.result || "Describe the outcome using only known facts.",
        readiness: "draft",
      },
    });
    revalidatePath("/evidence");
    return { ok: true, id: row.id };
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error ? e.message : "Failed to seed STAR from evidence",
    };
  }
}

export async function updateStarStoryAction(
  raw: unknown
): Promise<ActionOkId | ActionErr> {
  try {
    const user = await requireUser();
    const parsed = updateStarStorySchema.safeParse(raw);
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Invalid STAR update",
      };
    }
    const { id, ...rest } = parsed.data;
    const existing = await ownedStar(user.id, id);
    if (!existing) return { ok: false, error: "STAR story not found." };

    if (rest.evidenceId) {
      const evidence = await ownedEvidence(user.id, rest.evidenceId);
      if (!evidence) return { ok: false, error: "Linked evidence not found." };
      if (rest.requireConfirmedEvidence) {
        const gate = assertStarFromConfirmedEvidence(evidence);
        if (!gate.ok) return { ok: false, error: gate.error };
      }
    }

    await prisma.starStory.update({
      where: { id },
      data: {
        ...(rest.title !== undefined ? { title: rest.title } : {}),
        ...(rest.situation !== undefined ? { situation: rest.situation } : {}),
        ...(rest.task !== undefined ? { task: rest.task } : {}),
        ...(rest.action !== undefined ? { action: rest.action } : {}),
        ...(rest.result !== undefined ? { result: rest.result } : {}),
        ...(rest.readiness !== undefined ? { readiness: rest.readiness } : {}),
        ...(rest.evidenceId !== undefined
          ? { evidenceId: rest.evidenceId }
          : {}),
      },
    });
    revalidatePath("/evidence");
    return { ok: true, id };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to update STAR story",
    };
  }
}

/** Query helpers for other prep workflows (confirmed / ready only). */
export async function listConfirmedEvidenceForPrepAction(): Promise<
  { ok: true; evidence: EvidenceItem[] } | ActionErr
> {
  try {
    const user = await requireUser();
    const rows = await prisma.careerEvidence.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    });
    return {
      ok: true,
      evidence: listConfirmedEvidence(rows.map(serializeEvidence)),
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to load confirmed evidence",
    };
  }
}

export async function listReadyStarStoriesAction(): Promise<
  { ok: true; stories: StarStoryItem[] } | ActionErr
> {
  try {
    const user = await requireUser();
    const rows = await prisma.starStory.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    });
    return { ok: true, stories: listReadyStars(rows.map(serializeStar)) };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to load ready STAR stories",
    };
  }
}
