export const ONBOARDING_COOKIE = "rr_onboarding_complete";

export function onboardingCookieValue(complete: boolean): string {
  return complete ? "1" : "0";
}

export function isOnboardingCookieComplete(value: string | undefined): boolean {
  return value === "1";
}