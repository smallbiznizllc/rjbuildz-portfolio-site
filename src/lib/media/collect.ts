import type { Post } from "@/types";

export interface MediaItem {
  path: string;
  url: string;
  alt: string;
  kind: "main" | "gallery";
  postId: string;
  postTitle: string;
  galleryImageId?: string;
}

/** Flatten main + gallery images from posts (requires a Storage path). */
export function collectMediaItems(posts: Post[]): MediaItem[] {
  const items: MediaItem[] = [];

  for (const post of posts) {
    if (post.mainImage?.path) {
      items.push({
        path: post.mainImage.path,
        url: post.mainImage.url,
        alt: post.mainImage.alt,
        kind: "main",
        postId: post.id,
        postTitle: post.title || "Untitled",
      });
    }
    for (const image of post.gallery) {
      if (!image.path) continue;
      items.push({
        path: image.path,
        url: image.url,
        alt: image.alt,
        kind: "gallery",
        postId: post.id,
        postTitle: post.title || "Untitled",
        galleryImageId: image.id,
      });
    }
  }

  return items;
}

/** Unique library entries by Storage path (main images included for reuse). */
export function dedupeMediaByPath(items: MediaItem[]): MediaItem[] {
  const seen = new Map<string, MediaItem>();
  for (const item of items) {
    const existing = seen.get(item.path);
    if (!existing) {
      seen.set(item.path, item);
      continue;
    }
    // Prefer a main-image occurrence when the same file is attached both ways.
    if (existing.kind !== "main" && item.kind === "main") {
      seen.set(item.path, item);
    }
  }
  return Array.from(seen.values());
}

export function countPathReferences(posts: Post[], path: string): number {
  if (!path) return 0;
  let count = 0;
  for (const post of posts) {
    if (post.mainImage?.path === path) count += 1;
    for (const image of post.gallery) {
      if (image.path === path) count += 1;
    }
  }
  return count;
}

function sanitizeSegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** True when the object lives under this post's Storage prefix. */
export function isOwnedStoragePath(path: string, postId: string): boolean {
  if (!path || !postId) return false;
  const safePostId = sanitizeSegment(postId) || "post";
  return path.startsWith(`posts/${safePostId}/`);
}
