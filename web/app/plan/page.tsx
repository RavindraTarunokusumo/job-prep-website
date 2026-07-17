import Link from "next/link";
import { Logo } from "@/components/landing/logo";
import { AiConsentBanner } from "@/components/legal/ai-consent";
import { PlanChecklist } from "@/components/plan/plan-checklist";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getMyPlanStalenessSources,
  isPlanStale,
} from "@/app/actions/prep-plan";
import { getProfileForUser, requireUser } from "@/lib/auth/session";
import { hasConsent } from "@/lib/legal/consent";
import { prisma } from "@/lib/prisma";

export default async function PlanPage() {
  const user = await requireUser();

  const [profile, activePlan, parsedResumeCount, stalenessSources, aiConsentAccepted] =
    await Promise.all([
      getProfileForUser(user.id),
      prisma.preparationPlan.findFirst({
        where: { userId: user.id, status: "active" },
        include: {
          items: {
            orderBy: { priority: "asc" },
          },
        },
      }),
      prisma.resumeDocument.count({
        where: { userId: user.id, status: "parsed" },
      }),
      getMyPlanStalenessSources(),
      hasConsent(user.id, "ai_processing"),
    ]);

  const canGenerate =
    profile?.onboardingCompletedAt != null && parsedResumeCount > 0;

  const planSnapshot = activePlan
    ? {
        id: activePlan.id,
        summary: activePlan.summary,
        status: activePlan.status,
        items: activePlan.items.map((item) => ({
          id: item.id,
          category: item.category,
          title: item.title,
          description: item.description,
          reason: item.reason,
          priority: item.priority,
          status: item.status,
          href: item.href,
        })),
      }
    : null;

  const stale = planSnapshot
    ? isPlanStale(
        {
          sourceProfileUpdatedAt: activePlan!.sourceProfileUpdatedAt,
          sourceResumeReviewId: activePlan!.sourceResumeReviewId,
          sourceJobMatchId: activePlan!.sourceJobMatchId,
        },
        stalenessSources
      )
    : false;

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

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-extrabold tracking-tight">
              Preparation plan
            </CardTitle>
            <CardDescription>
              A personalized, prioritized checklist across CV fixes, applications,
              interviews, and skill gaps — grounded in your profile and latest
              review.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AiConsentBanner
              initialAccepted={aiConsentAccepted}
              disclaimerKey="careerRecommendationLimits"
            />
            <PlanChecklist
              plan={planSnapshot}
              stale={stale}
              canGenerate={canGenerate}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}