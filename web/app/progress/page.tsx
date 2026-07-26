import Link from "next/link";
import { listProgressHistoryAction } from "@/app/actions/progress";
import { Logo } from "@/components/landing/logo";
import { ProgressWorkspace } from "@/components/progress/progress-workspace";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";

export default async function ProgressPage() {
  await requireUser();
  const history = await listProgressHistoryAction();

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

        <Card className="mb-6 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-extrabold tracking-tight">
              Readiness progress
            </CardTitle>
            <CardDescription>
              Longitudinal history and attempt comparison across CV reviews,
              interviews, assessments, and reports.
            </CardDescription>
          </CardHeader>
        </Card>

        <ProgressWorkspace
          attempts={history.ok ? history.attempts : []}
          insights={history.ok ? history.insights : []}
          partial={history.ok ? history.partial : true}
          loadError={history.ok ? null : history.error}
        />
      </div>
    </main>
  );
}
