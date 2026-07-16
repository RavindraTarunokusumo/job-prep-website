"use server";

import { revalidatePath } from "next/cache";
import { generatePrepPlan, getPrepPlanModelId } from "@/lib/ai/prep-plan";
import { getProfileForUser, requireUser } from "@/lib/auth/session";
import { isPlanStale } from "@/lib/plan/staleness";
import { prisma } from "@/lib/prisma";
import { assertResumeHasContent } from "@/lib/resume/content";
import { parseJobMatchResult } from "@/lib/validation/job-match";
import {
  parsePrepPlanGeneration,
  type PrepPlanItemStatus,
} from "@/lib/validation/prep-plan";
import { parseResumeReviewResult } from "@/lib/validation/resume-review";

export { isPlanStale };

async function getLatestParsedDocument(userId: string) {
  return prisma.resumeDocument.findFirst({
    where: { userId, status: "parsed" },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getPlanStalenessSources(userId: string) {
  const [profile, latestReview, latestMatch] = await Promise.all([
    prisma.profile.findUnique({
      where: { userId },
      select: { updatedAt: true },
    }),
    prisma.resumeReview.findFirst({
      where: { userId, status: "completed" },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    }),
    prisma.jobMatchAnalysis.findFirst({
      where: { userId, status: "completed" },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    }),
  ]);

  return {
    profileUpdatedAt: profile?.updatedAt ?? null,
    latestReviewId: latestReview?.id ?? null,
    latestMatchId: latestMatch?.id ?? null,
  };
}

export async function generatePrepPlanAction(opts?: {
  jobMatchId?: string;
}): Promise<{ ok: true; planId: string } | { ok: false; error: string }> {
  const user = await requireUser();

  const profile = await getProfileForUser(user.id);
  if (!profile?.onboardingCompletedAt) {
    return {
      ok: false,
      error: "Complete onboarding before generating a prep plan.",
    };
  }

  const resumeDoc = await getLatestParsedDocument(user.id);
  if (!resumeDoc) {
    return {
      ok: false,
      error: "Upload and parse a resume first on the resume page.",
    };
  }

  try {
    assertResumeHasContent(resumeDoc.rawText, resumeDoc.parsedData);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Resume content is insufficient.";
    return { ok: false, error: message };
  }

  const [latestReviewRow, matchRow, stalenessSources] = await Promise.all([
    prisma.resumeReview.findFirst({
      where: {
        userId: user.id,
        resumeDocumentId: resumeDoc.id,
        status: "completed",
      },
      orderBy: { createdAt: "desc" },
    }),
    opts?.jobMatchId
      ? prisma.jobMatchAnalysis.findFirst({
          where: {
            id: opts.jobMatchId,
            userId: user.id,
            status: "completed",
          },
        })
      : prisma.jobMatchAnalysis.findFirst({
          where: { userId: user.id, status: "completed" },
          orderBy: { createdAt: "desc" },
        }),
    getPlanStalenessSources(user.id),
  ]);

  let reviewResult = null;
  if (latestReviewRow?.result) {
    try {
      reviewResult = parseResumeReviewResult(latestReviewRow.result);
    } catch {
      reviewResult = null;
    }
  }

  let matchResult = null;
  if (matchRow?.result) {
    try {
      matchResult = parseJobMatchResult(matchRow.result);
    } catch {
      matchResult = null;
    }
  }

  const resumeSummary = reviewResult?.summary ?? null;

  try {
    const generated = await generatePrepPlan({
      profile: {
        targetRole: profile.targetRole,
        experienceLevel: profile.experienceLevel,
        targetIndustry: profile.targetIndustry,
        skills: profile.skills,
        certifications: profile.certifications,
        jobSearchStatus: profile.jobSearchStatus,
      },
      review: reviewResult,
      match: matchResult,
      resumeSummary,
      hasJobMatch: matchRow != null,
    });

    const validated = parsePrepPlanGeneration(generated);
    const modelId = getPrepPlanModelId();

    const plan = await prisma.$transaction(async (tx) => {
      await tx.preparationPlan.updateMany({
        where: { userId: user.id, status: "active" },
        data: { status: "archived" },
      });

      return tx.preparationPlan.create({
        data: {
          userId: user.id,
          status: "active",
          summary: validated.summary,
          model: modelId,
          sourceProfileUpdatedAt: stalenessSources.profileUpdatedAt,
          sourceResumeReviewId: latestReviewRow?.id ?? null,
          sourceJobMatchId: matchRow?.id ?? null,
          items: {
            create: validated.items.map((item) => ({
              category: item.category,
              title: item.title,
              description: item.description ?? null,
              reason: item.reason,
              priority: item.priority,
              status: "todo",
              href: item.href ?? null,
            })),
          },
        },
      });
    });

    revalidatePath("/plan");
    revalidatePath("/dashboard");

    return { ok: true, planId: plan.id };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Plan generation failed. Please try again.";
    return { ok: false, error: message };
  }
}

export async function updatePlanItemStatusAction(
  itemId: string,
  status: PrepPlanItemStatus
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireUser();

  const item = await prisma.preparationPlanItem.findUnique({
    where: { id: itemId },
    include: {
      plan: {
        select: { userId: true, status: true },
      },
    },
  });

  if (!item || item.plan.userId !== user.id) {
    return { ok: false, error: "Plan item not found or access denied." };
  }

  if (item.plan.status !== "active") {
    return { ok: false, error: "Cannot update items on an archived plan." };
  }

  await prisma.preparationPlanItem.update({
    where: { id: itemId },
    data: { status },
  });

  revalidatePath("/plan");
  revalidatePath("/dashboard");

  return { ok: true };
}