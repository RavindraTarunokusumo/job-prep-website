import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { YourDataSection } from "@/components/settings/your-data-section";
import { Badge } from "@/components/ui/badge";
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
import {
  experienceLevelLabels,
  jobSearchStatusLabels,
  type ExperienceLevel,
  type JobSearchStatus,
} from "@/lib/validation/onboarding";

export default async function SettingsPage() {
  const user = await requireUser();
  const profile = await getProfileForUser(user.id);

  return (
    <main className="min-h-screen bg-page px-6 py-16">
      <div className="mx-auto w-full max-w-lg">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              Settings
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Account preferences and career profile.
            </p>
          </div>
          <SignOutButton />
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Signed-in session details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Email</span>
              <Badge variant="outline">{user.email}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6 shadow-sm">
          <CardHeader>
            <CardTitle>Career profile</CardTitle>
            <CardDescription>
              {profile?.onboardingCompletedAt
                ? "Your onboarding answers are saved in Postgres."
                : "Complete onboarding to unlock the full app."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile ? (
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Target role</dt>
                  <dd className="font-medium text-foreground">{profile.targetRole}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Industry</dt>
                  <dd className="font-medium text-foreground">{profile.targetIndustry}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Location</dt>
                  <dd className="font-medium text-foreground">
                    {profile.preferredLocation}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Experience</dt>
                  <dd className="font-medium text-foreground">
                    {experienceLevelLabels[profile.experienceLevel as ExperienceLevel]}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Job search status</dt>
                  <dd className="font-medium text-foreground">
                    {jobSearchStatusLabels[profile.jobSearchStatus as JobSearchStatus]}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">
                No profile saved yet.
              </p>
            )}
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/onboarding?edit=1"
                className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {profile ? "Edit profile" : "Complete onboarding"}
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                Back to dashboard
              </Link>
            </div>
          </CardContent>
        </Card>

        <YourDataSection />
      </div>
    </main>
  );
}
