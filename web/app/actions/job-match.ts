"use server";

import { revalidatePath } from "next/cache";
import { userFacingAiError } from "@/lib/ai/errors";
import {
  extractJobRequirements,
  getJobMatchModelId,
  scoreJobMatch,
} from "@/lib/ai/job-match";
import { getProfileForUser, requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { assertResumeHasContent } from "@/lib/resume/content";
import {
  assertJobDescriptionHasContent,
  parseJobMatchResult,
  parseJobRequirements,
} from "@/lib/validation/job-match";

async function getOwnedDocument(userId: string, documentId: string) {
  const doc = await prisma.resumeDocument.findUnique({
    where: { id: documentId },
  });

  if (!doc || doc.userId !== userId) {
    return null;
  }

  return doc;
}

async function getLatestParsedDocument(userId: string) {
  return prisma.resumeDocument.findFirst({
    where: {
      userId,
      status: "parsed",
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function analyzeJobDescriptionAction(form: {
  rawText: string;
  title?: string;
  company?: string;
  resumeDocumentId?: string;
}): Promise<
  { ok: true; matchId: string; jobId: string } | { ok: false; error: string }
> {
  const user = await requireUser();

  const profile = await getProfileForUser(user.id);
  if (!profile?.onboardingCompletedAt) {
    return {
      ok: false,
      error: "Complete onboarding first so we know your target role.",
    };
  }

  let rawText: string;
  try {
    rawText = assertJobDescriptionHasContent(form.rawText);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Job description is invalid.";
    return { ok: false, error: message };
  }

  const resumeDoc = form.resumeDocumentId
    ? await getOwnedDocument(user.id, form.resumeDocumentId)
    : await getLatestParsedDocument(user.id);

  if (!resumeDoc || resumeDoc.status !== "parsed") {
    return {
      ok: false,
      error:
        "Upload and parse a resume first on the resume page before matching.",
    };
  }

  let resumeText: string;
  try {
    resumeText = assertResumeHasContent(resumeDoc.rawText, resumeDoc.parsedData);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Resume content is insufficient.";
    return { ok: false, error: message };
  }

  const job = await prisma.jobDescription.create({
    data: {
      userId: user.id,
      title: form.title?.trim() || null,
      company: form.company?.trim() || null,
      rawText,
      status: "draft",
    },
  });

  const match = await prisma.jobMatchAnalysis.create({
    data: {
      userId: user.id,
      jobDescriptionId: job.id,
      resumeDocumentId: resumeDoc.id,
      status: "pending",
    },
  });

  try {
    const requirements = await extractJobRequirements(rawText);
    const validatedRequirements = parseJobRequirements(requirements);

    await prisma.jobDescription.update({
      where: { id: job.id },
      data: {
        extracted: validatedRequirements,
        status: "analyzed",
        errorMessage: null,
      },
    });

    const matchResult = await scoreJobMatch({
      requirements: validatedRequirements,
      resumeText,
      targetRole: profile.targetRole,
      experienceLevel: profile.experienceLevel,
      skills: profile.skills,
      certifications: profile.certifications,
    });

    const validatedMatch = parseJobMatchResult(matchResult);
    const modelId = getJobMatchModelId();

    await prisma.jobMatchAnalysis.update({
      where: { id: match.id },
      data: {
        status: "completed",
        result: validatedMatch,
        matchScore: validatedMatch.matchScore,
        model: modelId,
        errorMessage: null,
      },
    });

    revalidatePath("/jobs/match");
    revalidatePath("/dashboard");
    revalidatePath("/plan");

    return { ok: true, matchId: match.id, jobId: job.id };
  } catch (error) {
    const message = userFacingAiError(
      error,
      "Job match analysis failed. Please try again."
    );

    await prisma.jobDescription.update({
      where: { id: job.id },
      data: {
        status: "failed",
        errorMessage: message,
      },
    });

    await prisma.jobMatchAnalysis.update({
      where: { id: match.id },
      data: {
        status: "failed",
        errorMessage: message,
      },
    });

    revalidatePath("/jobs/match");

    return { ok: false, error: message };
  }
}