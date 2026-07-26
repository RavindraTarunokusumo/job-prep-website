import { type NextRequest, NextResponse } from "next/server";
import {
  isOnboardingCookieComplete,
  ONBOARDING_COOKIE,
} from "@/lib/auth/cookies";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/signup",
  "/privacy",
  "/terms",
  "/ai-use",
]);

const AUTH_ONLY_PREFIXES = [
  "/dashboard",
  "/onboarding",
  "/resume",
  "/jobs",
  "/plan",
  "/cover-letter",
  "/interview",
  "/assessments",
  "/videos",
  "/report",
  "/settings",
  "/applications",
  "/evidence",
  "/progress",
  "/cv",
];

function isAuthOnlyPath(pathname: string): boolean {
  return AUTH_ONLY_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.has(pathname);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { supabaseResponse, user } = await updateSession(request);
  const onboardingComplete = isOnboardingCookieComplete(
    request.cookies.get(ONBOARDING_COOKIE)?.value
  );

  if (user && (pathname === "/login" || pathname === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = onboardingComplete ? "/dashboard" : "/onboarding";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (isAuthOnlyPath(pathname) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (
    user &&
    isAuthOnlyPath(pathname) &&
    !onboardingComplete &&
    pathname !== "/onboarding"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/onboarding";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (
    user &&
    onboardingComplete &&
    pathname === "/onboarding" &&
    !request.nextUrl.searchParams.has("edit")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (!isPublicPath(pathname) && !isAuthOnlyPath(pathname)) {
    return supabaseResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
