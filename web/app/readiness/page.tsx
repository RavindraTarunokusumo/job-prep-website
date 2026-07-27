import Link from "next/link";
import { GenerateReadinessButton } from "@/components/readiness/generate-readiness-button";
import { MatchReviewList } from "@/components/matching/match-review-list";
import { GenerateMatchesButton } from "@/components/matching/generate-matches-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

type PageProps = { searchParams: Promise<{ jobId?: string }> };

export default async function ReadinessPage({ searchParams }: PageProps) {
  const user = await requireUser();
  const { jobId: requestedJobId } = await searchParams;

  const jobs = await prisma.jobDescription.findMany({
    where: { userId: user.id, status: "analyzed" },
    orderBy: { updatedAt: "desc" },
    take: 20,
    select: { id: true, title: true, company: true },
  });

  const jobId = requestedJobId && jobs.some((j) => j.id === requestedJobId)
    ? requestedJobId
    : jobs[0]?.id;

  const [matches, latestScore] = jobId
    ? await Promise.all([
        prisma.requirementEvidenceMatch.findMany({
          where: { userId: user.id, jobDescriptionId: jobId },
          orderBy: [{ importance: "asc" }, { evidenceStrength: "desc" }],
        }),
        prisma.applicationReadinessScore.findFirst({
          where: { userId: user.id, jobDescriptionId: jobId },
          orderBy: { version: "desc" },
        }),
      ])
    : [[], null];

  const dimensions =
    latestScore?.dimensions &&
    typeof latestScore.dimensions === "object" &&
    "dimensions" in (latestScore.dimensions as object)
      ? (
          latestScore.dimensions as {
            dimensions: {
              key: string;
              score: number | null;
              confidence: number;
              explanation: string;
              highestImpactAction?: string | null;
            }[];
          }
        ).dimensions
      : [];

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          <Link href="/dashboard" className="hover:underline">
            Dashboard
          </Link>{" "}
          / Readiness
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Application readiness
        </h1>
        <p className="text-sm text-muted-foreground">
          Dimension scores are coaching guidance only — not hire probability (JOB-87).
          Mappings show requirement→evidence links you can confirm or reject (JOB-86).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Target job</CardTitle>
          <CardDescription>Choose an analyzed job description.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No analyzed jobs yet.{" "}
              <Link href="/jobs/match" className="text-brand-blue hover:underline">
                Run a job match
              </Link>
              .
            </p>
          ) : (
            <ul className="flex flex-wrap gap-2 text-sm">
              {jobs.map((j) => (
                <li key={j.id}>
                  <Link
                    href={`/readiness?jobId=${j.id}`}
                    className={
                      j.id === jobId
                        ? "rounded-md bg-primary px-3 py-1 text-primary-foreground"
                        : "rounded-md border border-border px-3 py-1 hover:bg-muted"
                    }
                  >
                    {[j.title, j.company].filter(Boolean).join(" @ ") || "Untitled job"}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {jobId ? <GenerateMatchesButton jobDescriptionId={jobId} /> : null}
          {jobId ? <GenerateReadinessButton jobDescriptionId={jobId} /> : null}
        </CardContent>
      </Card>

      {latestScore ? (
        <Card>
          <CardHeader>
            <CardTitle>
              Score v{latestScore.version} · {latestScore.confidenceBand}
              {latestScore.overallScore != null
                ? ` · overall ${latestScore.overallScore}`
                : ""}
            </CardTitle>
            <CardDescription>
              Missing data lowers confidence rather than inventing precision.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {dimensions.map((d) => (
              <div key={d.key} className="rounded-lg border border-border p-3 text-sm">
                <div className="flex justify-between gap-2 font-medium">
                  <span>{d.key.replace(/_/g, " ")}</span>
                  <span>
                    {d.score == null ? "—" : d.score}{" "}
                    <span className="text-muted-foreground">
                      (conf {(d.confidence * 100).toFixed(0)}%)
                    </span>
                  </span>
                </div>
                <p className="mt-1 text-muted-foreground">{d.explanation}</p>
                {d.highestImpactAction ? (
                  <p className="mt-1 text-xs">Action: {d.highestImpactAction}</p>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Requirement mappings</CardTitle>
          <CardDescription>
            Confirm or reject suggested evidence links. Inferred facts never auto-confirm.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MatchReviewList
            matches={matches.map((m) => ({
              id: m.id,
              requirementKey: m.requirementKey,
              requirementText: m.requirementText,
              importance: m.importance,
              matchType: m.matchType,
              evidenceStrength: m.evidenceStrength,
              explanation: m.explanation,
              userReview: m.userReview,
              safeAction: m.safeAction,
            }))}
          />
        </CardContent>
      </Card>

      {jobId ? (
        <p className="text-sm">
          <Link
            href={`/interview?jobId=${jobId}`}
            className="font-medium text-brand-blue hover:underline"
          >
            Start a gap-driven mock interview for this job →
          </Link>
        </p>
      ) : null}
    </main>
  );
}
