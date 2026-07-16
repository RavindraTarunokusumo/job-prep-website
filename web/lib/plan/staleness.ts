export type PlanStalenessSources = {
  profileUpdatedAt: Date | null;
  latestReviewId: string | null;
  latestMatchId: string | null;
};

export type PlanStalenessFields = {
  sourceProfileUpdatedAt: Date | null;
  sourceResumeReviewId: string | null;
  sourceJobMatchId: string | null;
};

export function isPlanStale(
  plan: PlanStalenessFields,
  sources: PlanStalenessSources
): boolean {
  if (
    plan.sourceProfileUpdatedAt != null &&
    sources.profileUpdatedAt != null &&
    plan.sourceProfileUpdatedAt.getTime() !== sources.profileUpdatedAt.getTime()
  ) {
    return true;
  }

  if (
    plan.sourceResumeReviewId != null &&
    sources.latestReviewId != null &&
    plan.sourceResumeReviewId !== sources.latestReviewId
  ) {
    return true;
  }

  if (
    plan.sourceJobMatchId != null &&
    sources.latestMatchId != null &&
    plan.sourceJobMatchId !== sources.latestMatchId
  ) {
    return true;
  }

  if (
    plan.sourceResumeReviewId == null &&
    sources.latestReviewId != null
  ) {
    return true;
  }

  if (plan.sourceJobMatchId == null && sources.latestMatchId != null) {
    return true;
  }

  return false;
}