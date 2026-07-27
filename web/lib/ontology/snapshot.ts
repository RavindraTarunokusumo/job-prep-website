import {
  ontologySnapshotSchema,
  type AchievementRecord,
  type CareerEvidenceRecord,
  type OntologySnapshot,
  type SenioritySignalRecord,
  type SkillRecord,
  type StarStoryRecord,
  type TargetRoleRecord,
} from "@/lib/validation/ontology";
import { getActiveSkills, getReadyStarStories, getTrustedEvidence } from "./retrieval";

export type SnapshotInput = {
  skills?: SkillRecord[];
  evidence?: CareerEvidenceRecord[];
  achievements?: AchievementRecord[];
  stories?: StarStoryRecord[];
  signals?: SenioritySignalRecord[];
  targets?: TargetRoleRecord[];
  /** ISO timestamp; defaults to now. */
  generatedAt?: string;
  /**
   * When true, snapshot.evidence is trusted-only and stories are ready+confirmed.
   * When false (default), include all non-archived rows for workspace editing views.
   */
  trustedOnly?: boolean;
};

/**
 * Build a consumer-facing ontology snapshot for matching, readiness, interviews.
 * Validates shape via zod so downstream JOB-86+ can rely on contracts.
 */
export function buildCandidateOntologySnapshot(input: SnapshotInput): OntologySnapshot {
  const skills = input.skills ?? [];
  const evidence = input.evidence ?? [];
  const achievements = input.achievements ?? [];
  const stories = input.stories ?? [];
  const signals = input.signals ?? [];
  const targets = input.targets ?? [];

  const filtered = input.trustedOnly
    ? {
        skills: getActiveSkills(skills).filter((s) => s.verification === "confirmed"),
        evidence: getTrustedEvidence(evidence),
        achievements: getTrustedEvidence(achievements),
        stories: getReadyStarStories(stories, { includeUnconfirmed: false }),
        signals: getTrustedEvidence(signals),
        targets,
      }
    : {
        skills: getActiveSkills(skills),
        evidence: evidence.filter((e) => e.verification !== "archived"),
        achievements: achievements.filter((a) => a.verification !== "archived"),
        stories: stories.filter((s) => s.readiness !== "archived"),
        signals: signals.filter((s) => s.verification !== "archived"),
        targets,
      };

  return ontologySnapshotSchema.parse({
    ...filtered,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
  });
}
