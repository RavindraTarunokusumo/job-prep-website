import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Badge } from "@/components/ui/badge";
import {
  getProfileForUser,
  requireUser,
} from "@/lib/auth/session";
import {
  experienceLevelLabels,
  jobSearchStatusLabels,
  type ExperienceLevel,
  type JobSearchStatus,
} from "@/lib/validation/onboarding";

export default async function DashboardPage() {
  const user = await requireUser();
  const profile = await getProfileForUser(user.id);
  const onboardingComplete = profile?.onboardingCompletedAt != null;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg text-center">
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
          Your home workspace — readiness score, current plan, and next actions in
          one view.
        </p>
        {profile ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Preparing for{" "}
            <span className="font-semibold text-foreground">{profile.targetRole}</span>{" "}
            in {profile.targetIndustry} (
            {experienceLevelLabels[profile.experienceLevel as ExperienceLevel]},{" "}
            {jobSearchStatusLabels[profile.jobSearchStatus as JobSearchStatus]}).
          </p>
        ) : null}
        <p className="mt-6 font-mono text-xs font-semibold tracking-wider text-brand-purple uppercase">
          Coming soon
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
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