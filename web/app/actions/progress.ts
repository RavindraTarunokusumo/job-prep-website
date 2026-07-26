"use server";

import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import {
  buildTrendInsights,
  compareAttempts,
  sortAttemptsNewestFirst,
  type AttemptKind,
  type ProgressAttempt,
  type TrendOptions,
} from "@/lib/progress/compare";
import { safeParseInterviewFeedback } from "@/lib/validation/interview";

type ActionErr = { ok: false; error: string };

function avg(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

export async function listProgressHistoryAction(options: TrendOptions = {}): Promise<
  | {
      ok: true;
      attempts: ProgressAttempt[];
      insights: string[];
      partial: boolean;
    }
  | ActionErr
> {
  try {
    const user = await requireUser();

    const [reviews, matches, interviews, assessments, reports, profile] =
      await Promise.all([
        prisma.resumeReview.findMany({
          where: { userId: user.id, status: "completed" },
          orderBy: { createdAt: "desc" },
          take: 50,
          select: {
            id: true,
            overallScore: true,
            createdAt: true,
          },
        }),
        prisma.jobMatchAnalysis.findMany({
          where: { userId: user.id, status: "completed" },
          orderBy: { createdAt: "desc" },
          take: 50,
          select: {
            id: true,
            matchScore: true,
            createdAt: true,
            jobDescription: { select: { title: true } },
          },
        }),
        prisma.interviewSession.findMany({
          where: { userId: user.id, status: "completed" },
          orderBy: { completedAt: "desc" },
          take: 50,
          select: {
            id: true,
            title: true,
            targetRole: true,
            completedAt: true,
            createdAt: true,
            turns: { select: { feedback: true } },
          },
        }),
        prisma.assessmentAttempt.findMany({
          where: { userId: user.id, status: "completed" },
          orderBy: { completedAt: "desc" },
          take: 50,
          select: {
            id: true,
            score: true,
            maxScore: true,
            completedAt: true,
            createdAt: true,
            category: { select: { name: true } },
          },
        }),
        prisma.performanceReport.findMany({
          where: { userId: user.id, status: "ready" },
          orderBy: { createdAt: "desc" },
          take: 50,
          select: {
            id: true,
            title: true,
            version: true,
            createdAt: true,
            sections: true,
          },
        }),
        prisma.profile.findUnique({
          where: { userId: user.id },
          select: { targetRole: true },
        }),
      ]);

    const defaultRole = profile?.targetRole ?? null;
    const attempts: ProgressAttempt[] = [];

    for (const r of reviews) {
      attempts.push({
        id: r.id,
        kind: "resume_review",
        label: "Resume review",
        score: r.overallScore,
        completedAt: r.createdAt.toISOString(),
        targetRole: defaultRole,
      });
    }

    for (const m of matches) {
      attempts.push({
        id: m.id,
        kind: "job_match",
        label: m.jobDescription?.title
          ? `Job match — ${m.jobDescription.title}`
          : "Job match",
        score: m.matchScore,
        completedAt: m.createdAt.toISOString(),
        targetRole: m.jobDescription?.title ?? defaultRole,
      });
    }

    for (const s of interviews) {
      const scores: number[] = [];
      for (const t of s.turns) {
        const fb = safeParseInterviewFeedback(t.feedback);
        if (fb && typeof fb.overallScore === "number") {
          scores.push(fb.overallScore);
        }
      }
      attempts.push({
        id: s.id,
        kind: "interview",
        label: s.title || `Interview — ${s.targetRole}`,
        score: avg(scores),
        completedAt: (s.completedAt ?? s.createdAt).toISOString(),
        targetRole: s.targetRole,
      });
    }

    for (const a of assessments) {
      attempts.push({
        id: a.id,
        kind: "assessment",
        label: a.category?.name
          ? `Assessment — ${a.category.name}`
          : "Assessment",
        score: a.score,
        maxScore: a.maxScore,
        completedAt: (a.completedAt ?? a.createdAt).toISOString(),
        targetRole: defaultRole,
      });
    }

    for (const r of reports) {
      // Reports are coaching composites — use version as ordinal label; score null unless sections carry one later
      attempts.push({
        id: r.id,
        kind: "report",
        label: r.title || `Report v${r.version}`,
        score: null,
        completedAt: r.createdAt.toISOString(),
        targetRole: defaultRole,
        meta: { version: r.version },
      });
    }

    const sorted = sortAttemptsNewestFirst(attempts);
    const trends = buildTrendInsights(sorted, {
      role: options.role,
      from: options.from,
      to: options.to,
    });

    return {
      ok: true,
      attempts: sorted,
      insights: trends.insights,
      partial: trends.partial,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to load progress history",
    };
  }
}

export async function compareProgressAttemptsAction(
  aId: string,
  bId: string,
  kind: AttemptKind
): Promise<
  | {
      ok: true;
      result: ReturnType<typeof compareAttempts>;
      a: ProgressAttempt;
      b: ProgressAttempt;
    }
  | ActionErr
> {
  try {
    const history = await listProgressHistoryAction();
    if (!history.ok) return history;
    const a = history.attempts.find((x) => x.id === aId && x.kind === kind);
    const b = history.attempts.find((x) => x.id === bId && x.kind === kind);
    if (!a || !b) {
      return {
        ok: false,
        error: "One or both attempts were not found for this kind.",
      };
    }
    return {
      ok: true,
      result: compareAttempts(a, b),
      a,
      b,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to compare attempts",
    };
  }
}
