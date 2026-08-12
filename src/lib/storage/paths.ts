/**
 * Deterministic Storage object paths for post media.
 * Public reads are allowed for posts/** via storage.rules.
 */

function sanitizeSegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function extensionFromFileName(fileName: string): string {
  const parts = fileName.split(".");
  const ext = parts.length > 1 ? parts.pop()!.toLowerCase() : "jpg";
  if (["jpg", "jpeg", "png", "webp", "avif"].includes(ext)) {
    return ext === "jpeg" ? "jpg" : ext;
  }
  return "jpg";
}

export function generateMainImagePath(
  postId: string,
  fileName: string,
): string {
  const safePostId = sanitizeSegment(postId) || "post";
  const ext = extensionFromFileName(fileName);
  return `posts/${safePostId}/main/${Date.now()}.${ext}`;
}

export function generateGalleryImagePath(
  postId: string,
  imageId: string,
  fileName: string,
): string {
  const safePostId = sanitizeSegment(postId) || "post";
  const safeImageId = sanitizeSegment(imageId) || "image";
  const ext = extensionFromFileName(fileName);
  return `posts/${safePostId}/gallery/${safeImageId}-${Date.now()}.${ext}`;
}
