import Link from "next/link";

import { Logo } from "@/components/landing/logo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { VideoAdminForm } from "@/components/videos/video-admin-form";
import {
  getProfileForUser,
  requireUser,
} from "@/lib/auth/session";

export default async function VideosAdminPage() {
  const user = await requireUser();
  const profile = await getProfileForUser(user.id);
  const onboarded = profile?.onboardingCompletedAt != null;

  return (
    <main className="min-h-screen bg-page px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Logo />
          <Link
            href="/videos"
            className="text-sm font-semibold text-brand-blue hover:underline"
          >
            Back to library
          </Link>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-extrabold tracking-tight">
              Add interview video
            </CardTitle>
            <CardDescription>
              Simple global library write form — not a full CMS. Entries are
              shared with all users (no per-user ownership).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              <strong className="text-foreground">MVP access:</strong> any
              authenticated, onboarded user may add published metadata rows.
              Restrict to operators in a later release if needed. Content must
              be human-made / externally hosted — do not claim AI-generated
              videos.
            </p>

            {!onboarded ? (
              <p className="text-sm text-destructive" role="alert">
                Complete onboarding before adding library videos.
              </p>
            ) : (
              <VideoAdminForm />
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
