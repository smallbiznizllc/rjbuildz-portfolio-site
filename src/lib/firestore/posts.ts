import {
  FieldPath,
  FieldValue,
  Timestamp,
  type DocumentData,
  type Query,
} from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { comparePublicOrder } from "@/lib/utils/ordering";
import { sanitizeHtml } from "@/lib/utils/sanitize";
import { tagsFromStoredOrHtml } from "@/lib/utils/tags";
import { slugify } from "@/lib/utils/slug";
import type {
  AdjacentPosts,
  GalleryImage,
  PaginatedResult,
  Post,
  PostImage,
  PostStatus,
  SEO,
} from "@/types";
import type { CreatePostInput, UpdatePostInput } from "@/lib/validation/schemas";

const POSTS = "posts";

/**
 * Public ordering (never createdAt):
 *   1. publishedAt DESC
 *   2. sortOrder ASC   (tie-break)
 *   3. document id ASC (final tie-break; Firestore appends __name__ to indexes)
 *
 * Cursor pagination uses (publishedAt, sortOrder, id) so pages stay stable
 * when multiple posts share the same publishedAt.
 */

export interface GetPublishedPostsOptions {
  limit?: number;
  cursor?: string | null;
  categoryId?: string | null;
  /** When set (1–10 ids), posts matching any of these categories. */
  categoryIds?: string[] | null;
  search?: string | null;
}

interface CursorPayload {
  mode: "browse" | "search";
  publishedAt: string;
  sortOrder: number;
  id: string;
  searchableTitle?: string;
}

function encodeCursor(post: Post, mode: "browse" | "search"): string {
  const payload: CursorPayload = {
    mode,
    publishedAt: (post.publishedAt ?? new Date(0)).toISOString(),
    sortOrder: post.sortOrder,
    id: post.id,
    searchableTitle: post.searchableTitle,
  };
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodeCursor(cursor: string): CursorPayload {
  const json = Buffer.from(cursor, "base64url").toString("utf8");
  const parsed = JSON.parse(json) as CursorPayload;
  if (!parsed?.publishedAt || !parsed?.id) {
    throw new Error("Invalid pagination cursor");
  }
  return {
    mode: parsed.mode === "search" ? "search" : "browse",
    publishedAt: parsed.publishedAt,
    sortOrder: typeof parsed.sortOrder === "number" ? parsed.sortOrder : 0,
    id: parsed.id,
    searchableTitle: parsed.searchableTitle,
  };
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function mapImage(data: DocumentData | null | undefined): PostImage | null {
  if (!data || typeof data !== "object") return null;
  return {
    path: String(data.path ?? ""),
    url: String(data.url ?? ""),
    alt: String(data.alt ?? ""),
    width: typeof data.width === "number" ? data.width : null,
    height: typeof data.height === "number" ? data.height : null,
  };
}

function mapGallery(data: unknown): GalleryImage[] {
  if (!Array.isArray(data)) return [];
  return data.map((item, index) => {
    const img = mapImage(item) ?? {
      path: "",
      url: "",
      alt: "",
      width: null,
      height: null,
    };
    const caption = (item as DocumentData)?.caption;
    const kind = (item as DocumentData)?.kind === "video" ? "video" : "image";
    const sourceUrl = (item as DocumentData)?.sourceUrl;
    const posterUrl = (item as DocumentData)?.posterUrl;
    return {
      ...img,
      id: String((item as DocumentData)?.id ?? `gallery-${index}`),
      sortOrder:
        typeof (item as DocumentData)?.sortOrder === "number"
          ? (item as DocumentData).sortOrder
          : index,
      caption: caption != null ? String(caption) : null,
      kind,
      sourceUrl: sourceUrl ? String(sourceUrl) : null,
      posterUrl: posterUrl ? String(posterUrl) : null,
    };
  });
}

function mapSeo(data: DocumentData | null | undefined): SEO {
  return {
    title: data?.title ? String(data.title) : null,
    description: data?.description ? String(data.description) : null,
    ogImage: data?.ogImage ? String(data.ogImage) : null,
    keywords: Array.isArray(data?.keywords)
      ? data.keywords.map(String)
      : [],
  };
}

export function mapPostDoc(id: string, data: DocumentData): Post {
  const categoryIds = normalizeCategoryIds(data);
  return {
    id,
    title: String(data.title ?? ""),
    slug: String(data.slug ?? ""),
    searchableTitle: String(data.searchableTitle ?? ""),
    excerpt: String(data.excerpt ?? ""),
    content: String(data.content ?? ""),
    features: String(data.features ?? ""),
    featureTags: tagsFromStoredOrHtml(data.featureTags, String(data.features ?? "")),
    builtUsing: String(data.builtUsing ?? ""),
    createdWithTags: tagsFromStoredOrHtml(
      data.createdWithTags,
      String(data.builtUsing ?? ""),
    ),
    seeItLive: data.seeItLive ? String(data.seeItLive) : null,
    inProgress: Boolean(data.inProgress),
    favorite: Boolean(data.favorite),
    status: (data.status as PostStatus) ?? "draft",
    categoryIds,
    relatedPostIds: uniqueIds(data.relatedPostIds),
    mainImage: mapImage(data.mainImage),
    gallery: mapGallery(data.gallery),
    seo: mapSeo(data.seo),
    sortOrder: typeof data.sortOrder === "number" ? data.sortOrder : 0,
    publishedAt: toDate(data.publishedAt),
    createdAt: toDate(data.createdAt) ?? new Date(0),
    updatedAt: toDate(data.updatedAt) ?? new Date(0),
    authorId: String(data.authorId ?? ""),
  };
}

function uniqueIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((id) => String(id).trim()).filter(Boolean))];
}

