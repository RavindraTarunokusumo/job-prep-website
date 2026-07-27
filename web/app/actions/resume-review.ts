"use server";

import { revalidatePath } from "next/cache";
import { userFacingAiError } from "@/lib/ai/errors";
import {
  generateResumeReview,
  getReviewModelId,
  rewriteResumeBullet,
} from "@/lib/ai/resume-review";
import { getProfileForUser, requireUser } from "@/lib/auth/session";
import { requireFeatureEntitlement } from "@/lib/billing/require-entitlement";
import { requireAiConsent } from "@/lib/legal/consent";
import { prisma } from "@/lib/prisma";
import { assertResumeHasContent } from "@/lib/resume/content";
import { parseResumeReviewResult } from "@/lib/validation/resume-review";

async function getOwnedDocument(userId: string, documentId: string) {
  const doc = await prisma.resumeDocument.findUnique({
    where: { id: documentId },
  });

  if (!doc || doc.userId !== userId) {
    return null;
  }

  return doc;
}

export async function runResumeReviewAction(
  documentId: string
): Promise<{ ok: true; reviewId: string } | { ok: false; error: string }> {
  const user = await requireUser();
  const entitlement = await requireFeatureEntitlement(user.id, "resume_review");
  if (!entitlement.ok) return { ok: false, error: entitlement.error };
  const consent = await requireAiConsent(user.id);
  if (!consent.ok) return consent;

  const doc = await getOwnedDocument(user.id, documentId);
  if (!doc) {
    return { ok: false, error: "Resume not found or access denied." };
  }

  if (doc.status !== "parsed") {
    return {
      ok: false,
      error: "Finish parsing this resume before running a review.",
    };
  }

  const profile = await getProfileForUser(user.id);
  if (!profile) {
    return {
      ok: false,
      error: "Complete onboarding first so we know your target role.",
    };
  }

  let resumeText: string;
  try {
    resumeText = assertResumeHasContent(doc.rawText, doc.parsedData);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Resume content is insufficient.";
    return { ok: false, error: message };
  }

  const review = await prisma.resumeReview.create({
    data: {
      userId: user.id,
      resumeDocumentId: documentId,
      status: "pending",
    },
  });

  try {
    const result = await generateResumeReview({
      targetRole: profile.targetRole,
      experienceLevel: profile.experienceLevel,
      resumeText,
      parsedJson: doc.parsedData ?? undefined,
      userId: user.id,
    });

    const validated = parseResumeReviewResult(result);

    await prisma.resumeReview.update({
      where: { id: review.id },
      data: {
        status: "completed",
        result: validated,
        overallScore: validated.overallScore,
        model: getReviewModelId(),
        errorMessage: null,
      },
    });

    revalidatePath("/resume/check");
    revalidatePath("/resume");
    revalidatePath("/dashboard");

    return { ok: true, reviewId: review.id };
  } catch (error) {
    const message = userFacingAiError(
      error,
      "Review generation failed. Please try again."
    );

    await prisma.resumeReview.update({
      where: { id: review.id },
      data: {
        status: "failed",
        errorMessage: message,
      },
    });

    revalidatePath("/resume/check");

    return { ok: false, error: message };
  }
}

export async function rewriteResumeBulletAction(input: {
  original: string;
  surroundingContext?: string;
}): Promise<
  { ok: true; suggestions: string[] } | { ok: false; error: string }
> {
  const user = await requireUser();
  const consent = await requireAiConsent(user.id);
  if (!consent.ok) return consent;

  const original = input.original?.trim();
  if (!original) {
    return { ok: false, error: "Original bullet text is required." };
  }

  try {
    const suggestions = await rewriteResumeBullet({
      original,
      surroundingContext: input.surroundingContext,
    });

    return { ok: true, suggestions };
  } catch (error) {
    return {
      ok: false,
      error: userFacingAiError(
        error,
        "Bullet rewrite failed. Please try again."
      ),
    };
  }
}
