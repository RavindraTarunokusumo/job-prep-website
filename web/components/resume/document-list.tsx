import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { ResumeDocumentSummary } from "@/app/actions/resume";

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "parsed":
      return "default";
    case "failed":
      return "destructive";
    case "extracting":
    case "uploaded":
      return "secondary";
    default:
      return "outline";
  }
}

function formatStatus(status: string): string {
  return status.replace(/_/g, " ");
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  return `${(bytes / 1024).toFixed(1)} KB`;
}

type DocumentListProps = {
  documents: ResumeDocumentSummary[];
};

export function DocumentList({ documents }: DocumentListProps) {
  if (documents.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
        No resumes uploaded yet. Upload your first CV above to get started.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border rounded-xl border border-border bg-card">
      {documents.map((doc) => (
        <li key={doc.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {doc.originalFilename}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatBytes(doc.byteSize)} · {new Date(doc.createdAt).toLocaleString()}
            </p>
            {doc.status === "failed" && doc.parseError ? (
              <p className="text-xs text-destructive">{doc.parseError}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant(doc.status)} className="capitalize">
              {formatStatus(doc.status)}
            </Badge>
            {doc.status === "parsed" || doc.status === "failed" ? (
              <Link
                href={`/resume/review?id=${doc.id}`}
                className="text-sm font-semibold text-brand-blue hover:underline"
              >
                {doc.status === "failed" ? "Review / retry" : "Review"}
              </Link>
            ) : (
              <span className="text-xs text-muted-foreground">Processing…</span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}