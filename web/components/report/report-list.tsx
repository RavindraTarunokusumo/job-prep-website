import Link from "next/link";
import type { PerformanceReportListItem } from "@/app/actions/performance-report";
import { Badge } from "@/components/ui/badge";

function statusVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "ready":
      return "default";
    case "generating":
      return "secondary";
    case "failed":
      return "destructive";
    default:
      return "outline";
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

type ReportListProps = {
  reports: PerformanceReportListItem[];
  selectedId: string | null;
};

export function ReportList({ reports, selectedId }: ReportListProps) {
  if (reports.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
        No reports yet. Generate a compiled readiness report from your latest
        reviews, matches, interviews, and plan progress.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border print:hidden">
      {reports.map((report) => {
        const isActive = report.id === selectedId;
        return (
          <li key={report.id} className="py-3 first:pt-0 last:pb-0">
            <Link
              href={`/report?reportId=${report.id}`}
              className={`flex items-start justify-between gap-4 rounded-lg px-2 py-1 text-sm transition-colors hover:bg-muted/40 ${
                isActive ? "bg-muted/30 font-semibold" : ""
              }`}
            >
              <span className="min-w-0">
                <span className="block truncate">
                  {report.title || "Untitled report"}
                </span>
                <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                  v{report.version} · {formatDate(report.createdAt)}
                </span>
              </span>
              <Badge variant={statusVariant(report.status)} className="shrink-0">
                {report.status}
              </Badge>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
