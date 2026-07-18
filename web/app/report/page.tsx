import Link from "next/link";
import { GenerateReportButton } from "@/components/report/generate-button";
import { ReportList } from "@/components/report/report-list";
import { ReportView } from "@/components/report/report-view";
import { Logo } from "@/components/landing/logo";
import { DisclaimerBanner } from "@/components/legal/disclaimer-banner";
import { AiConsentBanner } from "@/components/legal/ai-consent";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getPerformanceReportAction,
  listPerformanceReportsAction,
} from "@/app/actions/performance-report";
import { getProfileForUser, requireUser } from "@/lib/auth/session";
import { hasConsent } from "@/lib/legal/consent";
import { prisma } from "@/lib/prisma";
import {
  safeParsePerformanceReportSections,
  type PerformanceReportSections,
} from "@/lib/validation/performance-report";

type ReportPageProps = {
  searchParams: Promise<{ reportId?: string }>;
};

export default async function ReportPage({ searchParams }: ReportPageProps) {
  const user = await requireUser();
  const params = await searchParams;
  const reportId = params.reportId?.trim() || null;

  const [profile, aiConsentAccepted, listResult] = await Promise.all([
    getProfileForUser(user.id),
    hasConsent(user.id, "ai_processing"),
    listPerformanceReportsAction(),
  ]);

  const onboardingComplete = profile?.onboardingCompletedAt != null;
  const reports = listResult.ok ? listResult.reports : [];

  let selected =
    reportId != null
      ? await getPerformanceReportAction(reportId)
      : null;

  // Default to latest ready report when no id provided
  if ((!selected || !selected.ok) && reports.length > 0) {
    const latestReady =
      reports.find((r) => r.status === "ready") ?? reports[0];
    selected = await getPerformanceReportAction(latestReady.id);
  }

  // Lightweight latest for empty-state messaging
  let latestFromDb: {
    id: string;
    title: string;
    status: string;
    version: number;
    summary: string | null;
    sections: PerformanceReportSections | null;
    meta: unknown;
    resumeReviewId: string | null;
    jobMatchAnalysisId: string | null;
    interviewSessionId: string | null;
    preparationPlanId: string | null;
    model: string | null;
    errorMessage: string | null;
    createdAt: string;
    updatedAt: string;
  } | null = null;

  if ((!selected || !selected.ok) && reports.length === 0) {
    const row = await prisma.performanceReport.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    if (row) {
      latestFromDb = {
        id: row.id,
        title: row.title,
        status: row.status,
        version: row.version,
        summary: row.summary,
        sections: row.sections
          ? safeParsePerformanceReportSections(row.sections)
          : null,
        meta: row.meta,
        resumeReviewId: row.resumeReviewId,
        jobMatchAnalysisId: row.jobMatchAnalysisId,
        interviewSessionId: row.interviewSessionId,
        preparationPlanId: row.preparationPlanId,
        model: row.model,
        errorMessage: row.errorMessage,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      };
    }
  }

  const activeReport =
    selected && selected.ok
      ? selected.report
      : latestFromDb;

  const selectedId = activeReport?.id ?? null;

  return (
    <main className="min-h-screen bg-page px-6 py-12 print:bg-white print:px-0 print:py-4">
      <div className="mx-auto max-w-3xl print:max-w-none">
        <div className="mb-8 flex items-center justify-between gap-4 print:hidden">
          <Logo />
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-brand-blue hover:underline"
          >
            Back to dashboard
          </Link>
        </div>

        <Card className="mb-6 shadow-sm print:shadow-none print:border-0">
          <CardHeader>
            <CardTitle className="text-2xl font-extrabold tracking-tight">
              Performance report
            </CardTitle>
            <CardDescription>
              A compiled coaching snapshot across profile, resume review, job
              fit, interview practice, assessments, and prep plan progress.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <DisclaimerBanner copyKey="careerRecommendationLimits" />
            <AiConsentBanner
              initialAccepted={aiConsentAccepted}
              disclaimerKey="aiGuidanceDisclaimer"
            />
            <p className="text-xs text-muted-foreground">
              Scores and summaries are preparation signals only — not hiring
              decisions, guarantees, or employer assessments. Optional AI
              narrative requires AI consent; you can still generate a
              deterministic report without it.
            </p>

            {!onboardingComplete ? (
              <p className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                Complete{" "}
                <Link
                  href="/onboarding"
                  className="font-semibold text-brand-blue hover:underline"
                >
                  onboarding
                </Link>{" "}
                before generating a report.
              </p>
            ) : (
              <GenerateReportButton hasReports={reports.length > 0} />
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] print:grid-cols-1">
          <Card className="h-fit shadow-sm print:hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">
                Recent reports
              </CardTitle>
              <CardDescription className="text-xs">
                Prior versions are kept when you regenerate.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReportList reports={reports} selectedId={selectedId} />
            </CardContent>
          </Card>

          <Card className="shadow-sm print:shadow-none">
            <CardHeader className="print:pb-2">
              <CardTitle className="text-sm font-semibold print:text-base">
                Report detail
              </CardTitle>
              <CardDescription className="text-xs print:hidden">
                Print this page for a simple export-friendly layout.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeReport ? (
                <ReportView report={activeReport} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Generate a report to see your compiled readiness sections
                  here. Missing sources show clear placeholders with links.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
