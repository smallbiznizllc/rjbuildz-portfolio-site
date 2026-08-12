/**
 * Convert a string into a URL-safe kebab-case slug.
 */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 120);
}

/**
 * Ensure a slug is unique given an async existence checker.
 * Appends `-2`, `-3`, … until `exists(slug)` returns false.
 */
export async function ensureUniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
  options?: { maxAttempts?: number },
): Promise<string> {
  const maxAttempts = options?.maxAttempts ?? 100;
  const root = slugify(base) || "item";

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const candidate = attempt === 0 ? root : `${root}-${attempt + 1}`;
    // Keep within slug length budget when appending suffixes.
    const trimmed =
      candidate.length > 120
        ? `${root.slice(0, Math.max(1, 120 - String(attempt + 1).length - 1))}-${attempt + 1}`
        : candidate;

    if (!(await exists(trimmed))) {
      return trimmed;
    }
  }

  throw new Error(`Unable to generate a unique slug for "${base}"`);
}
