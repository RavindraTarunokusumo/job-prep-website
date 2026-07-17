import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export type SessionListItem = {
  id: string;
  title: string | null;
  status: string;
  targetRole: string;
  startedAt: string;
  updatedAt: string;
  turnCount: number;
  answeredCount: number;
};

function statusVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "active":
      return "default";
    case "completed":
      return "secondary";
    case "abandoned":
      return "outline";
    default:
      return "outline";
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

type SessionListProps = {
  sessions: SessionListItem[];
  selectedId: string | null;
};

export function SessionList({ sessions, selectedId }: SessionListProps) {
  if (sessions.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
        No interviews yet. Start a practice session above to get going.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {sessions.map((session) => {
        const isSelected = session.id === selectedId;
        const progressLabel =
          session.turnCount > 0
            ? `${session.answeredCount}/${session.turnCount}`
            : "—";
        return (
          <li key={session.id} className="py-3 first:pt-0 last:pb-0">
            <Link
              href={`/interview?sessionId=${session.id}`}
              className={`flex items-center justify-between gap-4 rounded-lg px-2 py-1 text-sm transition-colors hover:bg-muted/40 ${
                isSelected ? "bg-muted/30 font-semibold" : ""
              }`}
            >
              <span className="min-w-0 truncate">
                <span className="block truncate">
                  {session.title || "Mock interview"}
                </span>
                <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                  {session.targetRole} · {progressLabel} answered
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                <Badge
                  variant={statusVariant(session.status)}
                  className="capitalize"
                >
                  {session.status}
                </Badge>
                {formatDate(session.startedAt)}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
