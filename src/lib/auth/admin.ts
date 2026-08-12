import { redirect } from "next/navigation";
import { verifySessionCookie } from "@/lib/auth/session";
import { ensureAdminUser, getUser } from "@/lib/firestore/users";
import type { User } from "@/types";

export class AuthError extends Error {
  status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

export interface SessionUser {
  uid: string;
  email: string | undefined;
  admin: boolean;
  claims: Record<string, unknown>;
  profile: User | null;
}

/**
 * Resolve the current session user (or null if unauthenticated).
 * Does not throw.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const decoded = await verifySessionCookie(true);
  if (!decoded) return null;

  const adminClaim = decoded.admin === true;
  const profile = await getUser(decoded.uid);

  return {
    uid: decoded.uid,
    email: decoded.email,
    admin: adminClaim && profile?.role === "admin",
    claims: decoded as unknown as Record<string, unknown>,
    profile,
  };
}

/**
 * Require an authenticated admin: custom claim `admin: true`
 * AND users/{uid}.role === "admin".
 *
 * Redirects to login when unauthenticated; throws 403 when unauthorized.
 */
export async function requireAdmin(options?: {
  loginPath?: string;
  unauthorizedRedirect?: string | null;
}): Promise<SessionUser> {
  const loginPath = options?.loginPath ?? "/admin/login";
  const unauthorizedRedirect = options?.unauthorizedRedirect ?? null;

  const session = await getSessionUser();

  if (!session) {
    redirect(loginPath);
  }

  const claimAdmin = session.claims.admin === true;
  if (!claimAdmin) {
    if (unauthorizedRedirect) {
      redirect(unauthorizedRedirect);
    }
    throw new AuthError("Forbidden: admin claim required", 403);
  }

  // Ensure Firestore user doc exists and is marked admin.
  const profile =
    session.profile ??
    (await ensureAdminUser({
      uid: session.uid,
      email: session.email ?? "",
      displayName: null,
      photoURL: null,
    }));

  if (profile.role !== "admin") {
    if (unauthorizedRedirect) {
      redirect(unauthorizedRedirect);
    }
    throw new AuthError("Forbidden: admin role required", 403);
  }

  return {
    ...session,
    admin: true,
    profile,
  };
}
