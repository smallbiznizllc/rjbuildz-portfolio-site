# RJ Buildz Portfolio CMS

Next.js 16 + Firebase portfolio site with a public gallery and an authenticated admin CMS.

## Overview

- **Public site** — SSR pages for home, categories, posts, about, contact
- **Admin CMS** — `/admin` for posts, categories, media, settings (session-cookie auth + `admin` claim)
- **Firebase** — Auth, Firestore, Storage, optional Cloud Functions
- **Ordering rule** — public lists sort by **`publishedAt` DESC**, then `sortOrder` ASC, then `id` ASC — never by `createdAt`

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [DEPLOYMENT.md](DEPLOYMENT.md).

## Architecture (short)

```
Browser ──► Next.js (App Router)
              ├─ Public SSR ── Admin SDK ──► Firestore (published only)
              ├─ /api/contact ── Admin SDK ──► contactMessages (+ optional Resend)
              └─ /admin ── session cookie ──► Auth claims + Admin SDK / client Storage uploads
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` / `start` | Production build & serve |
| `npm run emulators` | Firebase emulators (Auth, Firestore, Storage, Functions, UI) |
| `npm run seed` | Seed Admin user, categories, posts, settings |
| `USE_EMULATOR=true npm run seed` | Seed against local emulators |
| `npm test` | Vitest (unit + rules if emulators up) |
| `npm run test:rules` | Security rules tests only |
| `npm run lint` | ESLint |

Seed admin: `admin@example.com` / `Admin123!`

## Project structure

```
src/
  app/
    (public)/          # Marketing & portfolio pages
    admin/             # CMS (auth + dashboard)
    api/               # session, logout, posts, contact
  components/          # public, admin, forms, gallery, ui
  lib/
    auth/              # session cookies, admin guards
    firebase/          # client + admin SDK
    firestore/         # posts, categories, settings, users
    storage/           # paths, upload, delete
    validation/        # Zod schemas
    utils/             # slug, sanitize, ordering, dates
  types/
scripts/seed.ts
functions/             # onPostDeleted + submitContact stub
tests/unit/            # slug, ordering, sanitize, validation
tests/rules/           # Firestore + Storage rules
firestore.rules
storage.rules
firestore.indexes.json
```

## Quick start (emulators)

```bash
npm install
cp .env.example .env.local
# set NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true and project ids (see DEPLOYMENT.md)

npm run emulators
# another terminal:
USE_EMULATOR=true npm run seed
npm run dev
```

## Docs

- [DEPLOYMENT.md](DEPLOYMENT.md) — Firebase Console, emulators, deploy, env, first admin
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — ordering, search, sessions, Admin SSR
