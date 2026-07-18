import Link from "next/link";
import type { PerformanceReportDetail } from "@/app/actions/performance-report";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ReportSection } from "@/lib/validation/performance-report";

function scoreBadgeVariant(
  score: number | null | undefined
): "default" | "secondary" | "destructive" | "outline" {
  if (score == null) return "outline";
  if (score >= 75) return "default";
  if (score >= 50) return "secondary";
  return "destructive";
}

function SectionCard({ section }: { section: ReportSection }) {
  return (
    <Card
      className="shadow-sm break-inside-avoid print:shadow-none print:border print:border-border"
      data-section={section.key}
    >
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base font-semibold">
            {section.title}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            {!section.available ? (
              <Badge variant="outline">Not available</Badge>
            ) : null}
            {section.score != null ? (
              <Badge variant={scoreBadgeVariant(section.score)}>
                {section.score}/100
              </Badge>
            ) : null}
          </div>
        </div>
        {section.summary ? (
          <CardDescription className="text-sm leading-relaxed text-muted-foreground">
            {section.summary}
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {!section.available && section.emptyHint ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 px-3 py-3 text-sm text-muted-foreground">
            <p>{section.emptyHint}</p>
            {section.href ? (
              <Link
                href={section.href}
                className={cn(
                  buttonVariants({ variant: "link", size: "sm" }),
                  "mt-1 h-auto px-0 print:hidden"
                )}
              >
                Go to related workflow
              </Link>
            ) : null}
          </div>
        ) : null}

        {section.bullets.length > 0 ? (
          <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
            {section.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        ) : null}

        {section.evidence.length > 0 ? (
          <div className="rounded-md bg-muted/30 px-3 py-2">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Evidence notes
            </p>
            <ul className="list-disc space-y-0.5 pl-4 text-xs text-muted-foreground">
              {section.evidence.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {section.available && section.href ? (
          <Link
            href={section.href}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "print:hidden"
            )}
          >
            Open related page
          </Link>
        ) : null}
      </CardContent>
    </Card>
  );
}

type ReportViewProps = {
  report: PerformanceReportDetail;
};

export function ReportView({ report }: ReportViewProps) {
  const sections = report.sections?.sections ?? [];

  return (
    <article className="space-y-6 print:space-y-4">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-extrabold tracking-tight text-foreground">
            {report.title}
          </h2>
          <Badge variant="secondary">v{report.version}</Badge>
          <Badge
            variant={
              report.status === "ready"
                ? "default"
                : report.status === "failed"
                  ? "destructive"
                  : "outline"
            }
          >
            {report.status}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Generated {new Date(report.createdAt).toLocaleString()}
          {report.model ? ` · Narrative model: ${report.model}` : null}
        </p>
        {report.summary ? (
          <p className="text-sm leading-relaxed text-foreground">
            {report.summary}
          </p>
        ) : null}
        {report.status === "failed" && report.errorMessage ? (
          <p className="text-sm text-destructive" role="alert">
            {report.errorMessage}
          </p>
        ) : null}
      </header>

      {sections.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No structured sections on this report.
        </p>
      ) : (
        <div className="grid gap-4">
          {sections.map((section) => (
            <SectionCard key={section.key} section={section} />
          ))}
        </div>
      )}
    </article>
  );
}
