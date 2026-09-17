import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";

/**
 * This is a UX optimization only — NOT the real authorization boundary.
 * It only checks whether a session cookie *exists*, not whether it's
 * still valid. The authoritative check is requireAuth() / requireApiAuth()
 * (lib/auth/rbac.ts) running server-side in the page or route handler,
 * which does hit the database. Never assume a request that got past this
 * proxy is actually authenticated — every protected page and route
 * handler must call one of those itself. (This isn't just caution for
 * its own sake: CVE-2025-29927 was exactly a Next.js middleware-based
 * auth bypass, which is part of why the framework renamed this file
 * "proxy" — to stop implying it's a safe place to put auth decisions.)
 *
 * Note: as of Next.js 16, `proxy.ts` runs on the Node.js runtime by
 * default (the old `middleware.ts` ran on Edge, which couldn't reach
 * Postgres via Prisma at all). That means a real DB-backed session check
 * could live here too — deliberately left as a future improvement rather
 * than duplicating the requireAuth() logic in two places.
 */

const PROTECTED_PREFIXES = ["/dashboard"];
const AUTH_PAGES = ["/login"];

export function proxy(request: NextRequest) {
  const hasSessionCookie = request.cookies.has(SESSION_COOKIE_NAME);
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );
  if (isProtected && !hasSessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const isAuthPage = AUTH_PAGES.some((prefix) => pathname.startsWith(prefix));
  if (isAuthPage && hasSessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
