import Link from "next/link";
import { Logo } from "@/components/landing/logo";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
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
import { syncOnboardingCookie } from "@/lib/auth/upsert-user";
import type { ExperienceLevel, JobSearchStatus } from "@/lib/validation/onboarding";

type OnboardingPageProps = {
  searchParams: Promise<{ edit?: string }>;
};

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const user = await requireUser();
  await syncOnboardingCookie(user.id);
  const profile = await getProfileForUser(user.id);
  const { edit } = await searchParams;
  const isEdit = edit === "1";

  const defaultValues = profile
    ? {
        educationBackground: profile.educationBackground,
        experienceLevel: profile.experienceLevel as ExperienceLevel,
        targetRole: profile.targetRole,
        targetIndustry: profile.targetIndustry,
        preferredLocation: profile.preferredLocation,
        jobSearchStatus: profile.jobSearchStatus as JobSearchStatus,
        careerSwitchIntent: profile.careerSwitchIntent,
        skills: profile.skills.join(", "),
        certifications: profile.certifications.join(", "),
      }
    : undefined;

  return (
    <main className="min-h-screen bg-page px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Logo />
          {isEdit ? (
            <Link
              href="/settings"
              className="text-sm font-semibold text-brand-blue hover:underline"
            >
              Back to settings
            </Link>
          ) : null}
        </div>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-extrabold tracking-tight">
              {isEdit ? "Edit your profile" : "Set your career goals"}
            </CardTitle>
            <CardDescription>
              {isEdit
                ? "Update your target role, industry, and preparation context."
                : "Complete this once so we can personalize your job preparation plan."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OnboardingForm
              defaultValues={defaultValues}
              submitLabel={isEdit ? "Save changes" : "Complete onboarding"}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}