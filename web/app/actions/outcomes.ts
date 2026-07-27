"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import {
  aggregateOutcomeInsights,
  splitFeedbackFields,
} from "@/lib/outcomes/insights";
import { prisma } from "@/lib/prisma";
import {
  applicationOutcomeInputSchema,
  type OutcomeStage,
} from "@/lib/validation/outcome";

type ActionOk<T> = { ok: true } & T;
type ActionErr = { ok: false; error: string };

/**
 * Record an application outcome stage (JOB-89). Ownership on linked JD enforced.
 */
export async function recordApplicationOutcomeAction(
  input: unknown,
): Promise<ActionOk<{ id: string }> | ActionErr> {
  const user = await requireUser();
  const parsed = applicationOutcomeInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid outcome payload." };
  }

  if (parsed.data.jobDescriptionId) {
    const job = await prisma.jobDescription.findUnique({
      where: { id: parsed.data.jobDescriptionId },
    });
    if (!job || job.userId !== user.id) {
      return { ok: false, error: "Job description not found or access denied." };
    }
  }

  const split = splitFeedbackFields({
    employerFeedback: parsed.data.employerFeedback,
    userInterpretation: parsed.data.userInterpretation,
  });

  const row = await prisma.applicationOutcome.create({
    data: {
      userId: user.id,
      jobDescriptionId: parsed.data.jobDescriptionId ?? null,
      jobApplicationId: parsed.data.jobApplicationId ?? null,
      stage: parsed.data.stage,
      outcome: parsed.data.outcome ?? null,
      stageDate: parsed.data.stageDate
        ? new Date(parsed.data.stageDate)
        : null,
      employerFeedback: split.employerFeedback,
      userInterpretation: split.userInterpretation,
      perceivedBlockers: parsed.data.perceivedBlockers ?? null,
      meta: split.meta,
      isSensitive: parsed.data.isSensitive ?? true,
    },
  });

  revalidatePath("/outcomes");
  revalidatePath("/dashboard");
  return { ok: true, id: row.id };
}

export async function getOutcomeInsightsAction(): Promise<
  ActionOk<{ insights: ReturnType<typeof aggregateOutcomeInsights>; count: number }> | ActionErr
> {
  const user = await requireUser();
  const rows = await prisma.applicationOutcome.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  // One latest stage per jobDescriptionId (or orphan id) to avoid double-count
  const latestByKey = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    const key = row.jobDescriptionId ?? row.jobApplicationId ?? row.id;
    if (!latestByKey.has(key)) latestByKey.set(key, row);
  }

  const insights = aggregateOutcomeInsights(
    [...latestByKey.values()].map((r) => ({
      stage: r.stage as OutcomeStage,
      outcome: r.outcome,
    })),
  );

  return { ok: true, insights, count: latestByKey.size };
}
