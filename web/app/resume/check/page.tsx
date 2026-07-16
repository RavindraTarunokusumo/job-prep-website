import Link from "next/link";
import { CheckDashboard } from "@/components/resume/check-dashboard";
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
import {
  parseResumeReviewResult,
  type ResumeReviewResult,
} from "@/lib/validation/resume-review";

type ResumeCheckPageProps = {
  searchParams: Promise<{ documentId?: string }>;
};

function parseReviewResult(data: unknown): ResumeReviewResult | null {
  if (data == null) {
    return null;
  }

  try {
    return parseResumeReviewResult(data);
  } catch {
    return null;
  }
}

export default async function ResumeCheckPage({
  searchParams,
}: ResumeCheckPageProps) {
  const user = await requireUser();
  const { documentId: requestedDocumentId } = await searchParams;

  const [profile, parsedDocuments] = await Promise.all([
    getProfileForUser(user.id),
    prisma.resumeDocument.findMany({
      where: {
        userId: user.id,
        status: "parsed",
      },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        originalFilename: true,
        updatedAt: true,
      },
    }),
  ]);

  const documentOptions = parsedDocuments.map((doc) => ({
    id: doc.id,
    originalFilename: doc.originalFilename,
    updatedAt: doc.updatedAt.toISOString(),
  }));

  const selectedDocumentId =
    requestedDocumentId &&
    documentOptions.some((doc) => doc.id === requestedDocumentId)
      ? requestedDocumentId
      : (documentOptions[0]?.id ?? null);

  const latestReviewRow = selectedDocumentId
    ? await prisma.resumeReview.findFirst({
        where: {
          userId: user.id,
          resumeDocumentId: selectedDocumentId,
        },
        orderBy: { createdAt: "desc" },
      })
    : null;

  const latestReview = latestReviewRow
    ? {
        id: latestReviewRow.id,
        status: latestReviewRow.status,
        overallScore: latestReviewRow.overallScore,
        errorMessage: latestReviewRow.errorMessage,
        createdAt: latestReviewRow.createdAt.toISOString(),
        result: parseReviewResult(latestReviewRow.result),
      }
    : null;

  return (
    <main className="min-h-screen bg-page px-6 py-12">
      <div className="mx-auto max-w-3xl">
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
              Resume checker
            </CardTitle>
            <CardDescription>
              Get scores, ATS risks, and priority actions tailored to your target
              role. Reviews are grounded in your uploaded CV — we never invent
              experience.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CheckDashboard
              documents={documentOptions}
              selectedDocumentId={selectedDocumentId}
              latestReview={latestReview}
              targetRole={profile?.targetRole ?? "Not set — complete onboarding"}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}