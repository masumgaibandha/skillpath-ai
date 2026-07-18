import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Fast, optimistic check only — presence of the session cookie, not its
 * validity. This exists purely for UX (skip the flash of protected content
 * before redirecting). It is NOT the security boundary: every protected
 * Express API route independently re-verifies the session server-side via
 * requireAuth (see server/src/middleware/requireAuth.ts), since this proxy
 * can't be trusted as the sole gate — API routes are directly reachable
 * regardless of what it decides.
 */
export function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/items/:path*"],
};
