import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { createSessionCookie, clearSession } from "@/lib/auth/session";
import { ensureAdminUser, getUser } from "@/lib/firestore/users";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { idToken?: string };
    const idToken = body.idToken?.trim();

    if (!idToken) {
      return NextResponse.json(
        { error: "ID token is required" },
        { status: 400 },
      );
    }

    const decoded = await adminAuth.verifyIdToken(idToken, true);
    let claimAdmin = decoded.admin === true;
    const profile = await getUser(decoded.uid);
    const roleAdmin = profile?.role === "admin";

    if (!claimAdmin && !roleAdmin) {
      return NextResponse.json(
        { error: "Forbidden: admin access required" },
        { status: 403 },
      );
    }

    if (decoded.email) {
      await ensureAdminUser({
        uid: decoded.uid,
        email: decoded.email,
        displayName: decoded.name ?? null,
        photoURL: decoded.picture ?? null,
      });
    }

    // If Firestore role is admin but the ID token lacks the claim, the client
    // must refresh after ensureAdminUser sets custom claims.
    if (!claimAdmin) {
      const refreshed = await adminAuth.getUser(decoded.uid);
      claimAdmin = refreshed.customClaims?.admin === true;
      if (!claimAdmin) {
        return NextResponse.json(
          { error: "Forbidden: admin claim required" },
          { status: 403 },
        );
      }
      return NextResponse.json(
        {
          error: "Admin claim was just granted. Please sign in again.",
          code: "CLAIMS_REFRESH_REQUIRED",
        },
        { status: 409 },
      );
    }

    await createSessionCookie(idToken);

    return NextResponse.json({
      ok: true,
      uid: decoded.uid,
      email: decoded.email ?? null,
    });
  } catch (error) {
    console.error("POST /api/auth/session failed:", error);
    return NextResponse.json(
      { error: "Unable to create session" },
      { status: 401 },
    );
  }
}

export async function DELETE() {
  try {
    await clearSession();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/auth/session failed:", error);
    return NextResponse.json(
      { error: "Unable to clear session" },
      { status: 500 },
    );
  }
}
