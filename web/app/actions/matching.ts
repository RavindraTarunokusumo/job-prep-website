"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { mapRequirementsToEvidence } from "@/lib/matching";
import { loadUserOntologySnapshot } from "@/lib/ontology/load-snapshot";
import { prisma } from "@/lib/prisma";
import {
  parseJobRequirements,
  type JobRequirements,
} from "@/lib/validation/job-match";
import {
  reviewMatchInputSchema,
  type RequirementMatchDraft,
} from "@/lib/validation/requirement-match";
import { requireFeatureEntitlement } from "@/lib/billing/require-entitlement";

type ActionOk<T> = { ok: true } & T;
type ActionErr = { ok: false; error: string };

async function getOwnedJob(userId: string, jobDescriptionId: string) {
  const job = await prisma.jobDescription.findUnique({
    where: { id: jobDescriptionId },
  });
  if (!job || job.userId !== userId) return null;
  return job;
}

/**
 * Generate and persist requirement→evidence matches for an owned JD (JOB-86).
 * Replaces prior suggested rows for the same job; keeps user-confirmed ones.
 */
export async function generateRequirementMatchesAction(form: {
  jobDescriptionId: string;
}): Promise<ActionOk<{ count: number; jobDescriptionId: string }> | ActionErr> {
  const user = await requireUser();
  const entitlement = await requireFeatureEntitlement(user.id, "job_match");
  if (!entitlement.ok) return { ok: false, error: entitlement.error };

  const job = await getOwnedJob(user.id, form.jobDescriptionId);
  if (!job) return { ok: false, error: "Job description not found or access denied." };

  let requirements: JobRequirements;
  try {
    if (!job.extracted) {
      return {
        ok: false,
        error: "Analyze this job description first so requirements are available.",
      };
    }
    requirements = parseJobRequirements(job.extracted);
  } catch {
    return { ok: false, error: "Stored job requirements are invalid. Re-run job match." };
  }

  const snapshot = await loadUserOntologySnapshot(user.id, { trustedOnly: false });
  const drafts = mapRequirementsToEvidence(
    job.id,
    user.id,
    requirements,
    snapshot,
  );

  await prisma.$transaction(async (tx) => {
    await tx.requirementEvidenceMatch.deleteMany({
      where: {
        userId: user.id,
        jobDescriptionId: job.id,
        userReview: "suggested",
      },
    });
    if (drafts.length > 0) {
      await tx.requirementEvidenceMatch.createMany({
        data: drafts.map((d: RequirementMatchDraft) => ({
          userId: d.userId,
          jobDescriptionId: d.jobDescriptionId,
          requirementKey: d.requirementKey,
          requirementText: d.requirementText,
          importance: d.importance,
          matchType: d.matchType,
          evidenceStrength: d.evidenceStrength,
          confidence: d.confidence,
          explanation: d.explanation,
          evidenceId: d.evidenceId ?? null,
          skillId: d.skillId ?? null,
          starStoryId: d.starStoryId ?? null,
          userReview: d.userReview,
          safeAction: d.safeAction ?? null,
          version: d.version,
        })),
      });
    }
  });

  revalidatePath("/jobs/match");
  revalidatePath("/readiness");
  revalidatePath("/interview");

  return { ok: true, count: drafts.length, jobDescriptionId: job.id };
}

/** User confirm / reject / replace a suggested mapping (ownership enforced). */
export async function reviewRequirementMatchAction(
  input: unknown,
): Promise<ActionOk<{ id: string }> | ActionErr> {
  const user = await requireUser();
  const parsed = reviewMatchInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid review payload." };
  }

  const existing = await prisma.requirementEvidenceMatch.findUnique({
    where: { id: parsed.data.id },
  });
  if (!existing || existing.userId !== user.id) {
    return { ok: false, error: "Match not found or access denied." };
  }

  await prisma.requirementEvidenceMatch.update({
    where: { id: existing.id },
    data: {
      userReview: parsed.data.userReview,
      evidenceId:
        parsed.data.evidenceId !== undefined
          ? parsed.data.evidenceId
          : existing.evidenceId,
      skillId:
        parsed.data.skillId !== undefined ? parsed.data.skillId : existing.skillId,
      starStoryId:
        parsed.data.starStoryId !== undefined
          ? parsed.data.starStoryId
          : existing.starStoryId,
      explanation: parsed.data.explanation ?? existing.explanation,
    },
  });

  revalidatePath("/jobs/match");
  revalidatePath("/readiness");
  return { ok: true, id: existing.id };
}

export async function listRequirementMatchesAction(form: {
  jobDescriptionId: string;
}): Promise<
  | ActionOk<{
      matches: {
        id: string;
        requirementKey: string;
        requirementText: string;
        importance: string;
        matchType: string;
        evidenceStrength: number;
        explanation: string;
        userReview: string;
        safeAction: string | null;
      }[];
    }>
  | ActionErr
> {
  const user = await requireUser();
  const job = await getOwnedJob(user.id, form.jobDescriptionId);
  if (!job) return { ok: false, error: "Job description not found or access denied." };

  const matches = await prisma.requirementEvidenceMatch.findMany({
    where: { userId: user.id, jobDescriptionId: job.id },
    orderBy: [{ importance: "asc" }, { evidenceStrength: "desc" }],
  });

  return {
    ok: true,
    matches: matches.map((m) => ({
      id: m.id,
      requirementKey: m.requirementKey,
      requirementText: m.requirementText,
      importance: m.importance,
      matchType: m.matchType,
      evidenceStrength: m.evidenceStrength,
      explanation: m.explanation,
      userReview: m.userReview,
      safeAction: m.safeAction,
    })),
  };
}
