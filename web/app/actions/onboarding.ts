"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { upsertUserFromAuth } from "@/lib/auth/upsert-user";
import {
  onboardingCookieValue,
  ONBOARDING_COOKIE,
} from "@/lib/auth/cookies";
import {
  formInputToOnboarding,
  onboardingFormSchema,
  type OnboardingFormInput,
} from "@/lib/validation/onboarding";

export type OnboardingActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

function parseFormData(formData: FormData): OnboardingFormInput {
  return {
    educationBackground: String(formData.get("educationBackground") ?? ""),
    experienceLevel: String(formData.get("experienceLevel") ?? "") as OnboardingFormInput["experienceLevel"],
    targetRole: String(formData.get("targetRole") ?? ""),
    targetIndustry: String(formData.get("targetIndustry") ?? ""),
    preferredLocation: String(formData.get("preferredLocation") ?? ""),
    jobSearchStatus: String(formData.get("jobSearchStatus") ?? "") as OnboardingFormInput["jobSearchStatus"],
    careerSwitchIntent: formData.get("careerSwitchIntent") === "on",
    skillsInput: String(formData.get("skills") ?? ""),
    certificationsInput: String(formData.get("certifications") ?? ""),
  };
}

export async function saveProfile(
  _prevState: OnboardingActionState,
  formData: FormData
): Promise<OnboardingActionState> {
  const user = await requireUser();
  await upsertUserFromAuth(user);

  const raw = parseFormData(formData);
  const parsed = onboardingFormSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] = fieldErrors[key] ?? [];
      fieldErrors[key].push(issue.message);
    }
    return { error: "Please fix the highlighted fields.", fieldErrors };
  }

  let data;
  try {
    data = formInputToOnboarding(parsed.data);
  } catch (error) {
    if (error instanceof Error && "issues" in (error as { issues?: unknown })) {
      return { error: "Please fix the highlighted fields." };
    }
    throw error;
  }

  const existing = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { onboardingCompletedAt: true },
  });

  const now = new Date();
  const onboardingCompletedAt = existing?.onboardingCompletedAt ?? now;

  await prisma.profile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      ...data,
      onboardingCompletedAt,
    },
    update: {
      ...data,
      onboardingCompletedAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(ONBOARDING_COOKIE, onboardingCookieValue(true), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  redirect("/dashboard");
}