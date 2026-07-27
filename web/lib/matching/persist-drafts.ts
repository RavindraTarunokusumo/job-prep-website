import type { RequirementMatchDraft } from "@/lib/validation/requirement-match";

export type ExistingMatchRow = {
  requirementKey: string;
  userReview: string;
};

/**
 * Filter mapper drafts so we never create a second row for keys the user already
 * confirmed/replaced. Suggested/rejected keys may be re-suggested.
 */
export function filterDraftsForRemap(
  drafts: RequirementMatchDraft[],
  existing: ExistingMatchRow[],
): RequirementMatchDraft[] {
  const locked = new Set(
    existing
      .filter((e) => e.userReview === "confirmed" || e.userReview === "replaced")
      .map((e) => e.requirementKey),
  );
  return drafts.filter((d) => !locked.has(d.requirementKey));
}

/** Keys that should be deleted before re-insert (only non-locked reviews). */
export function remapDeleteReviews(): Array<"suggested" | "rejected"> {
  return ["suggested", "rejected"];
}
