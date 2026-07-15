import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getResumeDocument } from "@/app/actions/resume";
import { ReviewForm } from "@/components/resume/review-form";
import { RetryButton } from "@/components/resume/retry-button";
import { Logo } from "@/components/landing/logo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { emptyParsedResume, type ParsedResume } from "@/lib/validation/resume";

type ResumeReviewPageProps = {
  searchParams: Promise<{ id?: string }>;
};

export default async function ResumeReviewPage({
  searchParams,
}: ResumeReviewPageProps) {
  await requireUser();
  const { id } = await searchParams;

  if (!id) {
    redirect("/resume");
  }

  const document = await getResumeDocument(id);
  if (!document) {
    notFound();
  }

  const parsedData: ParsedResume =
    document.parsedData ?? emptyParsedResume();

  return (
    <main className="min-h-screen bg-page px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Logo />
          <Link
            href="/resume"
            className="text-sm font-semibold text-brand-blue hover:underline"
          >
            Back to uploads
          </Link>
        </div>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-extrabold tracking-tight">
              Review parsed resume
            </CardTitle>
            <CardDescription>
              Correct extracted fields for{" "}
              <span className="font-medium text-foreground">
                {document.originalFilename}
              </span>
              . Saved data powers later checker and match tools.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {document.status === "failed" ? (
              <div className="flex flex-wrap items-center gap-3">
                <RetryButton documentId={document.id} />
                <p className="text-sm text-muted-foreground">
                  Or edit fields manually and save below.
                </p>
              </div>
            ) : null}
            <ReviewForm
              documentId={document.id}
              initialData={parsedData}
              status={document.status}
              parseError={document.parseError}
              rawText={document.rawText}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}