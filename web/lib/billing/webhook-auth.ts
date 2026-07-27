/**
 * Billing webhook authentication helpers (JOB-91).
 * Never accept client-supplied userId; resolve ownership from DB only.
 */

export function verifyBillingWebhookSecret(
  provided: string | null | undefined,
  expected: string | null | undefined,
): { ok: true } | { ok: false; error: string } {
  if (!expected || expected.trim() === "") {
    return {
      ok: false,
      error: "Billing webhook is not configured (missing BILLING_WEBHOOK_SECRET).",
    };
  }
  if (!provided || provided !== expected) {
    return { ok: false, error: "Unauthorized webhook." };
  }
  return { ok: true };
}
