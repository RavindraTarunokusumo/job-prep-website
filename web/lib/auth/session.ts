import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export type SessionUser = {
  id: string;
  email: string;
};

export async function getUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
  };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function hasCompletedOnboarding(userId: string): Promise<boolean> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { onboardingCompletedAt: true },
  });
  return profile?.onboardingCompletedAt != null;
}

export async function getProfileForUser(userId: string) {
  return prisma.profile.findUnique({
    where: { userId },
  });
}