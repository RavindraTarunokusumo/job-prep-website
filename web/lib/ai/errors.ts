export function userFacingAiError(
  error: unknown,
  fallback = "Something went wrong. Please try again."
): string {
  if (!(error instanceof Error) || !error.message) {
    return fallback;
  }
  const msg = error.message;
  // Known app-level messages (validation, ownership) stay user-visible.
  if (
    msg.includes("OPENROUTER_API_KEY") ||
    msg.includes("not configured") ||
    msg.includes("too short") ||
    msg.includes("too long") ||
    msg.includes("Complete onboarding") ||
    msg.includes("Upload") ||
    msg.includes("parse") ||
    msg.includes("access denied") ||
    msg.includes("not found")
  ) {
    if (msg.includes("OPENROUTER_API_KEY") || msg.includes("not configured")) {
      return "AI is not configured. Add OPENROUTER_API_KEY on the server.";
    }
    return msg;
  }
  console.error("[ai]", error);
  return fallback;
}
