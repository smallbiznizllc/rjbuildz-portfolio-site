/**
 * Seed Firestore + Auth with demo portfolio CMS content.
 *
 * Usage
 * -----
 * Emulators (recommended for local):
 *   1. firebase emulators:start   (or: npm run emulators)
 *   2. USE_EMULATOR=true tsx scripts/seed.ts
 *      or: USE_EMULATOR=true npm run seed
 *
 * Production / shared project (Admin credentials required — see .env.example):
 *   npm run seed
 *
 * Env
 * ---
 * USE_EMULATOR=true
 *   Connects Admin SDK to Auth (9099), Firestore (8080), Storage (9199).
 *   Uses FIREBASE_ADMIN_PROJECT_ID or NEXT_PUBLIC_FIREBASE_PROJECT_ID
 *   (falls back to "demo-rjbuildz").
 *
 * Without USE_EMULATOR, loads credentials from FIREBASE_ADMIN_* env vars.
 *
 * Creates
 * -------
 * - Admin user: admin@example.com / Admin123! (custom claim admin:true + users/{uid})
 * - Categories: Photography, Projects, Design, Development
 * - 8+ posts (mixed published/draft) with varied publishedAt (2024–2025)
 *   and createdAt ~ Aug 10, 2026 — so public order is by publishedAt DESC
 * - siteSettings/general
 */

import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
  type App,
  type ServiceAccount,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

const USE_EMULATOR = process.env.USE_EMULATOR === "true";

const AUTH_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";
const FIRESTORE_HOST =
  process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
const STORAGE_HOST =
  process.env.FIREBASE_STORAGE_EMULATOR_HOST || "127.0.0.1:9199";

const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "Admin123!";

const CREATED_AT = new Date("2026-08-10T16:00:00.000Z");

function configureEmulators(): void {
  if (!USE_EMULATOR) return;
  process.env.FIREBASE_AUTH_EMULATOR_HOST = AUTH_HOST;
  process.env.FIRESTORE_EMULATOR_HOST = FIRESTORE_HOST;
  process.env.FIREBASE_STORAGE_EMULATOR_HOST = STORAGE_HOST;
  console.log("[seed] Using emulators:", {
    auth: AUTH_HOST,
    firestore: FIRESTORE_HOST,
    storage: STORAGE_HOST,
  });
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

function createApp(): App {
  if (getApps().length) return getApps()[0]!;

  const projectId = resolveProjectId();
  const storageBucket =
    process.env.FIREBASE_ADMIN_STORAGE_BUCKET ||
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    `${projectId}.appspot.com`;

  if (USE_EMULATOR) {
    // Emulators accept unauthenticated Admin access when hosts are set.
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

  return initializeApp({
    credential: applicationDefault(),
    projectId,
    storageBucket,
  });
}

function ts(date: Date): Timestamp {
  return Timestamp.fromDate(date);
}

function placeholderImage(seed: number, alt: string) {
  return {
    path: `seed/placeholders/${seed}.jpg`,
    url: `https://picsum.photos/seed/${seed}/1200/800`,
    alt,
    width: 1200,
    height: 800,
  };
}

async function ensureAdminUser(auth: ReturnType<typeof getAuth>) {
  const db = getFirestore();
  let uid: string;

  try {
    const existing = await auth.getUserByEmail(ADMIN_EMAIL);
    uid = existing.uid;
    await auth.updateUser(uid, {
      password: ADMIN_PASSWORD,
      displayName: "Portfolio Admin",
      emailVerified: true,
    });
    console.log(`[seed] Updated existing admin Auth user (${uid})`);
  } catch {
    const created = await auth.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      displayName: "Portfolio Admin",
      emailVerified: true,
    });
    uid = created.uid;
    console.log(`[seed] Created admin Auth user (${uid})`);
  }

  await auth.setCustomUserClaims(uid, { admin: true });

  await db.collection("users").doc(uid).set(
    {
      email: ADMIN_EMAIL,
      displayName: "Portfolio Admin",
      photoURL: null,
      role: "admin",
      createdAt: ts(CREATED_AT),
      updatedAt: ts(CREATED_AT),
    },
    { merge: true },
  );

  return uid;
}

async function seedCategories(db: ReturnType<typeof getFirestore>) {
  const categories = [
    {
      id: "cat-photography",
      name: "Photography",
      slug: "photography",
      description: "Editorial and location photography.",
      sortOrder: 0,
    },
    {
      id: "cat-projects",
      name: "Projects",
      slug: "projects",
      description: "Client builds and personal case studies.",
      sortOrder: 1,
    },
    {
      id: "cat-design",
      name: "Design",
      slug: "design",
      description: "Brand, UI, and visual systems.",
      sortOrder: 2,
    },
    {
      id: "cat-development",
      name: "Development",
      slug: "development",
      description: "Web apps, tooling, and integrations.",
      sortOrder: 3,
    },
  ];

  for (const cat of categories) {
    await db.collection("categories").doc(cat.id).set({
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      sortOrder: cat.sortOrder,
      createdAt: ts(CREATED_AT),
      updatedAt: ts(CREATED_AT),
    });
  }

  console.log(`[seed] Upserted ${categories.length} categories`);
  return categories;
}

type SeedPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: "published" | "draft" | "archived";
  categoryIds: string[];
  sortOrder: number;
  publishedAt: Date | null;
  imageSeed: number;
  seoTitle: string;
  seoDescription: string;
};

async function seedPosts(
  db: ReturnType<typeof getFirestore>,
  authorId: string,
) {
  /**
   * Explicit ordering demo (createdAt is the same day for all):
   *   Post B — publishedAt Feb 15, 2025  → newest
   *   Post A — publishedAt Jan 10, 2025
   *   Post C — publishedAt Dec 1, 2024   → oldest of the three
   */
  const posts: SeedPost[] = [
    {
      id: "post-b",
      title: "Post B — Midwinter studio lights",
      slug: "post-b-midwinter-studio-lights",
      excerpt:
        "A February session exploring controlled light and texture. Published later than Post A on purpose.",
      content:
        "<p>Post B demonstrates <strong>publishedAt</strong> ordering: this piece went live on <em>February 15, 2025</em>, so it ranks above Post A in the public feed despite sharing nearly the same createdAt.</p><p>Softboxes, bounce cards, and a quiet set.</p>",
      status: "published",
      categoryIds: ["cat-photography"],
      sortOrder: 0,
      publishedAt: new Date("2025-02-15T15:00:00.000Z"),
      imageSeed: 201,
      seoTitle: "Post B — Midwinter studio lights",
      seoDescription: "February 2025 photography session with controlled light.",
    },
    {
      id: "post-a",
      title: "Post A — New year frames",
      slug: "post-a-new-year-frames",
      excerpt:
        "January frames from the first shoot of the year. Older publishedAt than Post B.",
      content:
        "<p>Post A was published on <em>January 10, 2025</em>. It was created in the CMS around the same time as Post B and Post C, but public lists sort by publishedAt — not createdAt.</p>",
      status: "published",
      categoryIds: ["cat-photography"],
      sortOrder: 1,
      publishedAt: new Date("2025-01-10T14:00:00.000Z"),
      imageSeed: 202,
      seoTitle: "Post A — New year frames",
      seoDescription: "January 2025 photography set.",
    },
    {
      id: "post-c",
      title: "Post C — December wrap",
      slug: "post-c-december-wrap",
      excerpt:
        "End-of-year project wrap published Dec 1, 2024 — oldest of the A/B/C trio.",
      content:
        "<p>Post C published on <em>December 1, 2024</em>. Among Post A, B, and C, this should appear last when sorting by publishedAt DESC.</p>",
      status: "published",
      categoryIds: ["cat-projects"],
      sortOrder: 0,
      publishedAt: new Date("2024-12-01T18:00:00.000Z"),
      imageSeed: 203,
      seoTitle: "Post C — December wrap",
      seoDescription: "December 2024 project wrap-up.",
    },
    {
      id: "post-brand-system",
      title: "Modular brand system for RJ Buildz",
      slug: "modular-brand-system-rjbuildz",
      excerpt: "Type, color, and component tokens for a portable brand kit.",
      content:
        "<h2>Brand kit</h2><p>A modular system covering logos, type ramps, and UI tokens so the portfolio and client decks stay consistent.</p><ul><li>Display + body pairings</li><li>Neutral palette with one accent</li><li>Shared spacing scale</li></ul>",
      status: "published",
      categoryIds: ["cat-design", "cat-development"],
      sortOrder: 0,
      publishedAt: new Date("2025-06-20T12:00:00.000Z"),
      imageSeed: 301,
      seoTitle: "Modular brand system",
      seoDescription: "Design system case study for RJ Buildz.",
    },
    {
      id: "post-portfolio-cms",
      title: "Building a Next.js + Firebase portfolio CMS",
      slug: "nextjs-firebase-portfolio-cms",
      excerpt:
        "SSR with Admin SDK, session cookies, and publishedAt-first feeds.",
      content:
        "<p>Architecture notes for a portfolio CMS: Firestore for content, Storage for media, Auth custom claims for admin, and Next.js App Router for public SSR.</p><p>Public queries never order by <code>createdAt</code>.</p>",
      status: "published",
      categoryIds: ["cat-development", "cat-projects"],
      sortOrder: 0,
      publishedAt: new Date("2025-04-08T10:30:00.000Z"),
      imageSeed: 302,
      seoTitle: "Next.js + Firebase portfolio CMS",
      seoDescription: "How the RJ Buildz CMS is structured.",
    },
    {
      id: "post-kitchen-reno",
      title: "Harbor kitchen renovation",
      slug: "harbor-kitchen-renovation",
      excerpt: "Before/after of a coastal kitchen remodel.",
      content:
        "<p>Cabinetry, lighting, and material choices for a bright coastal kitchen. Gallery-ready stills for the project page.</p>",
      status: "published",
      categoryIds: ["cat-projects"],
      sortOrder: 1,
      publishedAt: new Date("2024-08-22T16:00:00.000Z"),
      imageSeed: 303,
      seoTitle: "Harbor kitchen renovation",
      seoDescription: "Coastal kitchen renovation project.",
    },
    {
      id: "post-draft-lookbook",
      title: "Spring lookbook (draft)",
      slug: "spring-lookbook-draft",
      excerpt: "WIP lookbook — not ready for the public site.",
      content:
        "<p>Draft content only. Public readers must not see this until status is published.</p>",
      status: "draft",
      categoryIds: ["cat-photography"],
      sortOrder: 99,
      publishedAt: null,
      imageSeed: 401,
      seoTitle: "Spring lookbook (draft)",
      seoDescription: "Unpublished draft lookbook.",
    },
    {
      id: "post-draft-dashboard",
      title: "Admin analytics dashboard (draft)",
      slug: "admin-analytics-dashboard-draft",
      excerpt: "Exploring charts for post performance — draft.",
      content:
        "<p>Internal draft for a future admin analytics view. Kept unpublished on purpose.</p>",
      status: "draft",
      categoryIds: ["cat-development"],
      sortOrder: 99,
      publishedAt: null,
      imageSeed: 402,
      seoTitle: "Admin analytics dashboard",
      seoDescription: "Draft admin analytics concept.",
    },
    {
      id: "post-type-study",
      title: "Editorial type study",
      slug: "editorial-type-study",
      excerpt: "Display typography experiments for long-form case studies.",
      content:
        "<p>A short study on pairing a high-contrast display face with a readable body for project write-ups.</p>",
      status: "published",
      categoryIds: ["cat-design"],
      sortOrder: 1,
      publishedAt: new Date("2024-10-05T09:00:00.000Z"),
      imageSeed: 304,
      seoTitle: "Editorial type study",
      seoDescription: "Typography experiments for case studies.",
    },
  ];

  for (const post of posts) {
    const searchableTitle = post.title.trim().toLowerCase();
    await db.collection("posts").doc(post.id).set({
      title: post.title,
      slug: post.slug,
      searchableTitle,
      excerpt: post.excerpt,
      content: post.content,
      status: post.status,
      categoryIds: post.categoryIds,
      categoryId: post.categoryIds[0] ?? null,
      mainImage: placeholderImage(post.imageSeed, post.title),
      gallery: [],
      seo: {
        title: post.seoTitle,
        description: post.seoDescription,
        ogImage: `https://picsum.photos/seed/${post.imageSeed}/1200/630`,
        keywords: [
          ...(post.categoryIds[0]
            ? [post.categoryIds[0].replace("cat-", "")]
            : []),
          "portfolio",
        ],
      },
      sortOrder: post.sortOrder,
      publishedAt: post.publishedAt ? ts(post.publishedAt) : null,
      relatedPostIds: [],
      createdAt: ts(CREATED_AT),
      updatedAt: ts(CREATED_AT),
      authorId,
    });
  }

  console.log(`[seed] Upserted ${posts.length} posts`);
  console.log(
    "[seed] Expected public order (published only, publishedAt DESC):",
    "brand system → Post B → CMS → Post A → Post C → type study → kitchen",
  );
}

