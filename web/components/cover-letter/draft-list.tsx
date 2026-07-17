import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export type DraftListItem = {
  id: string;
  title: string;
  status: string;
  type: string;
  version: number;
  updatedAt: string;
};

function statusVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "draft":
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

type DraftListProps = {
  drafts: DraftListItem[];
  selectedId: string | null;
};

export function DraftList({ drafts, selectedId }: DraftListProps) {
  if (drafts.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
        No drafts yet. Generate a cover letter above to get started.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {drafts.map((draft) => {
        const isActive = draft.id === selectedId;
        return (
          <li key={draft.id} className="py-3 first:pt-0 last:pb-0">
            <Link
              href={`/cover-letter?draftId=${draft.id}`}
              className={`flex items-center justify-between gap-4 rounded-lg px-2 py-1 text-sm transition-colors hover:bg-muted/40 ${
                isActive ? "bg-muted/30 font-semibold" : ""
              }`}
            >
              <span className="min-w-0 truncate">
                {draft.title || "Untitled draft"}
                {draft.version > 1 ? (
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    v{draft.version}
                  </span>
                ) : null}
              </span>
              <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                <Badge
                  variant={statusVariant(draft.status)}
                  className="capitalize"
                >
                  {draft.status}
                </Badge>
                {formatDate(draft.updatedAt)}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
