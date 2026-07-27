/**
 * Billing webhook authentication helpers (JOB-91).
 * Never accept client-supplied userId; resolve ownership from DB only.
 */

function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

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
  if (!provided || !timingSafeEqualString(provided, expected)) {
    return { ok: false, error: "Unauthorized webhook." };
  }
  return { ok: true };
}
