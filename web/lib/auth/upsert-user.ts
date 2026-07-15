import { prisma } from "@/lib/prisma";
import {
  hasCompletedOnboarding,
  type SessionUser,
} from "@/lib/auth/session";
import {
  onboardingCookieValue,
  ONBOARDING_COOKIE,
} from "@/lib/auth/cookies";
import { cookies } from "next/headers";

export async function upsertUserFromAuth(user: SessionUser): Promise<void> {
  await prisma.user.upsert({
    where: { id: user.id },
    create: {
      id: user.id,
      email: user.email,
    },
    update: {
      email: user.email,
    },
  });
}

/** Set onboarding gate cookie. Call only from Server Actions or Route Handlers. */
export async function syncOnboardingCookie(userId: string): Promise<void> {
  const complete = await hasCompletedOnboarding(userId);
  const cookieStore = await cookies();
  cookieStore.set(ONBOARDING_COOKIE, onboardingCookieValue(complete), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}