import Link from "next/link";
import { listResumeDocuments } from "@/app/actions/resume";
import { DocumentList } from "@/components/resume/document-list";
import { UploadForm } from "@/components/resume/upload-form";
import { Logo } from "@/components/landing/logo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";

export default async function ResumePage() {
  await requireUser();
  const documents = await listResumeDocuments();

  return (
    <main className="min-h-screen bg-page px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Logo />
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-brand-blue hover:underline"
          >
            Back to dashboard
          </Link>
        </div>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-extrabold tracking-tight">
              Upload your resume
            </CardTitle>
            <CardDescription>
              Add a PDF or Word CV so we can extract structured sections for your
              preparation plan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-10">
            <UploadForm />
            {documents.some((doc) => doc.status === "parsed") ? (
              <div className="rounded-lg border border-brand-blue/20 bg-brand-blue/5 px-4 py-4">
                <p className="text-sm font-medium text-foreground">
                  Ready for AI feedback?
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Run the resume checker to see scores, ATS risks, and priority
                  actions for your target role.
                </p>
                <Link
                  href="/resume/check"
                  className="mt-3 inline-flex text-sm font-semibold text-brand-blue hover:underline"
                >
                  Open resume checker →
                </Link>
              </div>
            ) : null}
            <section className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Previous uploads
                </h2>
                <p className="text-sm text-muted-foreground">
                  Review or correct parsed data from earlier uploads.
                </p>
              </div>
              <DocumentList documents={documents} />
            </section>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}