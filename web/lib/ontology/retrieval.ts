import { isTrustedVerification } from "@/lib/validation/ontology";

type WithVerification = { verification: string };
type WithReadiness = { readiness: string; verification?: string };

/**
 * Facts safe for grounding CV rewrites and interview answers.
 * Only confirmed; never inferred or imported without user confirm.
 */
export function getTrustedEvidence<T extends WithVerification>(items: T[]): T[] {
  return items.filter((item) => isTrustedVerification(item.verification));
}

/**
 * STAR stories ready for practice: readiness=ready and not archived verification.
 * Prefer confirmed; allow unconfirmed ready stories only when includeUnconfirmed=true.
 */
export function getReadyStarStories<T extends WithReadiness>(
  items: T[],
  options: { includeUnconfirmed?: boolean } = {},
): T[] {
  const { includeUnconfirmed = false } = options;
  return items.filter((item) => {
    if (item.readiness !== "ready") return false;
    if (item.verification === "archived" || item.verification === "inferred") {
      return false;
    }
    if (item.verification === "confirmed") return true;
    if (includeUnconfirmed && (item.verification === "unconfirmed" || item.verification === "imported" || item.verification === undefined)) {
      return true;
    }
    return false;
  });
}

/** Skills eligible for matching (exclude archived). */
export function getActiveSkills<T extends WithVerification>(items: T[]): T[] {
  return items.filter((item) => item.verification !== "archived");
}
