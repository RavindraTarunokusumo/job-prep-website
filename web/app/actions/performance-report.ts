"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import {
  generateReportNarrative,
  getPerformanceReportModelId,
} from "@/lib/ai/performance-report";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { trackEvent } from "@/lib/analytics/track";
import { getProfileForUser, requireUser } from "@/lib/auth/session";
import { hasConsent } from "@/lib/legal/consent";
import { prisma } from "@/lib/prisma";
import {
  aggregatePerformanceReportInput,
  buildDeterministicReportSummary,
  interviewFeedbackToGathered,
  type GatheredSources,
} from "@/lib/report/aggregate";
import { safeParseInterviewFeedback } from "@/lib/validation/interview";
import { parseJobMatchResult } from "@/lib/validation/job-match";
import {
  parsePerformanceReportSections,
  safeParsePerformanceReportSections,
  type PerformanceReportSections,
} from "@/lib/validation/performance-report";
import { parseResumeReviewResult } from "@/lib/validation/resume-review";

export type PerformanceReportListItem = {
  id: string;
  title: string;
  status: string;
  version: number;
  summary: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PerformanceReportDetail = PerformanceReportListItem & {
  sections: PerformanceReportSections | null;
  meta: unknown;
  resumeReviewId: string | null;
  jobMatchAnalysisId: string | null;
  interviewSessionId: string | null;
  preparationPlanId: string | null;
  model: string | null;
  errorMessage: string | null;
};

async function gatherSources(userId: string): Promise<GatheredSources> {
  const [
    profile,
    resumeReviewRow,
    jobMatchRow,
    interviewRows,
    assessmentRows,
    prepPlanRow,
  ] = await Promise.all([
    prisma.profile.findUnique({
      where: { userId },
      select: {
        targetRole: true,
        targetIndustry: true,
        experienceLevel: true,
        jobSearchStatus: true,
        skills: true,
        certifications: true,
        preferredLocation: true,
        educationBackground: true,
      },
    }),
    prisma.resumeReview.findFirst({
      where: { userId, status: "completed" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        overallScore: true,
        result: true,
      },
    }),
    prisma.jobMatchAnalysis.findFirst({
      where: { userId, status: "completed" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        matchScore: true,
        result: true,
      },
    }),
    // Prefer a completed session that actually has coaching feedback
    // (latest completed may lack feedback if scoring was skipped).
    prisma.interviewSession.findMany({
      where: { userId, status: "completed" },
      orderBy: { completedAt: "desc" },
      take: 12,
      select: {
        id: true,
        title: true,
        targetRole: true,
        turns: {
          where: { feedback: { not: Prisma.DbNull } },
          orderBy: { orderIndex: "asc" },
          select: { feedback: true },
        },
      },
    }),
    prisma.assessmentAttempt.findMany({
      where: { userId, status: "completed" },
      orderBy: { completedAt: "desc" },
      take: 8,
      select: {
        id: true,
        score: true,
        maxScore: true,
        category: { select: { name: true } },
      },
    }),
    prisma.preparationPlan.findFirst({
      where: { userId, status: "active" },
      select: {
        id: true,
        title: true,
        summary: true,
        items: {
          orderBy: { priority: "asc" },
          select: {
            title: true,
            status: true,
            category: true,
            priority: true,
          },
        },
      },
    }),
  ]);

  let resumeReview: GatheredSources["resumeReview"] = null;
  if (resumeReviewRow) {
    let result = null;
    if (resumeReviewRow.result) {
      try {
        result = parseResumeReviewResult(resumeReviewRow.result);
      } catch {
        result = null;
      }
    }
    resumeReview = {
      id: resumeReviewRow.id,
      overallScore: resumeReviewRow.overallScore,
      result,
    };
  }

  let jobMatch: GatheredSources["jobMatch"] = null;
  if (jobMatchRow) {
    let result = null;
    if (jobMatchRow.result) {
      try {
        result = parseJobMatchResult(jobMatchRow.result);
      } catch {
        result = null;
      }
    }
    jobMatch = {
      id: jobMatchRow.id,
      matchScore: jobMatchRow.matchScore,
      result,
    };
  }

  let interview: GatheredSources["interview"] = null;
  for (const session of interviewRows) {
    const turnFeedbacks = session.turns
      .map((t) => safeParseInterviewFeedback(t.feedback))
      .filter((f): f is NonNullable<typeof f> => f != null)
      .map(interviewFeedbackToGathered);

    if (turnFeedbacks.length > 0) {
      interview = {
        id: session.id,
        title: session.title,
        targetRole: session.targetRole,
        turnFeedbacks,
      };
      break;
    }
  }

  return {
    profile: profile
      ? {
          targetRole: profile.targetRole,
          targetIndustry: profile.targetIndustry,
          experienceLevel: profile.experienceLevel,
          jobSearchStatus: profile.jobSearchStatus,
          skills: profile.skills,
          certifications: profile.certifications,
          preferredLocation: profile.preferredLocation,
          educationBackground: profile.educationBackground,
        }
      : null,
    resumeReview,
    jobMatch,
    interview,
    assessments: assessmentRows.map((a) => ({
      id: a.id,
      categoryName: a.category.name,
      score: a.score,
      maxScore: a.maxScore,
    })),
    prepPlan: prepPlanRow
      ? {
          id: prepPlanRow.id,
          title: prepPlanRow.title,
          summary: prepPlanRow.summary,
          items: prepPlanRow.items,
        }
      : null,
  };
}

function toListItem(row: {
  id: string;
  title: string;
  status: string;
  version: number;
  summary: string | null;
  createdAt: Date;
  updatedAt: Date;
}): PerformanceReportListItem {
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    version: row.version,
    summary: row.summary,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/**
 * Generate a new performance report version from latest owned sources.
 * Deterministic aggregation always runs; AI narrative is optional (consent + best-effort).
 */
export async function generatePerformanceReportAction(): Promise<
  { ok: true; reportId: string } | { ok: false; error: string }
> {
  const user = await requireUser();
  const profile = await getProfileForUser(user.id);
  if (!profile?.onboardingCompletedAt) {
    return {
      ok: false,
      error: "Complete onboarding before generating a performance report.",
    };
  }

  try {
    const sources = await gatherSources(user.id);
    const sections = aggregatePerformanceReportInput(sources);
    // Validate round-trip before persist
    parsePerformanceReportSections(sections);

    const template = buildDeterministicReportSummary(sections, sources.profile);
    let title = template.title;
    let summary = template.summary;
    let model: string | null = null;
    let narrativeSource: "deterministic" | "ai" = "deterministic";

    // Optional AI narrative only when consent is already recorded (does not block generate).
    if (await hasConsent(user.id, "ai_processing")) {
      try {
        const narrative = await generateReportNarrative({
          profile: sources.profile,
          sections,
        });
        summary = narrative.summary;
        if (narrative.title?.trim()) {
          title = narrative.title.trim();
        }
        model = getPerformanceReportModelId();
        narrativeSource = "ai";
      } catch (error) {
        console.warn(
          "[performance-report] AI narrative failed; using deterministic summary",
          error
        );
      }
    }

    const assessmentAttemptIds = sources.assessments.map((a) => a.id);
    const meta = {
      assessmentAttemptIds,
      narrativeSource,
      availableSectionKeys: sections.sections
        .filter((s) => s.available)
        .map((s) => s.key),
    };

    const report = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`perf-report:${user.id}`}))`;

      const agg = await tx.performanceReport.aggregate({
        where: { userId: user.id },
        _max: { version: true },
      });
      const version = (agg._max.version ?? 0) + 1;

      return tx.performanceReport.create({
        data: {
          userId: user.id,
          status: "ready",
          version,
          title,
          summary,
          sections: sections as unknown as Prisma.InputJsonValue,
          meta: meta as unknown as Prisma.InputJsonValue,
          resumeReviewId: sources.resumeReview?.id ?? null,
          jobMatchAnalysisId: sources.jobMatch?.id ?? null,
          interviewSessionId: sources.interview?.id ?? null,
          preparationPlanId: sources.prepPlan?.id ?? null,
          model,
          errorMessage: null,
        },
      });
    });

    revalidatePath("/report");
    revalidatePath("/dashboard");

    await trackEvent({
      userId: user.id,
      name: ANALYTICS_EVENTS.REPORT_GEN,
      props: {
        reportId: report.id,
        version: report.version,
        narrativeSource,
        sectionCount: sections.sections.length,
      },
    });

    return { ok: true, reportId: report.id };
  } catch (error) {
    console.error("[performance-report] generate failed", error);
    const message =
      error instanceof Error ? error.message : "Report generation failed.";

    try {
      const agg = await prisma.performanceReport.aggregate({
        where: { userId: user.id },
        _max: { version: true },
      });
      const version = (agg._max.version ?? 0) + 1;
      await prisma.performanceReport.create({
        data: {
          userId: user.id,
          status: "failed",
          version,
          title: "Report generation failed",
          summary: null,
          sections: Prisma.JsonNull,
          errorMessage: message.slice(0, 500),
        },
      });
      revalidatePath("/report");
    } catch {
      // ignore secondary persist failure
    }

    return {
      ok: false,
      error: "Report generation failed. Please try again.",
    };
  }
}

export async function listPerformanceReportsAction(): Promise<
  | { ok: true; reports: PerformanceReportListItem[] }
  | { ok: false; error: string }
> {
  const user = await requireUser();

  const rows = await prisma.performanceReport.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      title: true,
      status: true,
      version: true,
      summary: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return { ok: true, reports: rows.map(toListItem) };
}

export async function getPerformanceReportAction(
  id: string
): Promise<
  | { ok: true; report: PerformanceReportDetail }
  | { ok: false; error: string }
> {
  const user = await requireUser();

  if (!id || typeof id !== "string") {
    return { ok: false, error: "Report id is required." };
  }

  const row = await prisma.performanceReport.findFirst({
    where: { id, userId: user.id },
  });

  if (!row) {
    return { ok: false, error: "Report not found or access denied." };
  }

  const sections = row.sections
    ? safeParsePerformanceReportSections(row.sections)
    : null;

  return {
    ok: true,
    report: {
      ...toListItem(row),
      sections,
      meta: row.meta,
      resumeReviewId: row.resumeReviewId,
      jobMatchAnalysisId: row.jobMatchAnalysisId,
      interviewSessionId: row.interviewSessionId,
      preparationPlanId: row.preparationPlanId,
      model: row.model,
      errorMessage: row.errorMessage,
    },
  };
}
