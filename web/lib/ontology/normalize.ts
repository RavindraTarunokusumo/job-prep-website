import type { VerificationState } from "@/lib/validation/ontology";

/** Canonical skill key: trim, collapse whitespace, lower-case. */
export function normalizeSkillName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

const VERIFICATION_RANK: Record<string, number> = {
  confirmed: 5,
  unconfirmed: 4,
  imported: 3,
  inferred: 2,
  archived: 1,
};

export type SkillMergeInput = {
  id: string;
  normalizedName: string;
  verification: string;
  confidence?: number;
};

export type SkillMergePlan = {
  keepId: string;
  mergeIds: string[];
  normalizedName: string;
};

/**
 * Group skills by normalizedName and pick a survivor.
 * Prefer higher verification rank, then higher confidence, then stable id order.
 * Archived-only groups still produce a plan so callers can hard-delete dupes.
 */
export function mergeDuplicateSkills(skills: SkillMergeInput[]): SkillMergePlan[] {
  const byKey = new Map<string, SkillMergeInput[]>();
  for (const skill of skills) {
    const key = skill.normalizedName;
    const list = byKey.get(key) ?? [];
    list.push(skill);
    byKey.set(key, list);
  }

  const plans: SkillMergePlan[] = [];
  for (const [normalizedName, group] of byKey) {
    if (group.length < 2) continue;
    const sorted = [...group].sort((a, b) => {
      const rankA = VERIFICATION_RANK[a.verification] ?? 0;
      const rankB = VERIFICATION_RANK[b.verification] ?? 0;
      if (rankB !== rankA) return rankB - rankA;
      const confA = a.confidence ?? 0;
      const confB = b.confidence ?? 0;
      if (confB !== confA) return confB - confA;
      return a.id.localeCompare(b.id);
    });
    const [keep, ...rest] = sorted;
    plans.push({
      keepId: keep.id,
      mergeIds: rest.map((s) => s.id),
      normalizedName,
    });
  }
  return plans;
}

/** Confidence after an explicit user confirm action. */
export function confidenceAfterConfirm(
  verification: VerificationState,
): { verification: VerificationState; confidence: number } {
  if (verification === "archived") {
    return { verification: "archived", confidence: 0 };
  }
  return { verification: "confirmed", confidence: 1 };
}

/**
 * Map free-text profile skills into ontology create payloads (pure; no I/O).
 * Used for migration backfill planning / tests.
 */
export function planSkillsFromProfile(
  userId: string,
  skills: string[],
): { name: string; normalizedName: string; userId: string; verification: "imported" }[] {
  const seen = new Set<string>();
  const out: {
    name: string;
    normalizedName: string;
    userId: string;
    verification: "imported";
  }[] = [];
  for (const raw of skills) {
    const name = raw.trim();
    if (!name) continue;
    const normalizedName = normalizeSkillName(name);
    if (seen.has(normalizedName)) continue;
    seen.add(normalizedName);
    out.push({ name, normalizedName, userId, verification: "imported" });
  }
  return out;
}
