"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { upsertUserFromAuth, syncOnboardingCookie } from "@/lib/auth/upsert-user";
import { hasCompletedOnboarding } from "@/lib/auth/session";
import { ONBOARDING_COOKIE } from "@/lib/auth/cookies";

export type AuthActionState = {
  error?: string;
};

function authErrorMessage(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("email not confirmed")) {
    return "Please confirm your email before signing in. Check your inbox for the confirmation link.";
  }
  if (lower.includes("invalid login credentials")) {
    return "Invalid email or password.";
  }
  if (lower.includes("user already registered")) {
    return "An account with this email already exists. Try signing in instead.";
  }
  return message;
}

export async function signUp(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: authErrorMessage(error.message) };
  }

  if (!data.user) {
    return { error: "Unable to create account. Please try again." };
  }

  if (!data.session) {
    return {
      error:
        "Account created. Please confirm your email before continuing, then sign in.",
    };
  }

  await upsertUserFromAuth({ id: data.user.id, email: data.user.email! });
  await syncOnboardingCookie(data.user.id);
  redirect("/onboarding");
}

export async function signIn(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "").trim();

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: authErrorMessage(error.message) };
  }

  if (!data.user?.email) {
    return { error: "Unable to sign in. Please try again." };
  }

  await upsertUserFromAuth({ id: data.user.id, email: data.user.email });
  await syncOnboardingCookie(data.user.id);

  const complete = await hasCompletedOnboarding(data.user.id);
  if (next && complete && next.startsWith("/") && !next.startsWith("//")) {
    redirect(next);
  }
  redirect(complete ? "/dashboard" : "/onboarding");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const cookieStore = await cookies();
  cookieStore.delete(ONBOARDING_COOKIE);
  redirect("/login");
}