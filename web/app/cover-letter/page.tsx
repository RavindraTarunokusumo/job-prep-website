import Link from "next/link";
import { CoverLetterWorkspace } from "@/components/cover-letter/cover-letter-workspace";
import type {
  DraftSnapshot,
  JobOption,
  ResumeOption,
} from "@/components/cover-letter/draft-editor";
import {
  DraftList,
  type DraftListItem,
} from "@/components/cover-letter/draft-list";
import { Logo } from "@/components/landing/logo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getProfileForUser, requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { coverLetterSectionsSchema } from "@/lib/validation/application-draft";

type CoverLetterPageProps = {
  searchParams: Promise<{ draftId?: string }>;
};

function parseSections(value: unknown): DraftSnapshot["sections"] {
  if (value == null) {
    return null;
  }
  const parsed = coverLetterSectionsSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export default async function CoverLetterPage({
  searchParams,
}: CoverLetterPageProps) {
  const user = await requireUser();
  const profile = await getProfileForUser(user.id);
  const { draftId: requestedDraftId } = await searchParams;

  const [parsedResumes, jobRows, draftRows] = await Promise.all([
    prisma.resumeDocument.findMany({
      where: { userId: user.id, status: "parsed" },
      orderBy: { updatedAt: "desc" },
      select: { id: true, originalFilename: true },
    }),
    prisma.jobDescription.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: { id: true, title: true, company: true },
    }),
    prisma.applicationDraft.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: {
        id: true,
        title: true,
        status: true,
        type: true,
        version: true,
        updatedAt: true,
        content: true,
        tone: true,
        length: true,
        sections: true,
        resumeDocumentId: true,
        jobDescriptionId: true,
        errorMessage: true,
      },
    }),
  ]);

  const resumes: ResumeOption[] = parsedResumes.map((doc) => ({
    id: doc.id,
    originalFilename: doc.originalFilename,
  }));

  const jobs: JobOption[] = jobRows.map((job) => ({
    id: job.id,
    title: job.title,
    company: job.company,
  }));

  const drafts: DraftListItem[] = draftRows.map((row) => ({
    id: row.id,
    title: row.title,
    status: row.status,
    type: row.type,
    version: row.version,
    updatedAt: row.updatedAt.toISOString(),
  }));

  let selectedRow =
    (requestedDraftId
      ? draftRows.find((row) => row.id === requestedDraftId)
      : null) ?? null;

  if (requestedDraftId && !selectedRow) {
    const owned = await prisma.applicationDraft.findFirst({
      where: {
        id: requestedDraftId,
        userId: user.id,
      },
      select: {
        id: true,
        title: true,
        status: true,
        type: true,
        version: true,
        updatedAt: true,
        content: true,
        tone: true,
        length: true,
        sections: true,
        resumeDocumentId: true,
        jobDescriptionId: true,
        errorMessage: true,
      },
    });
    selectedRow = owned;
  }

  if (!selectedRow && draftRows[0]) {
    selectedRow = draftRows[0];
  }

  const initialDraft: (DraftSnapshot & { type: string }) | null = selectedRow
    ? {
        id: selectedRow.id,
        title: selectedRow.title,
        content: selectedRow.content,
        status: selectedRow.status,
        type: selectedRow.type,
        tone: selectedRow.tone,
        length: selectedRow.length,
        sections: parseSections(selectedRow.sections),
        resumeDocumentId: selectedRow.resumeDocumentId,
        jobDescriptionId: selectedRow.jobDescriptionId,
        errorMessage: selectedRow.errorMessage,
        version: selectedRow.version,
      }
    : null;

  const selectedId = initialDraft?.id ?? null;

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
                Cover letter & messages
              </CardTitle>
              <CardDescription>
                Generate editable drafts grounded in your profile and resume —
                tailored to an optional job description. Always review before
                sending.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CoverLetterWorkspace
                key={selectedId ?? "new"}
                resumes={resumes}
                jobs={jobs}
                targetRole={profile?.targetRole ?? null}
                initialDraft={initialDraft}
              />
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Recent drafts
              </CardTitle>
              <CardDescription>
                Open a prior cover letter or short message to edit, regenerate,
                or copy.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DraftList drafts={drafts} selectedId={selectedId} />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
