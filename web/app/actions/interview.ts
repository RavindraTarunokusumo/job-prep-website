"use server";

import { revalidatePath } from "next/cache";
import {
  generateAnswerFeedback,
  getInterviewFeedbackModelId,
} from "@/lib/ai/interview-feedback";
import { userFacingAiError } from "@/lib/ai/errors";
import { decideFollowUp } from "@/lib/ai/interview-follow-up";
import {
  generateInterviewQuestions,
  getInterviewQuestionsModelId,
} from "@/lib/ai/interview-questions";
import { getProfileForUser, requireUser } from "@/lib/auth/session";
import { requireAiConsent } from "@/lib/legal/consent";
import { prisma } from "@/lib/prisma";
import { getResumeTextContent } from "@/lib/resume/content";
import type { InterviewFeedback } from "@/lib/validation/interview";

const EXCERPT_MAX_CHARS = 8_000;
/** Max stored length for a single mock-interview answer (plain text). */
const ANSWER_MAX_CHARS = 8_000;

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

  const consent = await requireAiConsent(user.id);
  if (!consent.ok) return consent;

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

type SubmitOk = {
  ok: true;
  nextTurnId?: string;
  followUp?: boolean;
  sessionComplete?: boolean;
  feedback?: InterviewFeedback;
};
type SubmitResult = SubmitOk | ActionErr;

type SessionActionOk = { ok: true };
type SessionActionResult = SessionActionOk | ActionErr;

type TurnRow = {
  id: string;
  kind: string;
  category: string | null;
  orderIndex: number;
  question: string;
  answer: string | null;
  answeredAt: Date | null;
  parentTurnId: string | null;
  feedback: unknown;
};

function nextUnansweredAfter(
  turns: TurnRow[],
  fromOrderIndex: number
): TurnRow | undefined {
  return turns.find(
    (t) => t.answeredAt == null && t.orderIndex > fromOrderIndex
  );
}

async function loadSessionTurns(sessionId: string): Promise<TurnRow[]> {
  return prisma.interviewTurn.findMany({
    where: { sessionId },
    orderBy: { orderIndex: "asc" },
    select: {
      id: true,
      kind: true,
      category: true,
      orderIndex: true,
      question: true,
      answer: true,
      answeredAt: true,
      parentTurnId: true,
      feedback: true,
    },
  });
}

/**
 * Insert at most one follow-up turn immediately after the primary, shifting
 * later orderIndex values by +1. Returns the new follow-up turn id.
 */
async function insertFollowUpTurn(input: {
  sessionId: string;
  parentTurnId: string;
  afterOrderIndex: number;
  question: string;
}): Promise<string> {
  return prisma.$transaction(async (tx) => {
    // Cap: never create a second follow-up for the same primary.
    const existing = await tx.interviewTurn.findFirst({
      where: {
        sessionId: input.sessionId,
        parentTurnId: input.parentTurnId,
        kind: "follow_up",
      },
      select: { id: true },
    });
    if (existing) {
      return existing.id;
    }

    await tx.interviewTurn.updateMany({
      where: {
        sessionId: input.sessionId,
        orderIndex: { gt: input.afterOrderIndex },
      },
      data: {
        orderIndex: { increment: 1 },
      },
    });

    const created = await tx.interviewTurn.create({
      data: {
        sessionId: input.sessionId,
        kind: "follow_up",
        category: "follow_up",
        orderIndex: input.afterOrderIndex + 1,
        question: input.question,
        parentTurnId: input.parentTurnId,
      },
    });

    return created.id;
  });
}

