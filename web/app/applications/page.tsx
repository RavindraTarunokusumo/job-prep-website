import Link from "next/link";
import {
  getWorkspaceActionsAction,
  listApplicationsAction,
} from "@/app/actions/application";
import { ApplicationWorkspace } from "@/components/applications/application-workspace";
import { Logo } from "@/components/landing/logo";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";

export default async function ApplicationsPage() {
  await requireUser();

  const [listResult, workspaceResult] = await Promise.all([
    listApplicationsAction(),
    getWorkspaceActionsAction(),
  ]);

  const applications = listResult.ok ? listResult.applications : [];
  const overdue = workspaceResult.ok ? workspaceResult.overdue : [];
  const upcoming = workspaceResult.ok ? workspaceResult.upcoming : [];
  const loadError = !listResult.ok
    ? listResult.error
    : !workspaceResult.ok
      ? workspaceResult.error
      : null;

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
              Application workspace
            </CardTitle>
            <CardDescription>
              Manage real applications from interest through outcome. Attach
              prep work as you go; track next actions and deadlines.
            </CardDescription>
          </CardHeader>
        </Card>

        <ApplicationWorkspace
          applications={applications}
          overdue={overdue}
          upcoming={upcoming}
          loadError={loadError}
        />
      </div>
    </main>
  );
}
