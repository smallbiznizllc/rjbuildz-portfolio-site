import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
  type App,
  type ServiceAccount,
} from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import type { Auth } from "firebase-admin/auth";
import type { Storage } from "firebase-admin/storage";

/**
 * Server-only Firebase Admin SDK singleton.
 * Never import this module from client components.
 *
 * Emulator mode: set NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true (or FIREBASE_*_EMULATOR_HOST).
 * No service-account credentials are required against the Auth/Firestore emulators.
 * Emulators are never used on Vercel / when VERCEL=1 — production must use real credentials.
 *
 * Auth/Storage are lazy-required so public Firestore reads (posts API, post pages)
 * do not pull `firebase-admin/auth` → `jose` ESM, which breaks Vercel serverless.
 */

function useEmulators(): boolean {
  // Vercel (and similar) has no local emulators; a copied .env.local flag must not win.
  if (process.env.VERCEL === "1") return false;

  return (
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true" ||
    Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST) ||
    Boolean(process.env.FIRESTORE_EMULATOR_HOST)
  );
}

/** Strip emulator host vars so the Admin SDK cannot target localhost on Vercel. */
function clearEmulatorHosts(): void {
  delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
  delete process.env.FIRESTORE_EMULATOR_HOST;
  delete process.env.FIREBASE_STORAGE_EMULATOR_HOST;
}

function configureEmulatorHosts(): void {
  if (process.env.VERCEL === "1") {
    clearEmulatorHosts();
    return;
  }
  if (!useEmulators()) return;

  process.env.FIREBASE_AUTH_EMULATOR_HOST ||= "127.0.0.1:9099";
  process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";
  process.env.FIREBASE_STORAGE_EMULATOR_HOST ||= "127.0.0.1:9199";
}

function getPrivateKey(): string | undefined {
  const raw = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (!raw) return undefined;
  return raw.replace(/\\n/g, "\n");
}

function resolveProjectId(): string {
  return (
    process.env.FIREBASE_ADMIN_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    "demo-rjbuildz"
  );
}

/** ADC is appropriate on GCP runtimes or when a credentials file is set. */
function shouldUseApplicationDefault(): boolean {
  return Boolean(
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      process.env.K_SERVICE ||
      process.env.FUNCTION_TARGET ||
      process.env.FIREBASE_CONFIG ||
      process.env.GCLOUD_PROJECT ||
      process.env.GCP_PROJECT,
  );
}

function createAdminApp(): App {
  if (getApps().length) {
    return getApps()[0]!;
  }

  configureEmulatorHosts();

  const projectId = resolveProjectId();
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = getPrivateKey();
  const storageBucket =
    process.env.FIREBASE_ADMIN_STORAGE_BUCKET ||
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

  // Emulators accept an unauthenticated Admin app keyed by project id.
  if (useEmulators()) {
    return initializeApp({
      projectId,
      storageBucket,
    });
  }

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

  if (shouldUseApplicationDefault()) {
    return initializeApp({
      credential: applicationDefault(),
      projectId,
      storageBucket,
    });
  }

  throw new Error(
    "Firebase Admin is not configured. Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY (or enable emulators with NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true).",
  );
}

let cachedApp: App | null = null;
let cachedAuth: Auth | null = null;
let cachedDb: Firestore | null = null;
let cachedStorage: Storage | null = null;

function getAdminApp(): App {
  if (cachedApp) return cachedApp;
  if (getApps().length) {
    cachedApp = getApps()[0]!;
    return cachedApp;
  }
  cachedApp = createAdminApp();
  return cachedApp;
}

function createLazy<T extends object>(factory: () => T): T {
  let instance: T | null = null;
  return new Proxy({} as T, {
    get(_target, prop, receiver) {
      if (!instance) instance = factory();
      const value = Reflect.get(instance as object, prop, receiver);
      return typeof value === "function"
        ? (value as (...args: unknown[]) => unknown).bind(instance)
        : value;
    },
  });
}

export const adminApp: App = createLazy(() => getAdminApp());

export const adminDb: Firestore = createLazy(
  () => (cachedDb ??= getFirestore(getAdminApp())),
);

export const adminAuth: Auth = createLazy(() => {
  if (cachedAuth) return cachedAuth;
  // Lazy require avoids loading jose/jwks-rsa on public Firestore-only routes.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getAuth } = require("firebase-admin/auth") as typeof import("firebase-admin/auth");
  cachedAuth = getAuth(getAdminApp());
  return cachedAuth;
});

export const adminStorage: Storage = createLazy(() => {
  if (cachedStorage) return cachedStorage;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getStorage } = require("firebase-admin/storage") as typeof import("firebase-admin/storage");
  cachedStorage = getStorage(getAdminApp());
  return cachedStorage;
});

export { getAdminApp };