async function scorePrimaryTurn(input: {
  primary: TurnRow;
  targetRole: string;
  followUp?: TurnRow | null;
}): Promise<InterviewFeedback | undefined> {
  const answer = input.primary.answer?.trim();
  if (!answer) {
    return undefined;
  }

  // Skip re-score if feedback already persisted (idempotent).
  if (input.primary.feedback != null) {
    return undefined;
  }

  const feedback = await generateAnswerFeedback({
    question: input.primary.question,
    answer,
    targetRole: input.targetRole,
    category: input.primary.category,
    followUpQuestion: input.followUp?.question,
    followUpAnswer: input.followUp?.answer,
  });

  await prisma.interviewTurn.update({
    where: { id: input.primary.id },
    data: {
      feedback,
      feedbackModel: getInterviewFeedbackModelId(),
    },
  });

  return feedback;
}

/**
 * Save an answer, optionally ask one contextual follow-up (max 1 per primary),
 * and persist coaching feedback when the primary unit is settled.
 */
export async function submitInterviewAnswerAction(form: {
  sessionId: string;
  turnId: string;
  answer: string;
}): Promise<SubmitResult> {
  const user = await requireUser();

  const answer = form.answer?.trim() ?? "";
  if (!answer) {
    return { ok: false, error: "Write an answer before submitting." };
  }
  if (answer.length > ANSWER_MAX_CHARS) {
    return {
      ok: false,
      error: `Keep your answer under ${ANSWER_MAX_CHARS.toLocaleString()} characters.`,
    };
  }

  const session = await prisma.interviewSession.findUnique({
    where: { id: form.sessionId },
    include: {
      turns: { orderBy: { orderIndex: "asc" } },
    },
  });

  if (!session || session.userId !== user.id) {
    return { ok: false, error: "Interview session not found or access denied." };
  }

  if (session.status !== "active") {
    return {
      ok: false,
      error: "This interview is no longer active.",
    };
  }

  const turn = session.turns.find((t) => t.id === form.turnId);
  if (!turn) {
    return { ok: false, error: "Question not found in this session." };
  }

  // Idempotent: already answered → do not overwrite; advance based on current state
  if (turn.answer != null && turn.answeredAt != null) {
    const turns = await loadSessionTurns(session.id);
    const current = turns.find((t) => t.id === form.turnId);
    const next = nextUnansweredAfter(turns, current?.orderIndex ?? -1);
    return {
      ok: true,
      nextTurnId: next?.id,
      followUp: next?.kind === "follow_up" && next.parentTurnId === turn.id,
      sessionComplete: !next,
    };
  }

  // Atomic write: only set answer when still unanswered (reduces TOCTOU races)
  const updated = await prisma.interviewTurn.updateMany({
    where: {
      id: turn.id,
      sessionId: session.id,
      answeredAt: null,
    },
    data: {
      answer,
      answeredAt: new Date(),
    },
  });

  if (updated.count === 0) {
    // Concurrent submit won; reload progress without overwriting
    const turns = await loadSessionTurns(session.id);
    const current = turns.find((t) => t.id === form.turnId);
    const next = nextUnansweredAfter(turns, current?.orderIndex ?? -1);
    return {
      ok: true,
      nextTurnId: next?.id,
      followUp: false,
      sessionComplete: !next,
    };
  }

  let turns = await loadSessionTurns(session.id);
  const answeredTurn = turns.find((t) => t.id === form.turnId);
  if (!answeredTurn) {
    revalidatePath("/interview");
    return { ok: true, sessionComplete: true };
  }

  const consent = await requireAiConsent(user.id);
  const canUseAi = consent.ok;

  let followUpCreated = false;
  let feedback: InterviewFeedback | undefined;

  try {
    if (answeredTurn.kind === "primary") {
      const existingFollowUp = turns.find(
        (t) =>
          t.kind === "follow_up" && t.parentTurnId === answeredTurn.id
      );

      if (!existingFollowUp && canUseAi) {
        try {
          const decision = await decideFollowUp({
            question: answeredTurn.question,
            answer,
            targetRole: session.targetRole,
            category: answeredTurn.category,
          });

          if (
            decision.askFollowUp &&
            decision.followUpQuestion?.trim()
          ) {
            const followUpId = await insertFollowUpTurn({
              sessionId: session.id,
              parentTurnId: answeredTurn.id,
              afterOrderIndex: answeredTurn.orderIndex,
              question: decision.followUpQuestion.trim(),
            });
            followUpCreated = true;
            turns = await loadSessionTurns(session.id);

            revalidatePath("/interview");
            revalidatePath("/dashboard");

            return {
              ok: true,
              nextTurnId: followUpId,
              followUp: true,
              sessionComplete: false,
            };
          }
        } catch (error) {
          console.warn(
            "[interview] follow-up decision failed; continuing without follow-up",
            error
          );
        }
      }

      // No follow-up (or already had one / AI skipped): score the primary unit.
      if (canUseAi) {
        try {
          const scored = await scorePrimaryTurn({
            primary: { ...answeredTurn, answer },
            targetRole: session.targetRole,
            followUp: existingFollowUp ?? null,
          });
          if (scored) feedback = scored;
        } catch (error) {
          console.warn(
            "[interview] feedback generation failed after primary answer",
            error
          );
        }
      }
    } else if (answeredTurn.kind === "follow_up" && canUseAi) {
      // Score primary after follow-up resolved.
      const primary =
        (answeredTurn.parentTurnId
          ? turns.find((t) => t.id === answeredTurn.parentTurnId)
          : null) ?? null;

      if (primary?.answer) {
        try {
          const scored = await scorePrimaryTurn({
            primary,
            targetRole: session.targetRole,
            followUp: { ...answeredTurn, answer },
          });
          if (scored) feedback = scored;
        } catch (error) {
          console.warn(
            "[interview] feedback generation failed after follow-up answer",
            error
          );
        }
      }
    }
  } catch (error) {
    // Answer is already saved; surface a soft failure only if everything blew up.
    console.error("[interview] post-answer pipeline error", error);
  }

  turns = await loadSessionTurns(session.id);
  const next = nextUnansweredAfter(turns, answeredTurn.orderIndex);

  revalidatePath("/interview");
  revalidatePath("/dashboard");

  return {
    ok: true,
    nextTurnId: next?.id,
    followUp: followUpCreated,
    sessionComplete: !next,
    feedback,
  };
}

