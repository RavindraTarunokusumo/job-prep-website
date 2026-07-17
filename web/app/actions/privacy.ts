"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { upsertUserFromAuth } from "@/lib/auth/upsert-user";
import { recordConsent } from "@/lib/legal/consent";
import { parseConsentKind } from "@/lib/validation/privacy";

export type PrivacyActionResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Record upload or AI-processing consent for the current copy version.
 */
export async function acceptConsentAction(
  kind: string
): Promise<PrivacyActionResult> {
  const user = await requireUser();
  await upsertUserFromAuth(user);

  const parsed = parseConsentKind(kind);
  if (!parsed) {
    return { ok: false, error: "Invalid consent type." };
  }

  try {
    await recordConsent(user.id, parsed);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not save consent.";
    return { ok: false, error: message };
  }

  revalidatePath("/resume");
  revalidatePath("/resume/check");
  revalidatePath("/jobs/match");
  revalidatePath("/cover-letter");
  revalidatePath("/plan");

  return { ok: true };
}
