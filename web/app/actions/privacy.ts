"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { upsertUserFromAuth } from "@/lib/auth/upsert-user";
import { recordConsent } from "@/lib/legal/consent";
import {
  buildUserDataExportPayload,
  type UserDataExportPayload,
} from "@/lib/legal/data-export";
import { prisma } from "@/lib/prisma";
import { parseConsentKind } from "@/lib/validation/privacy";

export type PrivacyActionResult =
  | { ok: true }
  | { ok: false; error: string };

export type DataExportActionResult =
  | { ok: true; requestId: string; payload: UserDataExportPayload }
  | { ok: false; error: string };

export type DataDeletionActionResult =
  | { ok: true; requestId: string }
  | { ok: false; error: string };

const RECENT_ANALYSIS_LIMIT = 25;

/**
 * Record upload or AI-processing consent for the current copy version.
 */
export async function acceptConsentAction(
  kind: string
): Promise<PrivacyActionResult> {
  const user = await requireUser();
  await upsertUserFromAuth(user);

  const parsed = parseConsentKind(kind);
  if (!parsed) {
    return { ok: false, error: "Invalid consent type." };
  }

  try {
    await recordConsent(user.id, parsed);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not save consent.";
    return { ok: false, error: message };
  }

  revalidatePath("/resume");
  revalidatePath("/resume/check");
  revalidatePath("/jobs/match");
  revalidatePath("/cover-letter");
  revalidatePath("/plan");

  return { ok: true };
}

/**
 * Log an export request and return immediate JSON of profile + document
 * metadata + recent analysis ids (no file bytes). Full file handling is
 * operator-driven — this does not auto-delete storage.
 */
export async function requestDataExportAction(): Promise<DataExportActionResult> {
  const user = await requireUser();
  await upsertUserFromAuth(user);

  try {
    const request = await prisma.dataRequest.create({
      data: {
        userId: user.id,
        type: "export",
        status: "pending",
      },
    });

    const [profile, documents, resumeReviews, jobMatchAnalyses, preparationPlans, applicationDrafts] =
      await Promise.all([
        prisma.profile.findUnique({
          where: { userId: user.id },
          select: {
            educationBackground: true,
            experienceLevel: true,
            targetRole: true,
            targetIndustry: true,
            preferredLocation: true,
            jobSearchStatus: true,
            careerSwitchIntent: true,
            skills: true,
            certifications: true,
            onboardingCompletedAt: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        prisma.resumeDocument.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            originalFilename: true,
            mimeType: true,
            byteSize: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        prisma.resumeReview.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          take: RECENT_ANALYSIS_LIMIT,
          select: { id: true },
        }),
        prisma.jobMatchAnalysis.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          take: RECENT_ANALYSIS_LIMIT,
          select: { id: true },
        }),
        prisma.preparationPlan.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          take: RECENT_ANALYSIS_LIMIT,
          select: { id: true },
        }),
        prisma.applicationDraft.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          take: RECENT_ANALYSIS_LIMIT,
          select: { id: true },
        }),
      ]);

    const payload = buildUserDataExportPayload({
      requestId: request.id,
      user: { id: user.id, email: user.email ?? "" },
      profile,
      documents,
      recentAnalysisIds: {
        resumeReviews: resumeReviews.map((row) => row.id),
        jobMatchAnalyses: jobMatchAnalyses.map((row) => row.id),
        preparationPlans: preparationPlans.map((row) => row.id),
        applicationDrafts: applicationDrafts.map((row) => row.id),
      },
    });

    revalidatePath("/settings");

    return { ok: true, requestId: request.id, payload };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not create export request.";
    return { ok: false, error: message };
  }
}

/**
 * Log a deletion request for operator handling. Does not auto-delete
 * database rows or storage objects.
 */
export async function requestDataDeletionAction(): Promise<DataDeletionActionResult> {
  const user = await requireUser();
  await upsertUserFromAuth(user);

  try {
    const request = await prisma.dataRequest.create({
      data: {
        userId: user.id,
        type: "deletion",
        status: "pending",
      },
    });

    revalidatePath("/settings");

    return { ok: true, requestId: request.id };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Could not create deletion request.";
    return { ok: false, error: message };
  }
}
