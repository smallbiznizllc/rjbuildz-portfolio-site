# Architecture — RJ Buildz portfolio CMS

## Stack

- **Next.js 16** (App Router) — public SSR pages + `/admin` CMS
- **Firebase Auth** — email/password; admin via custom claim `admin: true`
- **Firestore** — posts, categories, users, contactMessages, siteSettings
- **Cloud Storage** — `posts/{postId}/…` media
- **Cloud Functions** — Storage cleanup on post delete (`onPostDeleted`); contact primarily via Next.js API

## Public post ordering

Public feeds **never** sort by `createdAt`.

1. `publishedAt` **DESC**
2. `sortOrder` **ASC** (tie-break)
3. document `id` **ASC** (final tie-break; Firestore `__name__`)

Cursor pagination encodes `(publishedAt, sortOrder, id)` so pages stay stable when timestamps collide.

Shared comparator: `src/lib/utils/ordering.ts` (`comparePublicOrder` / `sortByPublicOrder`).

Seed data intentionally sets identical `createdAt` (~Aug 10, 2026) with varied `publishedAt` (2024–2025), including Post B → Post A → Post C, to demonstrate this rule.

## Search strategy

- Each post stores `searchableTitle` = `title.trim().toLowerCase()`.
- Browse queries use publishedAt ordering.
- Search uses a **prefix range** on `searchableTitle` (`>= term` and `< term + \uf8ff`) with composite indexes (see `firestore.indexes.json`).
- Search result order follows the search index (`searchableTitle` ASC, then `publishedAt` DESC), not the browse order.

## Session cookie auth

1. Client signs in with Firebase Auth (admin UI).
2. Client sends ID token to `POST /api/auth/session`.
3. Server creates a Firebase **session cookie** via Admin SDK and sets an HTTP-only cookie (`SESSION_COOKIE_NAME`, default `__session`).
4. Middleware / server actions verify the cookie with `verifySessionCookie` and check `admin` claim for CMS routes.
5. Logout clears the cookie via `/api/auth/logout`.

## Why Admin SDK for public SSR reads

- Firestore security rules hide **drafts** from unauthenticated clients; SSR still needs a trusted server path to load published content without shipping privileged keys to the browser for every layout fetch.
- Admin SDK on the server runs with elevated privileges, applies `status == "published"` (and category/search filters) in code, and keeps draft leakage impossible for anonymous visitors.
- Client SDK is reserved for authenticated admin writes (and Storage uploads under admin claim).
- Contact form writes go through `POST /api/contact` (Zod validation, rate limit, Admin write) rather than opening broad client write access beyond the hardened `contactMessages` create rule.

## Media cleanup

Deleting a post document triggers Cloud Function `onPostDeleted`, which deletes all objects under `posts/{postId}/`. The Next.js admin path can also call `deletePostStorageFolder` for immediate cleanup.
