"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { computeApplicationReadiness } from "@/lib/readiness/score";

type ActionOk<T> = { ok: true } & T;
type ActionErr = { ok: false; error: string };

/**
 * Compute and persist application readiness for an owned job (JOB-87).
 */
export async function generateReadinessScoreAction(form: {
  jobDescriptionId?: string | null;
}): Promise<
  ActionOk<{ scoreId: string; overallScore: number | null; confidenceBand: string }> | ActionErr
> {
  const user = await requireUser();
  const jobDescriptionId = form.jobDescriptionId?.trim() || null;

  if (jobDescriptionId) {
    const job = await prisma.jobDescription.findUnique({
      where: { id: jobDescriptionId },
    });
    if (!job || job.userId !== user.id) {
      return { ok: false, error: "Job description not found or access denied." };
    }
  }

  const matches = jobDescriptionId
    ? await prisma.requirementEvidenceMatch.findMany({
        where: { userId: user.id, jobDescriptionId },
      })
    : [];

  const [latestReview, latestInterview, activePlan] = await Promise.all([
    prisma.resumeReview.findFirst({
      where: { userId: user.id, status: "completed" },
      orderBy: { createdAt: "desc" },
      select: { overallScore: true, createdAt: true },
    }),
    prisma.interviewSession.findFirst({
      where: { userId: user.id, status: "completed" },
      orderBy: { updatedAt: "desc" },
      select: { id: true, updatedAt: true },
    }),
    prisma.preparationPlan.findFirst({
      where: { userId: user.id, status: "active" },
      include: { items: true },
    }),
  ]);

  let prepCompletion: number | null = null;
  if (activePlan && activePlan.items.length > 0) {
    const done = activePlan.items.filter((i) => i.status === "done").length;
    prepCompletion = done / activePlan.items.length;
  }

  const record = computeApplicationReadiness({
    userId: user.id,
    jobDescriptionId,
    matches: matches.map((m) => ({
      matchType: m.matchType as "strong" | "partial" | "keyword_only" | "transferable" | "gap",
      importance: m.importance as "required" | "preferred" | "other",
      evidenceStrength: m.evidenceStrength,
      requirementKey: m.requirementKey,
    })),
    cvScore: latestReview?.overallScore ?? null,
    prepCompletion,
    interviewScore: latestInterview ? 60 : null,
    sourceTimestamps: {
      resumeReview: latestReview?.createdAt.toISOString() ?? "",
      interview: latestInterview?.updatedAt.toISOString() ?? "",
    },
  });

  const prior = await prisma.applicationReadinessScore.findFirst({
    where: {
      userId: user.id,
      jobDescriptionId: jobDescriptionId,
    },
    orderBy: { version: "desc" },
  });

  const saved = await prisma.applicationReadinessScore.create({
    data: {
      userId: user.id,
      jobDescriptionId,
      confidenceBand: record.confidenceBand,
      dimensions: record.dimensions,
      overallScore: record.overallScore,
      explanations: record.explanations ?? undefined,
      sourceTimestamps: record.sourceTimestamps ?? undefined,
      version: (prior?.version ?? 0) + 1,
    },
  });

  revalidatePath("/readiness");
  revalidatePath("/dashboard");

  return {
    ok: true,
    scoreId: saved.id,
    overallScore: saved.overallScore,
    confidenceBand: saved.confidenceBand,
  };
}
