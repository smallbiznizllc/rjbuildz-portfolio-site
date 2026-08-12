import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase/admin";

export const SESSION_COOKIE_NAME =
  process.env.SESSION_COOKIE_NAME || "__session";

const DEFAULT_MAX_AGE = 60 * 60 * 24 * 5; // 5 days

function getSessionMaxAge(): number {
  const parsed = Number(process.env.SESSION_COOKIE_MAX_AGE);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_AGE;
}

function isSecureCookie(): boolean {
  if (process.env.SESSION_COOKIE_SECURE === "false") return false;
  if (process.env.SESSION_COOKIE_SECURE === "true") return true;
  return process.env.NODE_ENV === "production";
}

/**
 * Exchange a Firebase ID token for an HTTP-only session cookie.
 */
export async function createSessionCookie(idToken: string): Promise<string> {
  const expiresInMs = getSessionMaxAge() * 1000;
  const sessionCookie = await adminAuth.createSessionCookie(idToken, {
    expiresIn: expiresInMs,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
    httpOnly: true,
    secure: isSecureCookie(),
    sameSite: "lax",
    path: "/",
    maxAge: getSessionMaxAge(),
  });

  return sessionCookie;
}

/**
 * Verify the session cookie and return decoded claims (includes custom claims).
 */
export async function verifySessionCookie(checkRevoked = true) {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!session) return null;

  try {
    return await adminAuth.verifySessionCookie(session, checkRevoked);
  } catch {
    return null;
  }
}

/**
 * Clear the session cookie (logout).
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: isSecureCookie(),
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getSessionCookieValue(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value;
}
