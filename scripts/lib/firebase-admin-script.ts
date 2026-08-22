/**
 * Shared Firebase Admin bootstrap for CLI scripts.
 * Loads .env.local when present and respects USE_EMULATOR=true.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
  type App,
  type ServiceAccount,
} from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

export const USE_EMULATOR = process.env.USE_EMULATOR === "true";

function loadEnvLocal(): void {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;

  const content = readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvLocal();

function getPrivateKey(): string | undefined {
  const raw = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (!raw) return undefined;
  return raw.replace(/\\n/g, "\n");
}

export function resolveProjectId(): string {
  return (
    process.env.FIREBASE_ADMIN_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    (USE_EMULATOR ? "demo-rjbuildz" : "rjbuildz-portfolio")
  );
}

function configureEmulators(): void {
  if (!USE_EMULATOR) {
    delete process.env.FIRESTORE_EMULATOR_HOST;
    delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
    delete process.env.FIREBASE_STORAGE_EMULATOR_HOST;
    return;
  }

  process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";
  process.env.FIREBASE_AUTH_EMULATOR_HOST ||= "127.0.0.1:9099";
  process.env.FIREBASE_STORAGE_EMULATOR_HOST ||= "127.0.0.1:9199";
}

export function createScriptApp(): App {
  if (getApps().length) return getApps()[0]!;

  configureEmulators();
  const projectId = resolveProjectId();
  const storageBucket =
    process.env.FIREBASE_ADMIN_STORAGE_BUCKET ||
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    (USE_EMULATOR
      ? `${projectId}.appspot.com`
      : `${projectId}.firebasestorage.app`);

  console.log(
    `[firebase] target=${USE_EMULATOR ? "emulator" : "production"} project=${projectId}`,
  );

  if (USE_EMULATOR) {
    return initializeApp({ projectId, storageBucket });
  }

  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = getPrivateKey();

  if (projectId && clientEmail && privateKey) {
    const serviceAccount: ServiceAccount = {
      projectId,
      clientEmail,
      privateKey,
    };
    return initializeApp({
      credential: cert(serviceAccount),
      projectId,
      storageBucket,
    });
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return initializeApp({
      credential: applicationDefault(),
      projectId,
      storageBucket,
    });
  }

  throw new Error(
    "Missing Firebase Admin credentials. Set FIREBASE_ADMIN_* in .env.local or GOOGLE_APPLICATION_CREDENTIALS.",
  );
}

export function getScriptDb(): Firestore {
  return getFirestore(createScriptApp());
}
