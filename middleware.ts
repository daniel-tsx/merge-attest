import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { isDatabaseConfigured, isProduction } from "@/lib/env";

const publicPaths = ["/sign-in", "/sign-up"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return NextResponse.next();
  }

  // Preserve the local MVP demo when a developer has not configured Postgres.
  if (!isProduction() && !isDatabaseConfigured()) {
    return NextResponse.next();
  }

  const sessionCookie = getSessionCookie(request.headers);
  if (sessionCookie) return NextResponse.next();

  const signInUrl = request.nextUrl.clone();
  signInUrl.pathname = "/sign-in";
  signInUrl.searchParams.set("callbackUrl", `${pathname}${request.nextUrl.search}`);

  return NextResponse.redirect(signInUrl);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
