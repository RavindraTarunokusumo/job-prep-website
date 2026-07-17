import { CONSENT_COPY_VERSION } from "@/lib/legal/copy";
import { prisma } from "@/lib/prisma";
import type { ConsentKind } from "@/lib/validation/privacy";

export type ConsentCheckResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Whether the user has accepted this consent kind for the current copy version.
 */
export async function hasConsent(
  userId: string,
  kind: ConsentKind
): Promise<boolean> {
  const row = await prisma.userConsent.findUnique({
    where: {
      userId_kind_version: {
        userId,
        kind,
        version: CONSENT_COPY_VERSION,
      },
    },
    select: { id: true },
  });
  return row != null;
}

/**
 * Record (or refresh) consent for the current copy version.
 */
export async function recordConsent(
  userId: string,
  kind: ConsentKind
): Promise<void> {
  await prisma.userConsent.upsert({
    where: {
      userId_kind_version: {
        userId,
        kind,
        version: CONSENT_COPY_VERSION,
      },
    },
    create: {
      userId,
      kind,
      version: CONSENT_COPY_VERSION,
    },
    update: {
      acceptedAt: new Date(),
    },
  });
}

/**
 * Gate for AI generate paths. Early-return shape matches action Result types.
 */
export async function requireAiConsent(
  userId: string
): Promise<ConsentCheckResult> {
  if (await hasConsent(userId, "ai_processing")) {
    return { ok: true };
  }
  return {
    ok: false,
    error:
      "Accept AI processing consent on this page before running AI analysis.",
  };
}
