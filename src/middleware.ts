import { NextResponse, type NextRequest } from "next/server";

/**
 * Protect /admin/* except /admin/login.
 *
 * Edge middleware cannot use firebase-admin. We:
 *  1. Require a session cookie to be present
 *  2. Soft-decode the JWT payload for a fast admin claim check (UX gate)
 *
 * Cryptographic verification + users/{uid}.role === "admin" happens in
 * requireAdmin() / verifySessionCookie() on the Node.js server.
 */

const SESSION_COOKIE_NAME =
  process.env.SESSION_COOKIE_NAME || "__session";

function decodeJwtPayload(
  token: string,
): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1]!;
    const padded = payload
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(payload.length / 4) * 4, "=");
    const json =
      typeof atob === "function"
        ? atob(padded)
        : Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  if (
    pathname === "/admin/login" ||
    pathname.startsWith("/admin/login/") ||
    pathname === "/admin/unauthorized" ||
    pathname.startsWith("/admin/unauthorized/")
  ) {
    return NextResponse.next();
  }

  const session = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!session) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const payload = decodeJwtPayload(session);
  if (!payload || payload.admin !== true) {
    const unauthorizedUrl = new URL("/admin/unauthorized", request.url);
    return NextResponse.redirect(unauthorizedUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
