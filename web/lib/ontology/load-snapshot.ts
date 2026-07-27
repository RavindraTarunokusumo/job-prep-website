import { prisma } from "@/lib/prisma";
import { buildCandidateOntologySnapshot } from "@/lib/ontology/snapshot";
import type { OntologySnapshot } from "@/lib/validation/ontology";

/**
 * Load the user's ontology rows and build a consumer snapshot (ownership-scoped).
 */
export async function loadUserOntologySnapshot(
  userId: string,
  options: { trustedOnly?: boolean } = {},
): Promise<OntologySnapshot> {
  const [skills, evidence, achievements, stories, signals, targets] =
    await Promise.all([
      prisma.skill.findMany({ where: { userId } }),
      prisma.careerEvidence.findMany({ where: { userId } }),
      prisma.achievement.findMany({ where: { userId } }),
      prisma.starStory.findMany({ where: { userId } }),
      prisma.senioritySignal.findMany({ where: { userId } }),
      prisma.targetRole.findMany({ where: { userId } }),
    ]);

  return buildCandidateOntologySnapshot({
    trustedOnly: options.trustedOnly ?? false,
    skills: skills.map((s) => ({
      id: s.id,
      userId: s.userId,
      name: s.name,
      normalizedName: s.normalizedName,
      category: (s.category as "technical" | "soft" | "domain" | "tool" | "language" | "other" | null) ?? null,
      verification: s.verification as "imported" | "inferred" | "unconfirmed" | "confirmed" | "archived",
      confidence: s.confidence,
      sourceType: s.sourceType,
      sourceId: s.sourceId,
      version: s.version,
    })),
    evidence: evidence.map((e) => ({
      id: e.id,
      userId: e.userId,
      title: e.title,
      sourceType: e.sourceType as "employment" | "education" | "volunteering" | "freelance" | "project" | "competition" | "other",
      organization: e.organization,
      roleTitle: e.roleTitle,
      startDate: e.startDate,
      endDate: e.endDate,
      responsibilities: e.responsibilities,
      achievements: e.achievements,
      metrics: e.metrics,
      verification: e.verification as "imported" | "inferred" | "unconfirmed" | "confirmed" | "archived",
      confidence: e.confidence,
      provenance:
        e.provenance && typeof e.provenance === "object" && !Array.isArray(e.provenance)
          ? (e.provenance as Record<string, unknown>)
          : null,
      sourceNote: e.sourceNote,
      version: e.version,
    })),
    achievements: achievements.map((a) => ({
      id: a.id,
      evidenceId: a.evidenceId,
      userId: a.userId,
      statement: a.statement,
      metricLabel: a.metricLabel,
      metricValue: a.metricValue,
      verification: a.verification as "imported" | "inferred" | "unconfirmed" | "confirmed" | "archived",
      confidence: a.confidence,
    })),
    stories: stories.map((s) => ({
      id: s.id,
      userId: s.userId,
      evidenceId: s.evidenceId,
      title: s.title,
      situation: s.situation,
      task: s.task,
      action: s.action,
      result: s.result,
      readiness: s.readiness as "draft" | "ready" | "archived",
      verification: s.verification as "imported" | "inferred" | "unconfirmed" | "confirmed" | "archived",
      confidence: s.confidence,
      version: s.version,
    })),
    signals: signals.map((s) => ({
      id: s.id,
      userId: s.userId,
      kind: s.kind as "years_experience" | "level_label" | "scope" | "team_size" | "other",
      value: s.value,
      verification: s.verification as "imported" | "inferred" | "unconfirmed" | "confirmed" | "archived",
      confidence: s.confidence,
      sourceType: s.sourceType,
      sourceId: s.sourceId,
    })),
    targets: targets.map((t) => ({
      id: t.id,
      userId: t.userId,
      title: t.title,
      industry: t.industry,
      priority: t.priority,
      sourceType: t.sourceType,
      isPrimary: t.isPrimary,
    })),
  });
}
