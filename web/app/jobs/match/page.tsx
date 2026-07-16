import Link from "next/link";
import { MatchResults, type MatchSnapshot } from "@/components/jobs/match-results";
import { PasteForm } from "@/components/jobs/paste-form";
import { Logo } from "@/components/landing/logo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { parseJobMatchResult } from "@/lib/validation/job-match";

type JobsMatchPageProps = {
  searchParams: Promise<{ matchId?: string }>;
};

function parseMatchResult(data: unknown) {
  if (data == null) {
    return null;
  }
  try {
    return parseJobMatchResult(data);
  } catch {
    return null;
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

export default async function JobsMatchPage({
  searchParams,
}: JobsMatchPageProps) {
  const user = await requireUser();
  const { matchId: requestedMatchId } = await searchParams;

  const [parsedResumes, historyRows] = await Promise.all([
    prisma.resumeDocument.findMany({
      where: { userId: user.id, status: "parsed" },
      orderBy: { updatedAt: "desc" },
      select: { id: true, originalFilename: true },
    }),
    prisma.jobMatchAnalysis.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        jobDescription: {
          select: { title: true, company: true },
        },
      },
    }),
  ]);

  const resumeOptions = parsedResumes.map((doc) => ({
    id: doc.id,
    originalFilename: doc.originalFilename,
  }));

  const defaultResumeId = resumeOptions[0]?.id ?? null;

  const selectedMatchRow = requestedMatchId
    ? historyRows.find((row) => row.id === requestedMatchId) ??
      (await prisma.jobMatchAnalysis.findFirst({
        where: { id: requestedMatchId, userId: user.id },
        include: {
          jobDescription: { select: { title: true, company: true } },
        },
      }))
    : historyRows[0] ?? null;

  const selectedMatch: MatchSnapshot | null = selectedMatchRow
    ? {
        id: selectedMatchRow.id,
        status: selectedMatchRow.status,
        matchScore: selectedMatchRow.matchScore,
        errorMessage: selectedMatchRow.errorMessage,
        createdAt: selectedMatchRow.createdAt.toISOString(),
        result: parseMatchResult(selectedMatchRow.result),
        jobTitle: selectedMatchRow.jobDescription.title,
        jobCompany: selectedMatchRow.jobDescription.company,
      }
    : null;

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
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl font-extrabold tracking-tight">
                Job description match
              </CardTitle>
              <CardDescription>
                Paste a job posting to see how your resume aligns with its
                requirements. Match score reflects fit — not hire probability.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PasteForm
                resumes={resumeOptions}
                defaultResumeId={defaultResumeId}
              />
            </CardContent>
          </Card>

          {selectedMatch ? (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Latest results</CardTitle>
              </CardHeader>
              <CardContent>
                <MatchResults match={selectedMatch} />
              </CardContent>
            </Card>
          ) : null}

          {historyRows.length > 0 ? (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">History</CardTitle>
                <CardDescription>Prior job description analyses.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-border">
                  {historyRows.map((row) => {
                    const label =
                      [row.jobDescription.title, row.jobDescription.company]
                        .filter(Boolean)
                        .join(" at ") || "Untitled posting";
                    const isActive = row.id === selectedMatch?.id;

                    return (
                      <li key={row.id} className="py-3 first:pt-0 last:pb-0">
                        <Link
                          href={`/jobs/match?matchId=${row.id}`}
                          className={`flex items-center justify-between gap-4 rounded-lg px-2 py-1 text-sm transition-colors hover:bg-muted/40 ${
                            isActive ? "bg-muted/30 font-semibold" : ""
                          }`}
                        >
                          <span className="truncate">{label}</span>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {row.matchScore != null ? `${row.matchScore}/100 · ` : ""}
                            {formatDate(row.createdAt.toISOString())}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </main>
  );
}