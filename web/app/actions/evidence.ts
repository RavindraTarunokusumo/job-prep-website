"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { normalizeSkillName } from "@/lib/ontology/normalize";
import { prisma } from "@/lib/prisma";
import {
  createCareerEvidenceSchema,
  createSkillSchema,
  createStarStorySchema,
} from "@/lib/validation/ontology";

type ActionOk<T> = { ok: true } & T;
type ActionErr = { ok: false; error: string };

export async function createSkillAction(
  input: unknown,
): Promise<ActionOk<{ id: string }> | ActionErr> {
  const user = await requireUser();
  const parsed = createSkillSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid skill payload." };

  const normalizedName = normalizeSkillName(parsed.data.name);
  const existing = await prisma.skill.findFirst({
    where: {
      userId: user.id,
      normalizedName,
      verification: { not: "archived" },
    },
  });
  if (existing) {
    return { ok: false, error: "An active skill with this name already exists." };
  }

  const skill = await prisma.skill.create({
    data: {
      userId: user.id,
      name: parsed.data.name.trim(),
      normalizedName,
      category: parsed.data.category ?? null,
      verification: parsed.data.verification ?? "unconfirmed",
      confidence:
        parsed.data.verification === "confirmed"
          ? 1
          : (parsed.data.confidence ?? 0.5),
      sourceType: parsed.data.sourceType ?? "user",
      sourceId: parsed.data.sourceId ?? null,
    },
  });

  revalidatePath("/evidence");
  return { ok: true, id: skill.id };
}

export async function createCareerEvidenceAction(
  input: unknown,
): Promise<ActionOk<{ id: string }> | ActionErr> {
  const user = await requireUser();
  const parsed = createCareerEvidenceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid evidence payload." };

  const row = await prisma.careerEvidence.create({
    data: {
      userId: user.id,
      title: parsed.data.title,
      sourceType: parsed.data.sourceType,
      organization: parsed.data.organization ?? null,
      roleTitle: parsed.data.roleTitle ?? null,
      startDate: parsed.data.startDate ?? null,
      endDate: parsed.data.endDate ?? null,
      responsibilities: parsed.data.responsibilities ?? null,
      achievements: parsed.data.achievements ?? null,
      metrics: parsed.data.metrics ?? null,
      verification: parsed.data.verification ?? "unconfirmed",
      confidence:
        parsed.data.verification === "confirmed"
          ? 1
          : (parsed.data.confidence ?? 0.5),
      sourceNote: parsed.data.sourceNote ?? null,
    },
  });

  revalidatePath("/evidence");
  revalidatePath("/readiness");
  return { ok: true, id: row.id };
}

export async function confirmCareerEvidenceAction(form: {
  id: string;
}): Promise<ActionOk<{ id: string }> | ActionErr> {
  const user = await requireUser();
  const existing = await prisma.careerEvidence.findUnique({
    where: { id: form.id },
  });
  if (!existing || existing.userId !== user.id) {
    return { ok: false, error: "Evidence not found or access denied." };
  }

  await prisma.careerEvidence.update({
    where: { id: existing.id },
    data: { verification: "confirmed", confidence: 1 },
  });

  revalidatePath("/evidence");
  return { ok: true, id: existing.id };
}

export async function createStarStoryAction(
  input: unknown,
): Promise<ActionOk<{ id: string }> | ActionErr> {
  const user = await requireUser();
  const parsed = createStarStorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid STAR story payload." };

  if (parsed.data.evidenceId) {
    const evidence = await prisma.careerEvidence.findUnique({
      where: { id: parsed.data.evidenceId },
    });
    if (!evidence || evidence.userId !== user.id) {
      return { ok: false, error: "Linked evidence not found or access denied." };
    }
  }

  const row = await prisma.starStory.create({
    data: {
      userId: user.id,
      evidenceId: parsed.data.evidenceId ?? null,
      title: parsed.data.title,
      situation: parsed.data.situation,
      task: parsed.data.task,
      action: parsed.data.action,
      result: parsed.data.result,
      readiness: parsed.data.readiness ?? "draft",
      verification: parsed.data.verification ?? "unconfirmed",
      confidence: parsed.data.confidence ?? 0.5,
    },
  });

  revalidatePath("/evidence");
  return { ok: true, id: row.id };
}
