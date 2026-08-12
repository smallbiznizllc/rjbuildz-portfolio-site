# Deployment guide — RJ Buildz portfolio CMS

## Local setup

1. Install dependencies:

```bash
npm install
cd functions && npm install && cd ..
```

2. Copy environment template and fill values:

```bash
cp .env.example .env.local
```

3. For emulator-backed local work, set in `.env.local`:

```bash
NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true
# Client Firebase config can use placeholder values matching .firebaserc / seed project id
NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-rjbuildz
FIREBASE_ADMIN_PROJECT_ID=demo-rjbuildz
SESSION_COOKIE_SECURE=false
```

4. Start the app:

```bash
npm run dev
```

## Firebase Console setup (production / shared project)

In the [Firebase Console](https://console.firebase.google.com/):

1. **Authentication** — enable Email/Password provider.
2. **Firestore** — create database (production mode; deploy rules immediately).
3. **Storage** — enable default bucket; deploy `storage.rules`.
4. **App Check** (recommended) — register the web app with reCAPTCHA v3; set `NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY`.
5. **Authorized domains** — add your production domain and `localhost` for Auth.
6. **Service account** — Project settings → Service accounts → Generate new private key. Map into `FIREBASE_ADMIN_*` env vars (escape newlines in `FIREBASE_ADMIN_PRIVATE_KEY` as `\n`).

Update `.firebaserc` with real project IDs before deploying.

## Emulators

```bash
# Terminal 1 — Auth, Firestore, Storage, Functions, Emulator UI (:4000)
npm run emulators
# or: firebase emulators:start --import=./.firebase-data --export-on-exit

# Terminal 2 — seed demo content
USE_EMULATOR=true npm run seed
# equivalent: USE_EMULATOR=true tsx scripts/seed.ts

# Terminal 3 — Next.js
npm run dev
```

Emulator UI: http://localhost:4000

Seed creates:

- Admin: `admin@example.com` / `Admin123!` (custom claim `admin: true`)
- Categories, sample posts (including Post A/B/C publishedAt ordering demo), `siteSettings/general`

## Deploy rules, indexes, functions

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
firebase deploy --only functions
```

## Hosting / App Hosting for Next.js

This repo’s `firebase.json` uses **Firebase Hosting with Web Frameworks** (`hosting.source: "."`) targeting `us-central1`.

```bash
# Enable web frameworks experiment if prompted
firebase experiments:enable webframeworks
firebase deploy --only hosting
```

Alternatively deploy the Next.js app to **Vercel** / **Cloud Run** and point DNS there. Server routes that use the Admin SDK need the same `FIREBASE_ADMIN_*` and session env vars.

## Production environment variables

Set all keys from `.env.example` in the host’s secret/env store:

| Variable | Notes |
| --- | --- |
| `NEXT_PUBLIC_FIREBASE_*` | Client SDK config |
| `FIREBASE_ADMIN_PROJECT_ID` / `CLIENT_EMAIL` / `PRIVATE_KEY` / `STORAGE_BUCKET` | Server Admin SDK |
| `SESSION_COOKIE_NAME` / `MAX_AGE` / `SECURE` | HTTP-only session cookie (`SECURE=true` in prod) |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for sitemap/OG |
| `CONTACT_TO_EMAIL` / `CONTACT_FROM_EMAIL` / `RESEND_API_KEY` | Contact notifications |
| `CONTACT_RATE_LIMIT_PER_HOUR` | Default 5 |

Never commit `.env.local` or service account JSON.

## Creating the first admin

**Option A — seed (emulators or disposable project):**

```bash
USE_EMULATOR=true npm run seed
```

**Option B — manual (production):**

1. Create the user in Authentication (Email/Password).
2. Set custom claim with Admin SDK / CLI script:

```js
await admin.auth().setCustomUserClaims(uid, { admin: true });
```

3. Create `users/{uid}` with `role: "admin"`.
4. User must refresh their ID token / re-login so the claim appears on the session cookie.

## Security notes

- Public SSR reads use the **Admin SDK** and filter `status == "published"` in queries — do not expose Admin credentials to the client.
- Client Auth is for the admin CMS only; session cookies are HTTP-only.
- Firestore rules: public may read published posts + categories + site settings; drafts are admin-only; contact create is validated and unread-only.
- Storage: public read under `posts/**`; writes require `admin: true` claim, image MIME, under 10MB.
- Prefer App Check on public write paths (contact) and Storage uploads.
- Rotate service account keys if leaked; keep rules deployed before opening Firestore to the internet.

## Rules tests

With emulators running (or via `emulators:exec`):

```bash
firebase emulators:exec --only firestore,storage "npm run test:rules"
```

Unit tests (no emulators):

```bash
npx vitest run tests/unit
```