/** Prefer categoryIds[]; fall back to legacy single categoryId. */
function normalizeCategoryIds(data: DocumentData): string[] {
  if (Array.isArray(data.categoryIds) && data.categoryIds.length > 0) {
    return [
      ...new Set(
        data.categoryIds
          .map((id) => String(id).trim())
          .filter(Boolean),
      ),
    ];
  }
  if (data.categoryId) return [String(data.categoryId)];
  return [];
}

function buildSearchableTitle(title: string): string {
  return title.trim().toLowerCase();
}

function toFirestorePostPayload(
  input: CreatePostInput | Omit<UpdatePostInput, "id">,
  authorId: string,
  partial = false,
): DocumentData {
  const payload: DocumentData = {};

  if (input.title !== undefined) {
    payload.title = input.title;
    payload.searchableTitle = buildSearchableTitle(input.title);
  }
  if (input.slug !== undefined) {
    payload.slug = slugify(input.slug) || input.slug;
  }
  if (input.excerpt !== undefined) payload.excerpt = input.excerpt;
  if (input.content !== undefined) payload.content = sanitizeHtml(input.content);
  if (input.features !== undefined) {
    payload.features = sanitizeHtml(input.features);
  }
  if (input.featureTags !== undefined) {
    payload.featureTags = input.featureTags;
  }
  if (input.builtUsing !== undefined) {
    payload.builtUsing = sanitizeHtml(input.builtUsing);
  }
  if (input.createdWithTags !== undefined) {
    payload.createdWithTags = input.createdWithTags;
  }
  if (input.seeItLive !== undefined) {
    payload.seeItLive = input.seeItLive || null;
  }
  if (input.inProgress !== undefined) {
    payload.inProgress = Boolean(input.inProgress);
  }
  if (input.favorite !== undefined) {
    payload.favorite = Boolean(input.favorite);
  }
  if (input.status !== undefined) payload.status = input.status;
  if (input.categoryIds !== undefined) {
    const ids = [
      ...new Set(input.categoryIds.map((id) => id.trim()).filter(Boolean)),
    ];
    payload.categoryIds = ids;
    // Keep legacy field in sync for older readers / gradual migration.
    payload.categoryId = ids[0] ?? null;
  }
  if (input.relatedPostIds !== undefined) {
    payload.relatedPostIds = uniqueIds(input.relatedPostIds);
  }
  if (input.mainImage !== undefined) payload.mainImage = input.mainImage;
  if (input.gallery !== undefined) payload.gallery = input.gallery;
  if (input.seo !== undefined) {
    payload.seo = {
      title: input.seo?.title ?? null,
      description: input.seo?.description ?? null,
      ogImage: input.seo?.ogImage || null,
      keywords: input.seo?.keywords ?? [],
    };
  }
  if (input.sortOrder !== undefined) payload.sortOrder = input.sortOrder;
  if (input.publishedAt !== undefined) {
    payload.publishedAt = input.publishedAt
      ? Timestamp.fromDate(input.publishedAt)
      : null;
  }

  if (!partial) {
    payload.authorId = authorId;
    payload.createdAt = FieldValue.serverTimestamp();
  }

  payload.updatedAt = FieldValue.serverTimestamp();
  return payload;
}

