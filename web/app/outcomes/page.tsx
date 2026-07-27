import Link from "next/link";
import { OutcomeForm } from "@/components/outcomes/outcome-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { aggregateOutcomeInsights } from "@/lib/outcomes/insights";
import { prisma } from "@/lib/prisma";
import type { OutcomeStage } from "@/lib/validation/outcome";

export default async function OutcomesPage() {
  const user = await requireUser();
  const [jobs, rows] = await Promise.all([
    prisma.jobDescription.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 30,
      select: { id: true, title: true, company: true },
    }),
    prisma.applicationOutcome.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  const latestByKey = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    const key = row.jobDescriptionId ?? row.jobApplicationId ?? row.id;
    if (!latestByKey.has(key)) latestByKey.set(key, row);
  }
  const insights = aggregateOutcomeInsights(
    [...latestByKey.values()].map((r) => ({
      stage: r.stage as OutcomeStage,
      outcome: r.outcome,
    })),
  );

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          <Link href="/dashboard" className="hover:underline">
            Dashboard
          </Link>{" "}
          / Outcomes
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Application outcomes
        </h1>
        <p className="text-sm text-muted-foreground">
          Record stages and keep employer feedback separate from your interpretation
          (JOB-89). Rates are descriptive only — not causal.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Record outcome</CardTitle>
        </CardHeader>
        <CardContent>
          <OutcomeForm
            jobs={jobs.map((j) => ({
              id: j.id,
              label: [j.title, j.company].filter(Boolean).join(" @ ") || "Untitled job",
            }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Insights</CardTitle>
          <CardDescription>
            Sample size {latestByKey.size}. Rates withheld below 3 applications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {insights.map((i) => (
            <div key={i.label} className="rounded-md border border-border p-3">
              <p className="font-medium">
                {i.label.replace(/_/g, " ")}
                {i.rate != null ? `: ${(i.rate * 100).toFixed(0)}%` : ": —"}
              </p>
              <p className="text-muted-foreground">{i.caveat}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {rows.map((r) => (
              <li key={r.id} className="border-b border-border py-2">
                <span className="font-medium">{r.stage}</span>
                {r.outcome ? ` · ${r.outcome}` : ""}
                {r.employerFeedback ? (
                  <p className="text-muted-foreground">
                    Employer: {r.employerFeedback.slice(0, 160)}
                  </p>
                ) : null}
                {r.userInterpretation ? (
                  <p className="text-muted-foreground">
                    Your view: {r.userInterpretation.slice(0, 160)}
                  </p>
                ) : null}
              </li>
            ))}
            {rows.length === 0 ? (
              <li className="text-muted-foreground">No outcomes recorded yet.</li>
            ) : null}
          </ul>
        </CardContent>
      </Card>
    </main>
  );
}
