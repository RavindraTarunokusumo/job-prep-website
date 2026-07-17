import Link from "next/link";

import {
  getAttemptAction,
  listCategories,
} from "@/app/actions/assessment";
import { AttemptWorkspace } from "@/components/assessments/attempt-workspace";
import { CategoryList } from "@/components/assessments/category-list";
import { ResultsSummary } from "@/components/assessments/results-summary";
import { Logo } from "@/components/landing/logo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";

type AssessmentsPageProps = {
  searchParams: Promise<{ attemptId?: string; view?: string }>;
};

export default async function AssessmentsPage({
  searchParams,
}: AssessmentsPageProps) {
  await requireUser();
  const { attemptId, view } = await searchParams;

  let attemptDetail = null;
  if (attemptId) {
    const loaded = await getAttemptAction(attemptId);
    if (loaded.ok) {
      attemptDetail = loaded.attempt;
    }
  }

  const showResults =
    attemptDetail != null &&
    (attemptDetail.status === "completed" || view === "results");

  const showWorkspace =
    attemptDetail != null &&
    attemptDetail.status === "in_progress" &&
    view !== "results";

  const { categories, seedHint } =
    !showWorkspace && !showResults
      ? await listCategories()
      : { categories: [], seedHint: null };

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
                Assessments practice
              </CardTitle>
              <CardDescription>
                Aptitude and situational practice with explanations —
                preparation only, not official tests.
              </CardDescription>
            </CardHeader>
          </Card>

          {showResults && attemptDetail ? (
            <ResultsSummary attempt={attemptDetail} />
          ) : null}

          {showWorkspace && attemptDetail ? (
            <AttemptWorkspace attempt={attemptDetail} />
          ) : null}

          {!showWorkspace && !showResults ? (
            <CategoryList categories={categories} seedHint={seedHint} />
          ) : null}

          {attemptId && !attemptDetail ? (
            <Card className="shadow-sm">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  That practice attempt was not found.{" "}
                  <Link
                    href="/assessments"
                    className="font-semibold text-brand-blue hover:underline"
                  >
                    Choose a category
                  </Link>
                  .
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </main>
  );
}
