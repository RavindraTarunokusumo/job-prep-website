"use server";

import { revalidatePath } from "next/cache";
import {
  generateInterviewQuestions,
  getInterviewQuestionsModelId,
} from "@/lib/ai/interview-questions";
import { userFacingAiError } from "@/lib/ai/errors";
import { getProfileForUser, requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getResumeTextContent } from "@/lib/resume/content";

const EXCERPT_MAX_CHARS = 8_000;

type ActionOk = { ok: true; sessionId: string };
type ActionErr = { ok: false; error: string };
type StartResult = ActionOk | ActionErr;

function toExcerpt(text: string, max = EXCERPT_MAX_CHARS): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) {
    return trimmed;
  }
  return trimmed.slice(0, max);
}

async function getOwnedResumeDocument(userId: string, documentId: string) {
  const doc = await prisma.resumeDocument.findUnique({
    where: { id: documentId },
  });

  if (!doc || doc.userId !== userId) {
    return null;
  }

  return doc;
}

async function getOwnedJobDescription(userId: string, jobId: string) {
  const job = await prisma.jobDescription.findUnique({
    where: { id: jobId },
  });

  if (!job || job.userId !== userId) {
    return null;
  }

  return job;
}

/**
 * Start a mock interview: generate role-based questions, then persist
 * InterviewSession + primary InterviewTurns. Does not create a session if AI fails.
 */
export async function startInterviewSessionAction(form: {
  resumeDocumentId?: string;
  jobDescriptionId?: string;
  preparationPlanItemId?: string;
}): Promise<StartResult> {
  const user = await requireUser();

  const profile = await getProfileForUser(user.id);
  if (!profile?.onboardingCompletedAt) {
    return {
      ok: false,
      error: "Complete onboarding first so we know your target role.",
    };
  }

  const targetRole = profile.targetRole?.trim();
  if (!targetRole) {
    return {
      ok: false,
      error: "Complete onboarding first so we know your target role.",
    };
  }

  let resumeDocumentId: string | null = null;
  let resumeExcerpt: string | null = null;

  if (form.resumeDocumentId) {
    const doc = await getOwnedResumeDocument(user.id, form.resumeDocumentId);
    if (!doc) {
      return { ok: false, error: "Resume not found or access denied." };
    }
    if (doc.status !== "parsed") {
      return {
        ok: false,
        error: "Finish parsing this resume before starting an interview.",
      };
    }
    const content = getResumeTextContent(doc.rawText, doc.parsedData);
    if (!content) {
      return {
        ok: false,
        error:
          "Resume has no extractable text. Re-upload your CV or pick another resume.",
      };
    }
    resumeDocumentId = doc.id;
    resumeExcerpt = toExcerpt(content);
  }

  let jobDescriptionId: string | null = null;
  let jdExcerpt: string | null = null;

  if (form.jobDescriptionId) {
    const job = await getOwnedJobDescription(user.id, form.jobDescriptionId);
    if (!job) {
      return { ok: false, error: "Job description not found or access denied." };
    }
    const jobText = job.rawText?.trim();
    if (!jobText) {
      return {
        ok: false,
        error: "Job description has no text content.",
      };
    }
    jobDescriptionId = job.id;
    jdExcerpt = toExcerpt(jobText);
  }

  const preparationPlanItemId =
    form.preparationPlanItemId?.trim() || null;

  try {
    const questionSet = await generateInterviewQuestions({
      targetRole,
      experienceLevel: profile.experienceLevel,
      targetIndustry: profile.targetIndustry,
      resumeExcerpt,
      jdExcerpt,
    });

    const model = getInterviewQuestionsModelId();

    const session = await prisma.$transaction(async (tx) => {
      const created = await tx.interviewSession.create({
        data: {
          userId: user.id,
          status: "active",
          targetRole,
          experienceLevel: profile.experienceLevel,
          targetIndustry: profile.targetIndustry,
          resumeDocumentId,
          jobDescriptionId,
          preparationPlanItemId,
          title: questionSet.title,
          model,
        },
      });

      await tx.interviewTurn.createMany({
        data: questionSet.questions.map((q, index) => ({
          sessionId: created.id,
          kind: "primary",
          category: q.category,
          orderIndex: index,
          question: q.question,
        })),
      });

      return created;
    });

    revalidatePath("/interview");
    revalidatePath("/dashboard");

    return { ok: true, sessionId: session.id };
  } catch (error) {
    return {
      ok: false,
      error: userFacingAiError(
        error,
        "Could not start the mock interview. Please try again."
      ),
    };
  }
}