export async function getPublishedPosts(
  options: GetPublishedPostsOptions = {},
): Promise<PaginatedResult<Post>> {
  const limit = Math.min(Math.max(options.limit ?? 12, 1), 50);
  const search = options.search?.trim().toLowerCase() || null;
  const categoryIds = [
    ...new Set(
      (options.categoryIds ?? [])
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  ];
  if (options.categoryId && !categoryIds.includes(options.categoryId)) {
    categoryIds.push(options.categoryId);
  }

  let query: Query = adminDb.collection(POSTS).where("status", "==", "published");

  if (categoryIds.length === 1) {
    query = query.where("categoryIds", "array-contains", categoryIds[0]!);
  } else if (categoryIds.length > 1) {
    query = query.where(
      "categoryIds",
      "array-contains-any",
      categoryIds.slice(0, 10),
    );
  }

  if (search) {
    // Prefix range on searchableTitle; first orderBy must be searchableTitle.
    // Search pages follow index order (title ASC, publishedAt DESC), not browse order.
    const end = `${search}\uf8ff`;
    query = query
      .where("searchableTitle", ">=", search)
      .where("searchableTitle", "<", end)
      .orderBy("searchableTitle", "asc")
      .orderBy("publishedAt", "desc");
  } else {
    query = query
      .orderBy("publishedAt", "desc")
      .orderBy("sortOrder", "asc")
      .orderBy(FieldPath.documentId(), "asc");
  }

  if (options.cursor) {
    const c = decodeCursor(options.cursor);
    if (search) {
      query = query.startAfter(
        c.searchableTitle ?? "",
        Timestamp.fromDate(new Date(c.publishedAt)),
      );
    } else {
      query = query.startAfter(
        Timestamp.fromDate(new Date(c.publishedAt)),
        c.sortOrder,
        c.id,
      );
    }
  }

  const snap = await query.limit(limit + 1).get();
  const items = snap.docs.map((doc) => mapPostDoc(doc.id, doc.data()));

  const hasMore = items.length > limit;
  const page = hasMore ? items.slice(0, limit) : items;
  const last = page[page.length - 1];
  const mode = search ? "search" : "browse";

  return {
    items: page,
    nextCursor: hasMore && last ? encodeCursor(last, mode) : null,
    hasMore,
  };
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const snap = await adminDb
    .collection(POSTS)
    .where("slug", "==", slug)
    .limit(1)
    .get();

  if (snap.empty) return null;
  const doc = snap.docs[0]!;
  return mapPostDoc(doc.id, doc.data());
}

export async function getPostById(id: string): Promise<Post | null> {
  const doc = await adminDb.collection(POSTS).doc(id).get();
  if (!doc.exists) return null;
  return mapPostDoc(doc.id, doc.data()!);
}

/**
 * Adjacent published posts relative to the current one's public position.
 * `next` = newer (higher publishedAt); `previous` = older.
 */
export async function getAdjacentPosts(
  publishedAt: Date,
  id: string,
): Promise<AdjacentPosts> {
  const ts = Timestamp.fromDate(publishedAt);

  const newerSnap = await adminDb
    .collection(POSTS)
    .where("status", "==", "published")
    .where("publishedAt", ">", ts)
    .orderBy("publishedAt", "asc")
    .limit(5)
    .get();

  const olderSnap = await adminDb
    .collection(POSTS)
    .where("status", "==", "published")
    .where("publishedAt", "<", ts)
    .orderBy("publishedAt", "desc")
    .limit(5)
    .get();

  // Same publishedAt neighbors (tie-break via sortOrder / id).
  const sameSnap = await adminDb
    .collection(POSTS)
    .where("status", "==", "published")
    .where("publishedAt", "==", ts)
    .orderBy("sortOrder", "asc")
    .orderBy(FieldPath.documentId(), "asc")
    .get();

  const same = sameSnap.docs.map((d) => mapPostDoc(d.id, d.data()));
  const idx = same.findIndex((p) => p.id === id);

  const pick = (
    post: Post | undefined,
  ): AdjacentPosts["previous"] =>
    post
      ? {
          id: post.id,
          slug: post.slug,
          title: post.title,
          publishedAt: post.publishedAt,
          mainImage: post.mainImage,
        }
      : null;

  let previous: AdjacentPosts["previous"] = null;
  let next: AdjacentPosts["next"] = null;

  if (idx >= 0) {
    // In public order (publishedAt DESC, sortOrder ASC, id ASC):
    // within same timestamp, lower index = earlier in list = "next" visually from older perspective.
    previous = pick(same[idx + 1]);
    next = pick(same[idx - 1]);
  }

  if (!next && !newerSnap.empty) {
    const newer = newerSnap.docs
      .map((d) => mapPostDoc(d.id, d.data()))
      .sort(comparePublicOrder);
    next = pick(newer[newer.length - 1]);
  }

  if (!previous && !olderSnap.empty) {
    const older = olderSnap.docs
      .map((d) => mapPostDoc(d.id, d.data()))
      .sort(comparePublicOrder);
    previous = pick(older[0]);
  }

  return { previous, next };
}

export async function getPublishedPostsByIds(ids: string[]): Promise<Post[]> {
  const ordered = uniqueIds(ids);
  if (ordered.length === 0) return [];

  const found = new Map<string, Post>();
  const chunkSize = 30;
  for (let i = 0; i < ordered.length; i += chunkSize) {
    const chunk = ordered.slice(i, i + chunkSize);
    const snap = await adminDb
      .collection(POSTS)
      .where(FieldPath.documentId(), "in", chunk)
      .get();
    for (const doc of snap.docs) {
      const post = mapPostDoc(doc.id, doc.data());
      if (post.status === "published") found.set(post.id, post);
    }
  }

  return ordered
    .map((id) => found.get(id))
    .filter((post): post is Post => Boolean(post));
}

export async function createPost(
  input: CreatePostInput,
  authorId: string,
  options?: { id?: string },
): Promise<Post> {
  const ref = options?.id
    ? adminDb.collection(POSTS).doc(options.id)
    : adminDb.collection(POSTS).doc();
  const payload = toFirestorePostPayload(input, authorId, false);

  if (payload.sortOrder === undefined) {
    payload.sortOrder = 0;
  }

  if (input.status === "published" && !payload.publishedAt) {
    payload.publishedAt = FieldValue.serverTimestamp();
  }

  await ref.set(payload);
  const created = await ref.get();
  return mapPostDoc(created.id, created.data()!);
}

/** Allocate a Firestore document id without writing (for client uploads). */
export function allocatePostId(): string {
  return adminDb.collection(POSTS).doc().id;
}

export interface GetAdminPostsOptions {
  limit?: number;
  status?: PostStatus | "all" | null;
  categoryId?: string | null;
  search?: string | null;
}

export async function getAdminPosts(
  options: GetAdminPostsOptions = {},
): Promise<Post[]> {
  const limit = Math.min(Math.max(options.limit ?? 200, 1), 500);
  const search = options.search?.trim().toLowerCase() || null;
  const status = options.status && options.status !== "all" ? options.status : null;
  const categoryId = options.categoryId || null;

  // Prefer a simple single-field order to avoid composite-index requirements.
  // Status/category filters are applied in memory for the admin CMS.
  let query: Query = adminDb.collection(POSTS);

  if (search) {
    const end = `${search}\uf8ff`;
    query = query
      .where("searchableTitle", ">=", search)
      .where("searchableTitle", "<", end)
      .orderBy("searchableTitle", "asc");
  } else {
    query = query.orderBy("updatedAt", "desc");
  }

  const snap = await query.limit(Math.min(limit * 2, 500)).get();
  let items = snap.docs.map((doc) => mapPostDoc(doc.id, doc.data()));

  if (status) {
    items = items.filter((post) => post.status === status);
  }
  if (categoryId) {
    items = items.filter((post) => post.categoryIds.includes(categoryId));
  }

  return items.slice(0, limit);
}

export interface PostStats {
  total: number;
  published: number;
  drafts: number;
  archived: number;
}

export async function getPostStats(): Promise<PostStats> {
  const snap = await adminDb.collection(POSTS).select("status").get();
  const stats: PostStats = {
    total: snap.size,
    published: 0,
    drafts: 0,
    archived: 0,
  };

  for (const doc of snap.docs) {
    const status = doc.data().status as PostStatus;
    if (status === "published") stats.published += 1;
    else if (status === "draft") stats.drafts += 1;
    else if (status === "archived") stats.archived += 1;
  }

  return stats;
}

export async function countPostsByCategory(categoryId: string): Promise<number> {
  const snap = await adminDb
    .collection(POSTS)
    .where("categoryIds", "array-contains", categoryId)
    .select()
    .get();
  return snap.size;
}

export async function getAllPostsForMedia(): Promise<Post[]> {
  const snap = await adminDb.collection(POSTS).get();
  return snap.docs.map((doc) => mapPostDoc(doc.id, doc.data()));
}

export async function updatePost(
  input: UpdatePostInput,
  authorId: string,
): Promise<Post> {
  const ref = adminDb.collection(POSTS).doc(input.id);
  const existing = await ref.get();
  if (!existing.exists) {
    throw new Error(`Post not found: ${input.id}`);
  }

  const { id: _id, ...rest } = input;
  const payload = toFirestorePostPayload(rest, authorId, true);

  if (
    input.status === "published" &&
    !existing.data()?.publishedAt &&
    input.publishedAt === undefined
  ) {
    payload.publishedAt = FieldValue.serverTimestamp();
  }

  await ref.update(payload);
  const updated = await ref.get();
  return mapPostDoc(updated.id, updated.data()!);
}

export async function deletePost(id: string): Promise<void> {
  await adminDb.collection(POSTS).doc(id).delete();
}

export async function postSlugExists(
  slug: string,
  excludeId?: string,
): Promise<boolean> {
  const snap = await adminDb
    .collection(POSTS)
    .where("slug", "==", slug)
    .limit(5)
    .get();

  if (snap.empty) return false;
  if (!excludeId) return true;
  return snap.docs.some((d) => d.id !== excludeId);
}
