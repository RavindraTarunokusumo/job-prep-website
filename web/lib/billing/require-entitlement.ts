import { prisma } from "@/lib/prisma";
import {
  checkEntitlement,
  type EntitlementDecision,
  type FeatureKey,
  type PlanCode,
  type SubscriptionSnapshot,
} from "@/lib/billing/entitlements";

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

export async function requireFeatureEntitlement(
  userId: string,
  feature: FeatureKey,
  now: Date = new Date(),
): Promise<EntitlementDecision & { ok: true } | { ok: false; error: string; decision: EntitlementDecision }> {
  const snapshot = await getSubscriptionSnapshot(userId, now);
  const decision = checkEntitlement(feature, snapshot, now);

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
      return {
        ok: true,
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

  return { ok: true, ...decision };
}
