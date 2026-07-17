import Link from "next/link";
import { Logo } from "@/components/landing/logo";
import {
  SessionList,
  type SessionListItem,
} from "@/components/interview/session-list";
import {
  SessionWorkspace,
  type JobOption,
  type ResumeOption,
  type SessionSnapshot,
  type TurnSnapshot,
} from "@/components/interview/session-workspace";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getProfileForUser, requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { safeParseInterviewFeedback } from "@/lib/validation/interview";

type InterviewPageProps = {
  searchParams: Promise<{ sessionId?: string }>;
};

export default async function InterviewPage({
  searchParams,
}: InterviewPageProps) {
  const user = await requireUser();
  const profile = await getProfileForUser(user.id);
  const { sessionId: requestedSessionId } = await searchParams;

  const [parsedResumes, jobRows, sessionRows] = await Promise.all([
    prisma.resumeDocument.findMany({
      where: { userId: user.id, status: "parsed" },
      orderBy: { updatedAt: "desc" },
      select: { id: true, originalFilename: true },
    }),
    prisma.jobDescription.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: { id: true, title: true, company: true },
    }),
    prisma.interviewSession.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: {
        id: true,
        title: true,
        status: true,
        targetRole: true,
        experienceLevel: true,
        startedAt: true,
        updatedAt: true,
        turns: {
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
        },
      },
    }),
  ]);

  const resumes: ResumeOption[] = parsedResumes.map((doc) => ({
    id: doc.id,
    originalFilename: doc.originalFilename,
  }));

  const jobs: JobOption[] = jobRows.map((job) => ({
    id: job.id,
    title: job.title,
    company: job.company,
  }));

  const sessions: SessionListItem[] = sessionRows.map((row) => ({
    id: row.id,
    title: row.title,
    status: row.status,
    targetRole: row.targetRole,
    startedAt: row.startedAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    turnCount: row.turns.length,
    answeredCount: row.turns.filter((t) => t.answeredAt != null).length,
  }));

  let selectedRow =
    (requestedSessionId
      ? sessionRows.find((row) => row.id === requestedSessionId)
      : null) ?? null;

  if (requestedSessionId && !selectedRow) {
    const owned = await prisma.interviewSession.findFirst({
      where: { id: requestedSessionId, userId: user.id },
      select: {
        id: true,
        title: true,
        status: true,
        targetRole: true,
        experienceLevel: true,
        startedAt: true,
        updatedAt: true,
        turns: {
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
        },
      },
    });
    selectedRow = owned;
  }

  // Prefer requested session; else most recent active; else show start form (null).
  if (!selectedRow) {
    selectedRow = sessionRows.find((row) => row.status === "active") ?? null;
  }

  function toTurnSnapshot(t: {
    id: string;
    kind: string;
    category: string | null;
    orderIndex: number;
    question: string;
    answer: string | null;
    answeredAt: Date | null;
    parentTurnId: string | null;
    feedback: unknown;
  }): TurnSnapshot {
    return {
      id: t.id,
      kind: t.kind,
      category: t.category,
      orderIndex: t.orderIndex,
      question: t.question,
      answer: t.answer,
      answeredAt: t.answeredAt?.toISOString() ?? null,
      parentTurnId: t.parentTurnId,
      feedback: safeParseInterviewFeedback(t.feedback),
    };
  }

  const sessionSnapshot: SessionSnapshot | null = selectedRow
    ? {
        id: selectedRow.id,
        status: selectedRow.status,
        title: selectedRow.title,
        targetRole: selectedRow.targetRole,
        experienceLevel: selectedRow.experienceLevel,
        turns: selectedRow.turns.map(toTurnSnapshot),
      }
    : null;

  const selectedId = sessionSnapshot?.id ?? null;
  const onboardingComplete = profile?.onboardingCompletedAt != null;
  // When reviewing a closed session, still offer a start form below.
  const showStartAlongside =
    sessionSnapshot != null && sessionSnapshot.status !== "active";

  return (
    <main className="min-h-screen bg-page px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Logo />
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-brand-blue hover:underline"
          >
            Back to dashboard
          </Link>
        </div>

        <div className="space-y-8">
          <div
            className="rounded-lg border border-brand-blue/20 bg-brand-blue/5 px-4 py-3 text-sm text-foreground"
            role="status"
          >
            <span className="font-semibold">Practice only.</span> This is a
            coaching mock interview — not a real interview or hiring decision.
            Answers stay in your account for review.
          </div>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl font-extrabold tracking-tight">
                Mock interview
              </CardTitle>
              <CardDescription>
                Text-based practice aligned to your target role. Answer in your
                own words; get contextual follow-ups and coaching feedback —
                practice only, not a hiring decision.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <SessionWorkspace
                key={selectedId ?? "new"}
                resumes={resumes}
                jobs={jobs}
                targetRole={profile?.targetRole ?? null}
                onboardingComplete={onboardingComplete}
                session={sessionSnapshot}
              />
              {showStartAlongside ? (
                <div className="border-t border-border pt-6">
                  <h3 className="mb-4 text-sm font-semibold text-foreground">
                    Start a new session
                  </h3>
                  <SessionWorkspace
                    key="start-new"
                    resumes={resumes}
                    jobs={jobs}
                    targetRole={profile?.targetRole ?? null}
                    onboardingComplete={onboardingComplete}
                    session={null}
                  />
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Recent sessions
              </CardTitle>
              <CardDescription>
                Resume an active interview or review a past practice run.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SessionList sessions={sessions} selectedId={selectedId} />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
