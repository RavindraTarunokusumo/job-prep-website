import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AI_USE_PAGE,
  CONSENT_COPY_VERSION,
  LEGAL_COPY,
} from "@/lib/legal/copy";

const DISCLAIMER_SECTIONS: {
  title: string;
  body: string;
  description?: string;
}[] = [
  {
    title: "Guidance and drafts",
    description: "Applies across AI features",
    body: LEGAL_COPY.aiGuidanceDisclaimer,
  },
  {
    title: "Job-fit and match scores",
    body: LEGAL_COPY.jobFitLimitations,
  },
  {
    title: "Interview practice feedback",
    body: LEGAL_COPY.interviewFeedbackDisclaimer,
  },
  {
    title: "Practice assessments",
    body: LEGAL_COPY.assessmentNonClinical,
  },
  {
    title: "Prep plans and recommendations",
    body: LEGAL_COPY.careerRecommendationLimits,
  },
];

export default function AiUsePage() {
  return (
    <main className="min-h-screen bg-page px-6 py-16">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-8">
          <p className="font-mono text-xs font-semibold tracking-wider text-brand-purple uppercase">
            Legal · copy {CONSENT_COPY_VERSION}
          </p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground">
            {AI_USE_PAGE.title}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {AI_USE_PAGE.intro}
          </p>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>{AI_USE_PAGE.whatAiDoesTitle}</CardTitle>
            <CardDescription>
              Features that may send content to AI providers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-foreground">
              {AI_USE_PAGE.whatAiDoesBody}
            </p>
          </CardContent>
        </Card>

        <Card className="mt-6 shadow-sm">
          <CardHeader>
            <CardTitle>{AI_USE_PAGE.whatAiIsNotTitle}</CardTitle>
            <CardDescription>Limits of automated coaching</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {DISCLAIMER_SECTIONS.map((section) => (
              <div key={section.title}>
                <h2 className="text-sm font-semibold text-foreground">
                  {section.title}
                </h2>
                {section.description ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {section.description}
                  </p>
                ) : null}
                <p className="mt-1.5 text-sm leading-relaxed text-foreground">
                  {section.body}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="mt-6 shadow-sm">
          <CardHeader>
            <CardTitle>{AI_USE_PAGE.humanReviewTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed text-foreground">
              {AI_USE_PAGE.humanReviewBody}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {AI_USE_PAGE.consentNote}
            </p>
          </CardContent>
        </Card>

        <Card className="mt-6 shadow-sm">
          <CardHeader>
            <CardTitle>Related privacy notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-relaxed text-foreground">
              {LEGAL_COPY.privacySummary}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {LEGAL_COPY.dataRights}
            </p>
          </CardContent>
        </Card>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/privacy"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Privacy overview
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
