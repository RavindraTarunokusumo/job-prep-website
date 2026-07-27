import Link from "next/link";
import { ActivateSprintPassButton } from "@/components/billing/activate-sprint-pass";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSubscriptionSnapshot } from "@/lib/billing/require-entitlement";
import { DEFAULT_PLANS } from "@/lib/billing/entitlements";
import { requireUser } from "@/lib/auth/session";

export default async function BillingPage() {
  const user = await requireUser();
  const snap = await getSubscriptionSnapshot(user.id);
  const planCode = snap?.planCode ?? "free";
  const plan = DEFAULT_PLANS[planCode];

  return (
    <main className="mx-auto max-w-2xl space-y-8 px-4 py-10">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          <Link href="/dashboard" className="hover:underline">
            Dashboard
          </Link>{" "}
          / Billing
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Plan & access</h1>
        <p className="text-sm text-muted-foreground">
          Plan-based access without token balances (JOB-91). Entitlements are
          enforced on the server for protected workflows.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current plan: {plan.name}</CardTitle>
          <CardDescription>
            Status: {snap?.status ?? "active"}
            {snap?.currentPeriodEnd
              ? ` · ends ${snap.currentPeriodEnd.toISOString().slice(0, 10)}`
              : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="font-medium">Included features</p>
            <ul className="mt-1 list-inside list-disc text-muted-foreground">
              {plan.config.features.map((f) => (
                <li key={f}>{f.replace(/_/g, " ")}</li>
              ))}
            </ul>
          </div>
          {planCode !== "sprint_pass" && planCode !== "pro" ? (
            <ActivateSprintPassButton />
          ) : null}
          <p className="text-xs text-muted-foreground">
            Sprint Pass checkout is a stub for development; production will use a
            verified billing provider webhook.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
