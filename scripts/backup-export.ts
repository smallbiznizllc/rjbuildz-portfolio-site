/**
 * Export user CMS content (posts, categories, settings, images) to ./backup
 * so it can be restored after an emulator wipe.
 *
 * Usage (emulators must be running):
 *   npm run backup:export
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= "127.0.0.1:9099";
process.env.FIREBASE_STORAGE_EMULATOR_HOST ||= "127.0.0.1:9199";

const PROJECT_ID = "demo-rjbuildz";
const BUCKET = "demo-rjbuildz.appspot.com";
const BACKUP_DIR = path.join(process.cwd(), "backup");
const MEDIA_DIR = path.join(BACKUP_DIR, "media");

function isSeedId(id: string): boolean {
  return id.startsWith("post-") || id.startsWith("cat-");
}

function toIso(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return null;
}

function extFromUrlOrPath(url: string, storagePath: string): string {
  const fromPath = path.extname(storagePath).replace(".", "").toLowerCase();
  if (["jpg", "jpeg", "png", "webp", "avif", "gif"].includes(fromPath)) {
    return fromPath === "jpeg" ? "jpg" : fromPath;
  }
  try {
    const pathname = new URL(url).pathname;
    const ext = path.extname(decodeURIComponent(pathname)).replace(".", "").toLowerCase();
    if (["jpg", "jpeg", "png", "webp", "avif", "gif"].includes(ext)) {
      return ext === "jpeg" ? "jpg" : ext;
    }
  } catch {
    /* ignore */
  }
  return "jpg";
}

