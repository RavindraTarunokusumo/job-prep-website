"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import {
  DEFAULT_PLANS,
  shouldApplyWebhookEvent,
  sprintPassWindow,
  type PlanCode,
} from "@/lib/billing/entitlements";
import { getSubscriptionSnapshot } from "@/lib/billing/require-entitlement";
import { verifyBillingWebhookSecret } from "@/lib/billing/webhook-auth";
import { prisma } from "@/lib/prisma";

type ActionOk<T> = { ok: true } & T;
type ActionErr = { ok: false; error: string };

async function ensurePlan(code: PlanCode) {
  const def = DEFAULT_PLANS[code];
  return prisma.productPlan.upsert({
    where: { code },
    create: {
      code,
      name: def.name,
      config: def.config,
      active: true,
    },
    update: {
      name: def.name,
      config: def.config,
      active: true,
    },
  });
}

/** Activate a 30-day Sprint Pass for the current user (checkout stub). */
export async function activateSprintPassAction(): Promise<
  ActionOk<{ endsAt: string; subscriptionId: string }> | ActionErr
> {
  const user = await requireUser();
  const plan = await ensurePlan("sprint_pass");
  const now = new Date();
  const durationDays = DEFAULT_PLANS.sprint_pass.config.durationDays ?? 30;
  const { endsAt } = sprintPassWindow(now, durationDays);

  const sub = await prisma.subscription.create({
    data: {
      userId: user.id,
      planId: plan.id,
      status: "active",
      provider: "stub",
      currentPeriodStart: now,
      currentPeriodEnd: endsAt,
    },
  });

  await prisma.entitlementGrant.create({
    data: {
      userId: user.id,
      feature: "mock_interview",
      source: "sprint_pass",
      status: "active",
      startsAt: now,
      endsAt,
    },
  });

  await prisma.billingEvent.create({
    data: {
      userId: user.id,
      subscriptionId: sub.id,
      type: "checkout",
      providerEventId: `stub_checkout_${sub.id}`,
      payload: { plan: "sprint_pass" },
    },
  });

  revalidatePath("/settings");
  revalidatePath("/billing");
  return { ok: true, endsAt: endsAt.toISOString(), subscriptionId: sub.id };
}

export async function getBillingStatusAction(): Promise<
  ActionOk<{
    planCode: string;
    status: string;
    currentPeriodEnd: string | null;
  }> | ActionErr
> {
  const user = await requireUser();
  const snap = await getSubscriptionSnapshot(user.id);
  return {
    ok: true,
    planCode: snap?.planCode ?? "free",
    status: snap?.status ?? "active",
    currentPeriodEnd: snap?.currentPeriodEnd?.toISOString() ?? null,
  };
}

/**
 * Billing webhook processor (JOB-91).
 *
 * Security:
 * - Requires BILLING_WEBHOOK_SECRET match (never open to anonymous clients).
 * - Does **not** accept client-supplied userId; user is resolved only from
 *   an existing Subscription row when subscriptionId is provided.
 */
export async function processBillingWebhookAction(form: {
  providerEventId: string;
  type: string;
  /** Existing subscription id — ownership resolved from DB, not client userId. */
  subscriptionId?: string;
  /** Shared secret; must equal process.env.BILLING_WEBHOOK_SECRET. */
  secret: string;
  payload?: { [key: string]: string | number | boolean | null };
}): Promise<ActionOk<{ applied: boolean; reason: string }> | ActionErr> {
  const auth = verifyBillingWebhookSecret(
    form.secret,
    process.env.BILLING_WEBHOOK_SECRET,
  );
  if (!auth.ok) return { ok: false, error: auth.error };

  if (!form.providerEventId?.trim()) {
    return { ok: false, error: "Missing providerEventId." };
  }

  // Resolve user only from trusted subscription row.
  let userId: string | null = null;
  let subscriptionId: string | null = form.subscriptionId?.trim() || null;
  if (subscriptionId) {
    const sub = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      select: { id: true, userId: true },
    });
    if (!sub) {
      return { ok: false, error: "Unknown subscription." };
    }
    userId = sub.userId;
    subscriptionId = sub.id;
  }

  const seen = await prisma.billingEvent.findMany({
    where: { providerEventId: { not: null } },
    select: { providerEventId: true },
    take: 5000,
  });
  const seenIds = new Set(
    seen.map((e) => e.providerEventId).filter((id): id is string => Boolean(id)),
  );

  const decision = shouldApplyWebhookEvent(form.providerEventId, seenIds);
  if (!decision.apply) {
    return { ok: true, applied: false, reason: decision.reason };
  }

  await prisma.billingEvent.create({
    data: {
      userId,
      subscriptionId,
      type: form.type || "webhook",
      providerEventId: form.providerEventId,
      payload: form.payload ? (form.payload as object) : undefined,
    },
  });

  return { ok: true, applied: true, reason: decision.reason };
}
