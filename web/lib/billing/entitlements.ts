import { z } from "zod";

export const planCodes = ["free", "sprint_pass", "pro", "org"] as const;
export type PlanCode = (typeof planCodes)[number];

export const featureKeys = [
  "resume_review",
  "job_match",
  "mock_interview",
  "cv_rewrite",
  "unlimited_match",
  "performance_report",
] as const;
export type FeatureKey = (typeof featureKeys)[number];

export const planConfigSchema = z.object({
  features: z.array(z.enum(featureKeys)),
  durationDays: z.number().int().positive().nullable(),
  priceCents: z.number().int().min(0).nullable(),
  fairUsePerDay: z.record(z.string(), z.number().int().positive()).optional(),
});

export type PlanConfig = z.infer<typeof planConfigSchema>;

/** Configuration-driven plans (not scattered feature flags). */
export const DEFAULT_PLANS: Record<PlanCode, { name: string; config: PlanConfig }> = {
  free: {
    name: "Free",
    config: {
      // Core prep workflows stay available; fair-use limits apply at action layer.
      features: [
        "resume_review",
        "job_match",
        "mock_interview",
        "performance_report",
      ],
      durationDays: null,
      priceCents: 0,
      fairUsePerDay: {
        resume_review: 3,
        job_match: 5,
        mock_interview: 3,
      },
    },
  },
  sprint_pass: {
    name: "Sprint Pass",
    config: {
      features: [
        "resume_review",
        "job_match",
        "mock_interview",
        "cv_rewrite",
        "performance_report",
      ],
      durationDays: 30,
      priceCents: 2900,
      fairUsePerDay: { mock_interview: 20 },
    },
  },
  pro: {
    name: "Pro",
    config: {
      features: [
        "resume_review",
        "job_match",
        "mock_interview",
        "cv_rewrite",
        "unlimited_match",
        "performance_report",
      ],
      durationDays: null,
      priceCents: 4900,
    },
  },
  org: {
    name: "Organisation",
    config: {
      features: [
        "resume_review",
        "job_match",
        "mock_interview",
        "cv_rewrite",
        "unlimited_match",
        "performance_report",
      ],
      durationDays: null,
      priceCents: null,
    },
  },
};

export type EntitlementDecision = {
  allowed: boolean;
  reason: string;
  planCode: PlanCode;
  feature: FeatureKey;
  expiresAt: Date | null;
};

export type SubscriptionSnapshot = {
  planCode: PlanCode;
  status: "active" | "past_due" | "canceled" | "expired";
  currentPeriodEnd: Date | null;
};

/**
 * Server-side entitlement check. Client cannot bypass — always call from actions.
 * No token balances are exposed.
 *
 * MVP: plan features only. Callers should also enforce EntitlementGrant rows and
 * fairUsePerDay counters at the action layer when those tables are populated.
 */
export function checkEntitlement(
  feature: FeatureKey,
  subscription: SubscriptionSnapshot | null,
  now: Date = new Date(),
): EntitlementDecision {
  const planCode: PlanCode =
    subscription &&
    subscription.status === "active" &&
    (!subscription.currentPeriodEnd || subscription.currentPeriodEnd > now)
      ? subscription.planCode
      : "free";

  const plan = DEFAULT_PLANS[planCode];
  const allowed = plan.config.features.includes(feature);

  if (
    subscription?.status === "active" &&
    subscription.currentPeriodEnd &&
    subscription.currentPeriodEnd <= now
  ) {
    return {
      allowed: DEFAULT_PLANS.free.config.features.includes(feature),
      reason: "subscription_expired",
      planCode: "free",
      feature,
      expiresAt: subscription.currentPeriodEnd,
    };
  }

  return {
    allowed,
    reason: allowed ? "entitled" : "plan_lacks_feature",
    planCode,
    feature,
    expiresAt: subscription?.currentPeriodEnd ?? null,
  };
}

/** Sprint Pass activation window. */
export function sprintPassWindow(
  startsAt: Date,
  durationDays = 30,
): { startsAt: Date; endsAt: Date } {
  const endsAt = new Date(startsAt.getTime());
  endsAt.setUTCDate(endsAt.getUTCDate() + durationDays);
  return { startsAt, endsAt };
}

/**
 * Idempotent webhook handling: duplicate provider event ids must not double-apply.
 */
export function shouldApplyWebhookEvent(
  providerEventId: string,
  seenEventIds: Set<string>,
): { apply: boolean; reason: string } {
  if (!providerEventId) {
    return { apply: false, reason: "missing_event_id" };
  }
  if (seenEventIds.has(providerEventId)) {
    return { apply: false, reason: "duplicate" };
  }
  return { apply: true, reason: "new" };
}

export function applyPlanChange(
  current: SubscriptionSnapshot,
  nextPlan: PlanCode,
  now: Date = new Date(),
): SubscriptionSnapshot {
  const duration = DEFAULT_PLANS[nextPlan].config.durationDays;
  return {
    planCode: nextPlan,
    status: "active",
    currentPeriodEnd:
      duration != null
        ? sprintPassWindow(now, duration).endsAt
        : current.currentPeriodEnd,
  };
}
