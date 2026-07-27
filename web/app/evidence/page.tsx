import Link from "next/link";
import {
  ConfirmEvidenceButton,
  CreateEvidenceForm,
  CreateSkillForm,
  CreateStarForm,
} from "@/components/evidence/evidence-forms";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export default async function EvidencePage() {
  const user = await requireUser();
  const [skills, evidence, stories] = await Promise.all([
    prisma.skill.findMany({
      where: { userId: user.id, verification: { not: "archived" } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.careerEvidence.findMany({
      where: { userId: user.id, verification: { not: "archived" } },
      orderBy: { updatedAt: "desc" },
      take: 50,
    }),
    prisma.starStory.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 30,
    }),
  ]);

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          <Link href="/dashboard" className="hover:underline">
            Dashboard
          </Link>{" "}
          / Evidence ontology
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Career evidence</h1>
        <p className="text-sm text-muted-foreground">
          Canonical skills, verified evidence, and STAR stories (JOB-85). Confirmed
          facts power mapping, readiness, and gap-driven interviews.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Skills</CardTitle>
            <CardDescription>Add confirmed skills for matching.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <CreateSkillForm />
            <ul className="space-y-2 text-sm">
              {skills.map((s) => (
                <li key={s.id} className="flex justify-between gap-2 border-b border-border py-1">
                  <span>{s.name}</span>
                  <span className="text-muted-foreground">{s.verification}</span>
                </li>
              ))}
              {skills.length === 0 ? (
                <li className="text-muted-foreground">No skills yet.</li>
              ) : null}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Career evidence</CardTitle>
            <CardDescription>Import or confirm real experience only.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <CreateEvidenceForm />
            <ul className="space-y-3 text-sm">
              {evidence.map((e) => (
                <li key={e.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{e.title}</p>
                      <p className="text-muted-foreground">
                        {e.organization ?? e.sourceType} · {e.verification}
                      </p>
                    </div>
                    {e.verification !== "confirmed" ? (
                      <ConfirmEvidenceButton id={e.id} />
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>STAR stories</CardTitle>
          <CardDescription>Ready, confirmed stories ground interview practice.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <CreateStarForm />
          <ul className="space-y-2 text-sm">
            {stories.map((s) => (
              <li key={s.id} className="border-b border-border py-2">
                <span className="font-medium">{s.title}</span>{" "}
                <span className="text-muted-foreground">
                  ({s.readiness} / {s.verification})
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </main>
  );
}
