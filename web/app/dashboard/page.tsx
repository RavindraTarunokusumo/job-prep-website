import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getProfileForUser,
  requireUser,
} from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import {
  experienceLevelLabels,
  jobSearchStatusLabels,
  type ExperienceLevel,
  type JobSearchStatus,
} from "@/lib/validation/onboarding";

function scoreBadgeVariant(
  score: number | null
): "default" | "secondary" | "destructive" | "outline" {
  if (score == null) {
    return "outline";
  }
  if (score >= 75) {
    return "default";
  }
  if (score >= 50) {
    return "secondary";
  }
  return "destructive";
}

export default async function DashboardPage() {
  const user = await requireUser();
  const profile = await getProfileForUser(user.id);
  const onboardingComplete = profile?.onboardingCompletedAt != null;

  const [latestReview, latestMatch, activePlan] = await Promise.all([
    prisma.resumeReview.findFirst({
      where: { userId: user.id, status: "completed" },
      orderBy: { createdAt: "desc" },
      select: { overallScore: true },
    }),
    prisma.jobMatchAnalysis.findFirst({
      where: { userId: user.id, status: "completed" },
      orderBy: { createdAt: "desc" },
      select: { matchScore: true },
    }),
    prisma.preparationPlan.findFirst({
      where: { userId: user.id, status: "active" },
      include: {
        items: { select: { status: true } },
      },
    }),
  ]);

  const planDone =
    activePlan?.items.filter((item) => item.status === "done").length ?? 0;
  const planTotal = activePlan?.items.length ?? 0;
  const planProgress =
    planTotal > 0 ? Math.round((planDone / planTotal) * 100) : null;

  return (
    <main className="flex min-h-screen flex-col items-center px-6 py-16">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
            <Badge variant="outline" className="font-mono text-xs uppercase">
              Signed in as {user.email}
            </Badge>
            {onboardingComplete ? (
              <Badge className="bg-success/15 text-success hover:bg-success/15">
                Onboarding complete
              </Badge>
            ) : null}
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Your readiness snapshot — resume score, job match, and plan progress
            in one view.
          </p>
          {profile ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Preparing for{" "}
              <span className="font-semibold text-foreground">
                {profile.targetRole}
              </span>{" "}
              in {profile.targetIndustry} (
              {experienceLevelLabels[profile.experienceLevel as ExperienceLevel]}
              ,{" "}
              {jobSearchStatusLabels[profile.jobSearchStatus as JobSearchStatus]}
              ).
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Resume score</CardTitle>
              <CardDescription className="text-xs">
                Latest CV review
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {latestReview?.overallScore != null ? (
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-extrabold">
                    {latestReview.overallScore}
                  </span>
                  <Badge variant={scoreBadgeVariant(latestReview.overallScore)}>
                    / 100
                  </Badge>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No review yet</p>
              )}
              <Button variant="outline" size="sm" render={<Link href="/resume/check" />}>
                Run checker
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Job match</CardTitle>
              <CardDescription className="text-xs">
                Latest JD fit score
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {latestMatch?.matchScore != null ? (
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-extrabold">
                    {latestMatch.matchScore}
                  </span>
                  <Badge variant={scoreBadgeVariant(latestMatch.matchScore)}>
                    / 100
                  </Badge>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No match yet</p>
              )}
              <Button variant="outline" size="sm" render={<Link href="/jobs/match" />}>
                Paste a JD
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Prep plan</CardTitle>
              <CardDescription className="text-xs">
                Active checklist progress
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {planProgress != null ? (
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-extrabold">{planProgress}%</span>
                  <Badge variant="secondary">
                    {planDone}/{planTotal} done
                  </Badge>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No plan yet</p>
              )}
              <Button variant="outline" size="sm" render={<Link href="/plan" />}>
                View plan
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Back to home
          </Link>
          <Link
            href="/settings"
            className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Settings
          </Link>
          <SignOutButton />
        </div>
      </div>
    </main>
  );
}