async function seedSiteSettings(
  db: ReturnType<typeof getFirestore>,
  updatedBy: string,
) {
  await db.collection("siteSettings").doc("general").set(
    {
      siteName: "RJ Buildz",
      owner: "Rafael J. Oliver",
      aboutBlurb:
        "Portfolio and project archive for RJ Buildz — photography, design, and custom builds.",
      tagline: "Build with clarity.",
      contactEmail: "hello@example.com",
      logoUrl: null,
      socialLinks: {
        website: "https://rjbuildz.com",
        instagram: "https://instagram.com/rjbuildz",
      },
      updatedAt: ts(CREATED_AT),
      updatedBy,
    },
    { merge: true },
  );
  console.log("[seed] Upserted siteSettings/general");
}

async function main() {
  configureEmulators();
  const app = createApp();
  const auth = getAuth(app);
  const db = getFirestore(app);

  console.log(`[seed] Project: ${resolveProjectId()}`);

  const adminUid = await ensureAdminUser(auth);
  await seedCategories(db);
  await seedPosts(db, adminUid);
  await seedSiteSettings(db, adminUid);

  console.log("\n[seed] Done.");
  console.log(`[seed] Admin login: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  process.exit(0);
}

main().catch((error) => {
  console.error("[seed] Failed:", error);
  process.exit(1);
});
