import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth/session";

export async function POST() {
  try {
    await clearSession();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/auth/logout failed:", error);
    return NextResponse.json({ error: "Unable to logout" }, { status: 500 });
  }
}
