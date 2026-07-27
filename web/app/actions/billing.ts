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
 * Stub billing webhook with idempotent provider event handling (JOB-91).
 * In production, verify signatures before calling this logic.
 */
export async function processBillingWebhookAction(form: {
  providerEventId: string;
  type: string;
  userId?: string;
  subscriptionId?: string;
  payload?: { [key: string]: string | number | boolean | null };
}): Promise<ActionOk<{ applied: boolean; reason: string }> | ActionErr> {
  // Webhooks are unauthenticated by design; only process known event shapes.
  if (!form.providerEventId?.trim()) {
    return { ok: false, error: "Missing providerEventId." };
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
    await prisma.billingEvent.create({
      data: {
        userId: form.userId ?? null,
        subscriptionId: form.subscriptionId ?? null,
        type: "webhook_duplicate",
        providerEventId: `${form.providerEventId}:dup:${Date.now()}`,
        payload: form.payload
          ? (form.payload as object)
          : { original: form.providerEventId },
      },
    }).catch(() => undefined);
    return { ok: true, applied: false, reason: decision.reason };
  }

  await prisma.billingEvent.create({
    data: {
      userId: form.userId ?? null,
      subscriptionId: form.subscriptionId ?? null,
      type: form.type || "webhook",
      providerEventId: form.providerEventId,
      payload: form.payload ? (form.payload as object) : undefined,
    },
  });

  return { ok: true, applied: true, reason: decision.reason };
}
