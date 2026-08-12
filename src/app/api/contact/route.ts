import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { contactMessageSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}

function checkRateLimit(ip: string): boolean {
  const max =
    Number(process.env.CONTACT_RATE_LIMIT_PER_HOUR) || 5;
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= max) return false;
  entry.count += 1;
  return true;
}

async function sendResendEmail(payload: {
  name: string;
  email: string;
  subject?: string;
  message: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const to = process.env.CONTACT_TO_EMAIL;
  const from =
    process.env.CONTACT_FROM_EMAIL || "onboarding@resend.dev";
  if (!to) return;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: payload.email,
        subject:
          payload.subject?.trim() ||
          `Portfolio contact from ${payload.name}`,
        text: `From: ${payload.name} <${payload.email}>\n\n${payload.message}`,
      }),
    });
  } catch (error) {
    console.warn("[contact] Resend email failed (non-fatal):", error);
  }
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many messages. Please try again later." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = contactMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 },
    );
  }

  const { name, email, subject, message } = parsed.data;
  const userAgent = request.headers.get("user-agent");

  try {
    await adminDb.collection("contactMessages").add({
      name,
      email,
      subject: subject || null,
      message,
      read: false,
      createdAt: FieldValue.serverTimestamp(),
      source: "website",
      userAgent: userAgent?.slice(0, 500) ?? null,
    });
  } catch (error) {
    console.error("[contact] Failed to store message:", error);
    return NextResponse.json(
      { error: "Unable to send message right now." },
      { status: 503 },
    );
  }

  await sendResendEmail({ name, email, subject, message });

  return NextResponse.json({ ok: true });
}
