// Edge middleware: session gate + role-based route protection.
//
// Two separate lists on purpose (docs/DECISIONS.md D-01, D-02):
//   PUBLIC_PATHS — reachable with no session at all.
//   AUTH_PAGES   — login/signup screens a logged-in user should be bounced off.
// Collapsing them (as the starter did) would bounce a logged-in user off the
// shared public itinerary, and "/p" without the trailing slash would also match
// "/profile" and make it public.
import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

const ROLE_ROUTES: Record<string, string[]> = {
  "/admin": ["ADMIN"],
};

/** Login-ish screens: public, but pointless once you are signed in. */
const AUTH_PAGES = ["/login", "/signup", "/forgot-password", "/reset-password"];

/** Prefixes reachable with no session. Trailing slash on "/p/" is load-bearing. */
const PUBLIC_PREFIXES = [...AUTH_PAGES, "/p/"];

function isPublic(pathname: string) {
  return pathname === "/" || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  if (!session?.user) {
    if (isPublic(pathname)) return NextResponse.next();
    const login = new URL("/login", req.nextUrl);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  // Signed in: keep out of the auth screens only — public trip pages stay reachable.
  if (AUTH_PAGES.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  const role = (session.user as { role?: string }).role ?? "";
  for (const [prefix, roles] of Object.entries(ROLE_ROUTES)) {
    if (pathname.startsWith(prefix) && !roles.includes(role)) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  // API routes are excluded — they enforce auth themselves via requireRole().
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
