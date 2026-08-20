/**
 * Restore user CMS content from ./backup/portfolio-content.json.
 *
 * Usage
 * -----
 * Emulators (must be running):
 *   npm run backup:restore
 *
 * Production / shared project (Admin credentials required):
 *   USE_EMULATOR=false tsx scripts/backup-restore.ts
 *   # or omit USE_EMULATOR and set FIREBASE_ADMIN_* / GOOGLE_APPLICATION_CREDENTIALS
 *
 * Matches posts/categories by slug (creates missing, updates existing).
 * Does not delete extra docs that are not in the backup.
 */
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
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
import { getStorage } from "firebase-admin/storage";
import { tagsFromStoredOrHtml } from "../src/lib/utils/tags";

const USE_EMULATOR = process.env.USE_EMULATOR !== "false";

const BACKUP_DIR = path.join(process.cwd(), "backup");
const JSON_PATH = path.join(BACKUP_DIR, "portfolio-content.json");

function getPrivateKey(): string | undefined {
  const raw = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (!raw) return undefined;
  return raw.replace(/\\n/g, "\n");
}

function resolveProjectId(): string {
  return (
    process.env.FIREBASE_ADMIN_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    (USE_EMULATOR ? "demo-rjbuildz" : "rjbuildz-portfolio")
  );
}

function resolveBucket(projectId: string): string {
  return (
    process.env.FIREBASE_ADMIN_STORAGE_BUCKET ||
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    (USE_EMULATOR ? `${projectId}.appspot.com` : `${projectId}.firebasestorage.app`)
  );
}

function configureEmulators(): void {
  if (!USE_EMULATOR) return;
  process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";
  process.env.FIREBASE_AUTH_EMULATOR_HOST ||= "127.0.0.1:9099";
  process.env.FIREBASE_STORAGE_EMULATOR_HOST ||= "127.0.0.1:9199";
}

function createApp(projectId: string, bucket: string): App {
  if (getApps().length) return getApps()[0]!;

  if (USE_EMULATOR) {
    return initializeApp({ projectId, storageBucket: bucket });
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
      storageBucket: bucket,
    });
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return initializeApp({
      credential: applicationDefault(),
      projectId,
      storageBucket: bucket,
    });
  }

  throw new Error(
    "Production restore requires FIREBASE_ADMIN_* credentials or GOOGLE_APPLICATION_CREDENTIALS. For emulators, use USE_EMULATOR=true (default).",
  );
}

type ImageRef = {
  file: string | null;
  alt: string;
  width: number | null;
  height: number | null;
  caption?: string | null;
  sortOrder?: number;
  id?: string;
  kind?: "image" | "video";
  sourceUrl?: string | null;
  posterUrl?: string | null;
};

type BackupPost = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  features: string;
  featureTags?: string[];
  builtUsing: string;
  createdWithTags?: string[];
  seeItLive: string | null;
  inProgress: boolean;
  favorite: boolean;
  status: string;
  categorySlugs: string[];
  relatedPostSlugs?: string[];
  mainImage: ImageRef | null;
  gallery: ImageRef[];
  seo?: {
    title: string | null;
    description: string | null;
    ogImage: string | null;
    keywords: string[];
  };
  sortOrder: number;
  publishedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type BackupFile = {
  exportedAt?: string;
  categories: {
    id?: string;
    name: string;
    slug: string;
    description: string | null;
    sortOrder: number;
  }[];
  posts: BackupPost[];
  siteSettings: Record<string, unknown> | null;
};

function contentTypeFor(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  if (ext === ".avif") return "image/avif";
  if (ext === ".mp4") return "video/mp4";
  if (ext === ".webm") return "video/webm";
  if (ext === ".ogg") return "video/ogg";
  if (ext === ".mov") return "video/quicktime";
  return "image/jpeg";
}

function extFor(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase().replace(".", "");
  if (ext === "jpeg") return "jpg";
  if (["jpg", "png", "webp", "gif", "avif", "mp4", "webm", "ogg", "mov", "m4v"].includes(ext)) {
    return ext;
  }
  return "jpg";
}

