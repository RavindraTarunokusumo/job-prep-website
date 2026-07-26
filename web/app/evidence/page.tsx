import Link from "next/link";
import {
  listEvidenceAction,
  listStarStoriesAction,
} from "@/app/actions/evidence";
import { EvidenceWorkspace } from "@/components/evidence/evidence-workspace";
import { Logo } from "@/components/landing/logo";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";

export default async function EvidencePage() {
  await requireUser();

  const [evidenceResult, storiesResult] = await Promise.all([
    listEvidenceAction(),
    listStarStoriesAction(),
  ]);

  const evidence = evidenceResult.ok ? evidenceResult.evidence : [];
  const stories = storiesResult.ok ? storiesResult.stories : [];
  const loadError = !evidenceResult.ok
    ? evidenceResult.error
    : !storiesResult.ok
      ? storiesResult.error
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

        <Card className="mb-6 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-extrabold tracking-tight">
              Career evidence & STAR bank
            </CardTitle>
            <CardDescription>
              User-verified facts and interview stories that ground CV,
              application, and interview work — without inventing experience.
            </CardDescription>
          </CardHeader>
        </Card>

        <EvidenceWorkspace
          evidence={evidence}
          stories={stories}
          loadError={loadError}
        />
      </div>
    </main>
  );
}
