import { prisma } from "@/lib/prisma";
import {
  checkEntitlement,
  type EntitlementDecision,
  type FeatureKey,
  type PlanCode,
  type SubscriptionSnapshot,
} from "@/lib/billing/entitlements";
import {
  fairUseLimitFor,
  featureToWorkflow,
  isWithinFairUse,
  utcDayStart,
} from "@/lib/billing/fair-use";

/**
 * Load the user's active subscription (if any) and run server-side entitlement check.
 * Always call from server actions — never trust the client.
 */
export async function getSubscriptionSnapshot(
  userId: string,
  now: Date = new Date(),
): Promise<SubscriptionSnapshot | null> {
  const sub = await prisma.subscription.findFirst({
    where: {
      userId,
      status: { in: ["active", "past_due"] },
    },
    orderBy: { updatedAt: "desc" },
    include: { plan: true },
  });
  if (!sub) return null;

  const planCode = (sub.plan.code as PlanCode) || "free";
  let status = sub.status as SubscriptionSnapshot["status"];
  if (
    sub.currentPeriodEnd &&
    sub.currentPeriodEnd <= now &&
    status === "active"
  ) {
    status = "expired";
  }

  return {
    planCode,
    status,
    currentPeriodEnd: sub.currentPeriodEnd,
  };
}

async function countUsageToday(
  userId: string,
  feature: FeatureKey,
  dayStart: Date,
): Promise<number> {
  // Mock interviews include gap-driven (non-AI) starts — count sessions.
  if (feature === "mock_interview") {
    return prisma.interviewSession.count({
      where: { userId, startedAt: { gte: dayStart } },
    });
  }

  const workflow = featureToWorkflow(feature);
  if (workflow) {
    return prisma.aiUsageEvent.count({
      where: {
        userId,
        workflow,
        success: true,
        createdAt: { gte: dayStart },
      },
    });
  }
  return 0;
}

export async function requireFeatureEntitlement(
  userId: string,
  feature: FeatureKey,
  now: Date = new Date(),
): Promise<
  | (EntitlementDecision & { ok: true; fairUseRemaining: number | null })
  | { ok: false; error: string; decision: EntitlementDecision }
> {
  const snapshot = await getSubscriptionSnapshot(userId, now);
  let decision = checkEntitlement(feature, snapshot, now);
  const planCode: PlanCode = decision.planCode;

  // Active EntitlementGrant rows can unlock a feature beyond plan defaults.
  if (!decision.allowed) {
    const grant = await prisma.entitlementGrant.findFirst({
      where: {
        userId,
        feature,
        status: "active",
        OR: [{ endsAt: null }, { endsAt: { gt: now } }],
      },
    });
    if (grant) {
      decision = {
        allowed: true,
        reason: "entitlement_grant",
        planCode: decision.planCode,
        feature,
        expiresAt: grant.endsAt,
      };
    }
  }

  if (!decision.allowed) {
    return {
      ok: false,
      error: `Your current plan (${decision.planCode}) does not include ${feature}. Upgrade or activate a Sprint Pass.`,
      decision,
    };
  }

  // Fair-use daily limits from plan config (JOB-91).
  const limit = fairUseLimitFor(planCode, feature);
  if (limit != null) {
    const used = await countUsageToday(userId, feature, utcDayStart(now));
    const fair = isWithinFairUse(used, limit);
    if (!fair.allowed) {
      return {
        ok: false,
        error: `Daily fair-use limit reached for ${feature} (${limit}/day on ${planCode}). Try again tomorrow or upgrade.`,
        decision: {
          ...decision,
          allowed: false,
          reason: fair.reason,
        },
      };
    }
    return { ok: true, ...decision, fairUseRemaining: fair.remaining };
  }

  return { ok: true, ...decision, fairUseRemaining: null };
}
