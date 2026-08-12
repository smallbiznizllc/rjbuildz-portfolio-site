import {
  FieldValue,
  Timestamp,
  type DocumentData,
} from "firebase-admin/firestore";
import { adminAuth } from "@/lib/firebase/admin";
import { adminDb } from "@/lib/firebase/admin";
import type { User, UserRole } from "@/types";

const USERS = "users";

function toDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date(0);
}

export function mapUserDoc(uid: string, data: DocumentData): User {
  return {
    uid,
    email: String(data.email ?? ""),
    displayName: data.displayName != null ? String(data.displayName) : null,
    photoURL: data.photoURL != null ? String(data.photoURL) : null,
    role: (data.role as UserRole) === "admin" ? "admin" : "user",
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export async function getUser(uid: string): Promise<User | null> {
  const doc = await adminDb.collection(USERS).doc(uid).get();
  if (!doc.exists) return null;
  return mapUserDoc(doc.id, doc.data()!);
}

export interface EnsureAdminUserInput {
  uid: string;
  email: string;
  displayName?: string | null;
  photoURL?: string | null;
}

/**
 * Ensure Auth custom claim `admin: true` and users/{uid}.role === "admin".
 * Idempotent — safe to call on each privileged request.
 */
export async function ensureAdminUser(
  input: EnsureAdminUserInput,
): Promise<User> {
  const ref = adminDb.collection(USERS).doc(input.uid);
  const existing = await ref.get();

  if (!existing.exists) {
    await ref.set({
      email: input.email,
      displayName: input.displayName ?? null,
      photoURL: input.photoURL ?? null,
      role: "admin",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  } else {
    const data = existing.data()!;
    const updates: DocumentData = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (data.role !== "admin") updates.role = "admin";
    if (input.email && data.email !== input.email) updates.email = input.email;
    if (input.displayName !== undefined) {
      updates.displayName = input.displayName;
    }
    if (input.photoURL !== undefined) {
      updates.photoURL = input.photoURL;
    }

    if (Object.keys(updates).length > 1) {
      await ref.update(updates);
    }
  }

  // Keep Auth custom claims in sync with Firestore role.
  const userRecord = await adminAuth.getUser(input.uid);
  if (userRecord.customClaims?.admin !== true) {
    await adminAuth.setCustomUserClaims(input.uid, {
      ...(userRecord.customClaims ?? {}),
      admin: true,
    });
  }

  const refreshed = await ref.get();
  return mapUserDoc(refreshed.id, refreshed.data()!);
}