async function downloadImage(
  url: string,
  destPath: string,
): Promise<boolean> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[skip image] ${res.status} ${url}`);
      return false;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    await mkdir(path.dirname(destPath), { recursive: true });
    await writeFile(destPath, buf);
    return true;
  } catch (error) {
    console.warn(`[skip image] ${url}`, error);
    return false;
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function main() {
  if (!getApps().length) {
    initializeApp({ projectId: PROJECT_ID, storageBucket: BUCKET });
  }
  const db = getFirestore();

  const [catSnap, postSnap, settingsSnap] = await Promise.all([
    db.collection("categories").get(),
    db.collection("posts").get(),
    db.collection("siteSettings").doc("general").get(),
  ]);

  const categories = catSnap.docs
    .filter((doc) => !isSeedId(doc.id))
    .map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: String(data.name ?? ""),
        slug: String(data.slug ?? ""),
        description: data.description != null ? String(data.description) : null,
        sortOrder: typeof data.sortOrder === "number" ? data.sortOrder : 0,
      };
    })
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

  const categoryById = new Map(categories.map((c) => [c.id, c]));

  type ImageRef = {
    file: string | null;
    alt: string;
    width: number | null;
    height: number | null;
    caption?: string | null;
    sortOrder?: number;
    id?: string;
  };

  const posts = [];

  for (const doc of postSnap.docs) {
    if (isSeedId(doc.id)) continue;
    const data = doc.data();
    const slug = String(data.slug ?? doc.id);
    const categoryIds = Array.isArray(data.categoryIds)
      ? data.categoryIds.map(String)
      : data.categoryId
        ? [String(data.categoryId)]
        : [];

    let mainImage: ImageRef | null = null;
    const main = data.mainImage as
      | { url?: string; path?: string; alt?: string; width?: number; height?: number }
      | null
      | undefined;
    if (main?.url) {
      const ext = extFromUrlOrPath(main.url, String(main.path ?? ""));
      const rel = `media/${slug}/main.${ext}`;
      const ok = await downloadImage(main.url, path.join(BACKUP_DIR, rel));
      mainImage = {
        file: ok ? rel : null,
        alt: String(main.alt ?? ""),
        width: typeof main.width === "number" ? main.width : null,
        height: typeof main.height === "number" ? main.height : null,
      };
    }

    const gallery: ImageRef[] = [];
    const rawGallery = Array.isArray(data.gallery) ? data.gallery : [];
    for (let i = 0; i < rawGallery.length; i++) {
      const item = rawGallery[i] as {
        id?: string;
        url?: string;
        path?: string;
        alt?: string;
        width?: number;
        height?: number;
        caption?: string | null;
        sortOrder?: number;
      };
      const imageId = String(item.id ?? `gallery-${i}`);
      let file: string | null = null;
      if (item.url) {
        const ext = extFromUrlOrPath(item.url, String(item.path ?? ""));
        const rel = `media/${slug}/gallery-${String(i).padStart(2, "0")}-${imageId}.${ext}`;
        const ok = await downloadImage(item.url, path.join(BACKUP_DIR, rel));
        if (ok) file = rel;
      }
      gallery.push({
        file,
        alt: String(item.alt ?? ""),
        width: typeof item.width === "number" ? item.width : null,
        height: typeof item.height === "number" ? item.height : null,
        caption: item.caption != null ? String(item.caption) : null,
        sortOrder: typeof item.sortOrder === "number" ? item.sortOrder : i,
        id: imageId,
      });
    }

    const seo = (data.seo ?? {}) as {
      title?: string | null;
      description?: string | null;
      ogImage?: string | null;
      keywords?: string[];
    };

    posts.push({
      id: doc.id,
      title: String(data.title ?? ""),
      slug,
      excerpt: String(data.excerpt ?? ""),
      content: String(data.content ?? ""),
      features: String(data.features ?? ""),
      builtUsing: String(data.builtUsing ?? ""),
      seeItLive: data.seeItLive ? String(data.seeItLive) : null,
      inProgress: Boolean(data.inProgress),
      favorite: Boolean(data.favorite),
      status: String(data.status ?? "draft"),
      categorySlugs: categoryIds
        .map((id) => categoryById.get(id)?.slug)
        .filter((s): s is string => Boolean(s)),
      mainImage,
      gallery,
      seo: {
        title: seo.title ?? null,
        description: seo.description ?? null,
        ogImage: seo.ogImage ?? null,
        keywords: Array.isArray(seo.keywords) ? seo.keywords.map(String) : [],
      },
      sortOrder: typeof data.sortOrder === "number" ? data.sortOrder : 0,
      publishedAt: toIso(data.publishedAt),
      createdAt: toIso(data.createdAt),
      updatedAt: toIso(data.updatedAt),
    });
  }

  posts.sort((a, b) => a.title.localeCompare(b.title));

  const settingsData = settingsSnap.exists ? settingsSnap.data() : undefined;
  const backup = {
    exportedAt: new Date().toISOString(),
    categories,
    posts,
    siteSettings: settingsData
      ? {
          siteName: settingsData.siteName ?? null,
          owner: settingsData.owner ?? null,
          aboutBlurb: settingsData.aboutBlurb ?? null,
          tagline: settingsData.tagline ?? null,
          contactEmail: settingsData.contactEmail ?? null,
          logoUrl: settingsData.logoUrl ?? null,
          socialLinks: settingsData.socialLinks ?? {},
        }
      : null,
  };

  await mkdir(MEDIA_DIR, { recursive: true });
  const jsonPath = path.join(BACKUP_DIR, "portfolio-content.json");
  await writeFile(jsonPath, `${JSON.stringify(backup, null, 2)}\n`, "utf8");

  const textLines = [
    `RJ Buildz portfolio backup`,
    `Exported ${backup.exportedAt}`,
    `Posts: ${posts.length}  Categories: ${categories.length}`,
    "",
    "Restore with: npm run backup:restore",
    "",
    "=".repeat(72),
    "",
  ];
  for (const post of posts) {
    textLines.push(`TITLE: ${post.title}`);
    textLines.push(`SLUG: ${post.slug}`);
    textLines.push(`STATUS: ${post.status}`);
    textLines.push(`CATEGORIES: ${post.categorySlugs.join(", ") || "(none)"}`);
    if (post.seeItLive) textLines.push(`SEE IT LIVE: ${post.seeItLive}`);
    if (post.excerpt) {
      textLines.push("");
      textLines.push("EXCERPT");
      textLines.push(post.excerpt);
    }
    if (post.content) {
      textLines.push("");
      textLines.push("CONTENT");
      textLines.push(stripHtml(post.content));
    }
    if (post.features) {
      textLines.push("");
      textLines.push("FEATURES");
      textLines.push(stripHtml(post.features));
    }
    if (post.builtUsing) {
      textLines.push("");
      textLines.push("BUILT USING");
      textLines.push(stripHtml(post.builtUsing));
    }
    textLines.push("");
    textLines.push("-".repeat(72));
    textLines.push("");
  }
  const txtPath = path.join(BACKUP_DIR, "portfolio-copy.txt");
  await writeFile(txtPath, textLines.join("\n"), "utf8");

  console.log(`[backup] Wrote ${jsonPath}`);
  console.log(`[backup] Wrote ${txtPath}`);
  console.log(`[backup] Posts: ${posts.length}  Categories: ${categories.length}`);
}

main().catch((error) => {
  console.error("[backup:export] Failed:", error);
  process.exit(1);
});
