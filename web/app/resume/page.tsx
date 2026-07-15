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