function publicMediaUrl(bucket: string, storagePath: string, token: string): string {
  if (USE_EMULATOR) {
    return `http://127.0.0.1:9199/v0/b/${bucket}/o/${encodeURIComponent(storagePath)}?alt=media&token=${token}`;
  }
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(storagePath)}?alt=media&token=${token}`;
}

async function uploadLocal(
  bucket: string,
  storagePath: string,
  localPath: string,
): Promise<{ path: string; url: string; alt: string; width: null; height: null }> {
  const token = randomUUID();
  await getStorage().bucket().file(storagePath).save(readFileSync(localPath), {
    resumable: false,
    metadata: {
      contentType: contentTypeFor(localPath),
      metadata: { firebaseStorageDownloadTokens: token },
    },
  });
  return {
    path: storagePath,
    url: publicMediaUrl(bucket, storagePath, token),
    alt: "",
    width: null,
    height: null,
  };
}

async function main() {
  configureEmulators();
  const projectId = resolveProjectId();
  const bucket = resolveBucket(projectId);
  console.log("[backup:restore] Target:", {
    projectId,
    bucket,
    emulator: USE_EMULATOR,
  });

  const backup = JSON.parse(readFileSync(JSON_PATH, "utf8")) as BackupFile;
  createApp(projectId, bucket);
  const db = getFirestore();
  const auth = getAuth();

  let authorId = "";
  try {
    const adminUser = await auth.getUserByEmail("admin@example.com");
    authorId = adminUser.uid;
  } catch {
    const existing = await db.collection("posts").limit(1).get();
    authorId = String(existing.docs[0]?.data()?.authorId ?? "backup-restore");
  }

  const slugToCategoryId = new Map<string, string>();
  const catSnap = await db.collection("categories").get();
  for (const doc of catSnap.docs) {
    slugToCategoryId.set(String(doc.data().slug ?? ""), doc.id);
  }

  for (const cat of backup.categories ?? []) {
    const now = Timestamp.now();
    const existingId = slugToCategoryId.get(cat.slug);
    if (existingId) {
      await db.collection("categories").doc(existingId).set(
        {
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          sortOrder: cat.sortOrder,
          updatedAt: now,
        },
        { merge: true },
      );
      console.log(`[category] updated ${cat.slug}`);
    } else {
      const ref = db.collection("categories").doc();
      await ref.set({
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        sortOrder: cat.sortOrder,
        createdAt: now,
        updatedAt: now,
      });
      slugToCategoryId.set(cat.slug, ref.id);
      console.log(`[category] created ${cat.slug}`);
    }
  }

  const postSnap = await db.collection("posts").get();
  const slugToPostId = new Map<string, string>();
  for (const doc of postSnap.docs) {
    slugToPostId.set(String(doc.data().slug ?? ""), doc.id);
  }

  for (const post of backup.posts ?? []) {
    const existingId = slugToPostId.get(post.slug);
    const ref = existingId
      ? db.collection("posts").doc(existingId)
      : db.collection("posts").doc();
    const postId = ref.id;
    const now = Timestamp.now();

    let mainImage = null;
    if (post.mainImage?.file) {
      const localPath = path.join(BACKUP_DIR, post.mainImage.file);
      const uploaded = await uploadLocal(
        bucket,
        `posts/${postId.toLowerCase()}/main/${Date.now()}.${extFor(localPath)}`,
        localPath,
      );
      mainImage = {
        ...uploaded,
        alt: post.mainImage.alt || post.title,
        width: post.mainImage.width,
        height: post.mainImage.height,
      };
    }

    const gallery = [];
    const items = [...(post.gallery ?? [])].sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
    );
    for (let i = 0; i < items.length; i++) {
      const item = items[i]!;
      const imageId = item.id || randomUUID();
      const kind = item.kind === "video" ? "video" : "image";
      if (kind === "video" && !item.file && item.sourceUrl) {
        gallery.push({
          path: "",
          url: item.posterUrl || item.sourceUrl,
          alt: item.alt || post.title,
          id: imageId,
          sortOrder: item.sortOrder ?? i,
          caption: item.caption ?? null,
          width: item.width,
          height: item.height,
          kind: "video",
          sourceUrl: item.sourceUrl,
          posterUrl: item.posterUrl ?? null,
        });
        continue;
      }
      if (!item.file) continue;
      const localPath = path.join(BACKUP_DIR, item.file);
      const uploaded = await uploadLocal(
        bucket,
        `posts/${postId.toLowerCase()}/gallery/${imageId}-${Date.now()}.${extFor(localPath)}`,
        localPath,
      );
      gallery.push({
        ...uploaded,
        alt: item.alt || post.title,
        id: imageId,
        sortOrder: item.sortOrder ?? i,
        caption: item.caption ?? null,
        width: item.width,
        height: item.height,
        kind,
        sourceUrl: item.sourceUrl ?? null,
        posterUrl: item.posterUrl ?? null,
      });
    }

    const categoryIds = (post.categorySlugs ?? [])
      .map((slug) => slugToCategoryId.get(slug))
      .filter((id): id is string => Boolean(id));

    const publishedAt = post.publishedAt
      ? Timestamp.fromDate(new Date(post.publishedAt))
      : null;
    const createdAt = post.createdAt
      ? Timestamp.fromDate(new Date(post.createdAt))
      : now;

    await ref.set(
      {
        title: post.title,
        slug: post.slug,
        searchableTitle: post.title.trim().toLowerCase(),
        excerpt: post.excerpt ?? "",
        content: post.content ?? "",
        features: post.features ?? "",
        featureTags: tagsFromStoredOrHtml(
          post.featureTags,
          post.features ?? "",
        ),
        builtUsing: post.builtUsing ?? "",
        createdWithTags: tagsFromStoredOrHtml(
          post.createdWithTags,
          post.builtUsing ?? "",
        ),
        seeItLive: post.seeItLive ?? null,
        inProgress: Boolean(post.inProgress),
        favorite: Boolean(post.favorite),
        status: post.status ?? "draft",
        categoryIds,
        categoryId: categoryIds[0] ?? null,
        mainImage,
        gallery,
        seo: {
          title: post.seo?.title ?? null,
          description: post.seo?.description ?? null,
          ogImage: post.seo?.ogImage ?? null,
          keywords: post.seo?.keywords ?? [],
        },
        sortOrder: post.sortOrder ?? 0,
        publishedAt,
        createdAt,
        updatedAt: now,
        authorId,
      },
      { merge: false },
    );
    slugToPostId.set(post.slug, postId);
    console.log(`[post] ${existingId ? "updated" : "created"} ${post.slug}`);
  }

  for (const post of backup.posts ?? []) {
    const postId = slugToPostId.get(post.slug);
    if (!postId) continue;
    const relatedPostIds = (post.relatedPostSlugs ?? [])
      .map((slug) => slugToPostId.get(slug))
      .filter((id): id is string => Boolean(id) && id !== postId);
    await db.collection("posts").doc(postId).update({ relatedPostIds });
  }

  if (backup.siteSettings) {
    await db.collection("siteSettings").doc("general").set(
      {
        ...backup.siteSettings,
        updatedAt: Timestamp.now(),
        updatedBy: authorId,
      },
      { merge: true },
    );
    console.log("[settings] updated general");
  }

  console.log("[backup:restore] Done.");
}

main().catch((error) => {
  console.error("[backup:restore] Failed:", error);
  process.exit(1);
});
