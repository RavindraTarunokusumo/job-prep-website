import type { FeatureKey, PlanCode } from "@/lib/billing/entitlements";
import { DEFAULT_PLANS } from "@/lib/billing/entitlements";

/** Map product features to AiUsageEvent.workflow tags used by openrouter. */
export function featureToWorkflow(feature: FeatureKey): string | null {
  switch (feature) {
    case "resume_review":
      return "resume_review";
    case "job_match":
      return "job_match";
    case "mock_interview":
      return "mock_interview";
    case "cv_rewrite":
      return "cv_rewrite";
    case "performance_report":
      return "performance_report";
    case "unlimited_match":
      return null;
    default:
      return null;
  }
}

export function fairUseLimitFor(
  planCode: PlanCode,
  feature: FeatureKey,
): number | null {
  const limit = DEFAULT_PLANS[planCode].config.fairUsePerDay?.[feature];
  return typeof limit === "number" && limit > 0 ? limit : null;
}

/**
 * Pure fair-use gate: allow when under the configured daily limit.
 * Unlimited (null limit) always passes.
 */
export function isWithinFairUse(
  usageCountToday: number,
  limit: number | null,
): { allowed: boolean; reason: string; remaining: number | null } {
  if (limit == null) {
    return { allowed: true, reason: "no_fair_use_limit", remaining: null };
  }
  if (usageCountToday >= limit) {
    return {
      allowed: false,
      reason: "fair_use_exceeded",
      remaining: 0,
    };
  }
  return {
    allowed: true,
    reason: "within_fair_use",
    remaining: limit - usageCountToday,
  };
}

export function utcDayStart(now: Date = new Date()): Date {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}