export async function completeInterviewSessionAction(form: {
  sessionId: string;
}): Promise<SessionActionResult> {
  const user = await requireUser();

  const session = await prisma.interviewSession.findUnique({
    where: { id: form.sessionId },
    include: {
      turns: { select: { answeredAt: true } },
    },
  });

  if (!session || session.userId !== user.id) {
    return { ok: false, error: "Interview session not found or access denied." };
  }

  if (session.status === "completed") {
    return { ok: true };
  }

  if (session.status !== "active") {
    return {
      ok: false,
      error: "Only an active interview can be completed.",
    };
  }

  const unanswered = session.turns.some((t) => t.answeredAt == null);
  if (unanswered) {
    return {
      ok: false,
      error: "Answer all questions before completing, or abandon the session.",
    };
  }

  await prisma.interviewSession.update({
    where: { id: session.id },
    data: {
      status: "completed",
      completedAt: new Date(),
    },
  });

  revalidatePath("/interview");
  revalidatePath("/dashboard");

  return { ok: true };
}

export async function abandonInterviewSessionAction(form: {
  sessionId: string;
}): Promise<SessionActionResult> {
  const user = await requireUser();

  const session = await prisma.interviewSession.findUnique({
    where: { id: form.sessionId },
  });

  if (!session || session.userId !== user.id) {
    return { ok: false, error: "Interview session not found or access denied." };
  }

  if (session.status === "abandoned" || session.status === "completed") {
    return { ok: true };
  }

  if (session.status !== "active") {
    return {
      ok: false,
      error: "Only an active interview can be abandoned.",
    };
  }

  await prisma.interviewSession.update({
    where: { id: session.id },
    data: {
      status: "abandoned",
      completedAt: new Date(),
    },
  });

  revalidatePath("/interview");
  revalidatePath("/dashboard");

  return { ok: true };
}
