import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import {
  connectFirestoreEmulator,
  getFirestore,
  type Firestore,
} from "firebase/firestore";
import {
  connectStorageEmulator,
  getStorage,
  type FirebaseStorage,
} from "firebase/storage";
import {
  getFirebasePublicConfig,
  useFirebaseEmulators,
} from "@/lib/firebase/config";

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;
let emulatorsConnected = false;

function getClientApp(): FirebaseApp {
  if (app) return app;
  app = getApps().length ? getApp() : initializeApp(getFirebasePublicConfig());
  return app;
}

async function maybeInitAppCheck(firebaseApp: FirebaseApp) {
  const siteKey = process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY;
  if (!siteKey || typeof window === "undefined") return;

  try {
    const { initializeAppCheck, ReCaptchaV3Provider } = await import(
      "firebase/app-check"
    );
    initializeAppCheck(firebaseApp, {
      provider: new ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (error) {
    console.warn("Firebase App Check failed to initialize:", error);
  }
}

function ensureEmulators() {
  if (!useFirebaseEmulators || emulatorsConnected) return;
  if (typeof window === "undefined") return;

  // Lazily materialize singletons so any accessor can trigger emulator wiring.
  auth ??= getAuth(getClientApp());
  db ??= getFirestore(getClientApp());
  storage ??= getStorage(getClientApp());

  connectAuthEmulator(auth, "http://127.0.0.1:9099", {
    disableWarnings: true,
  });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  connectStorageEmulator(storage, "127.0.0.1", 9199);
  emulatorsConnected = true;
}

export function getFirebaseApp(): FirebaseApp {
  const firebaseApp = getClientApp();
  void maybeInitAppCheck(firebaseApp);
  return firebaseApp;
}

export function getClientAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
  }
  ensureEmulators();
  return auth;
}

export function getClientDb(): Firestore {
  if (!db) {
    db = getFirestore(getFirebaseApp());
  }
  ensureEmulators();
  return db;
}

export function getClientStorage(): FirebaseStorage {
  if (!storage) {
    storage = getStorage(getFirebaseApp());
  }
  ensureEmulators();
  return storage;
}

/** Convenience singleton accessors used by client components. */
export const firebaseClient = {
  get app() {
    return getFirebaseApp();
  },
  get auth() {
    return getClientAuth();
  },
  get db() {
    return getClientDb();
  },
  get storage() {
    return getClientStorage();
  },
};
