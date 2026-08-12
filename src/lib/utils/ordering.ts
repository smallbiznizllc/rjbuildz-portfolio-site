/**
 * Public feed ordering for published posts.
 *
 * Never use createdAt for public lists. Order is:
 *   1. publishedAt DESC
 *   2. sortOrder ASC (tie-break)
 *   3. id ASC (final tie-break)
 */

export interface PublicOrderable {
  id: string;
  publishedAt: Date | null;
  sortOrder: number;
}

/**
 * Comparator for Array.prototype.sort.
 * Returns negative when `a` should appear before `b` in the public feed.
 */
export function comparePublicOrder(
  a: PublicOrderable,
  b: PublicOrderable,
): number {
  const aTime = a.publishedAt?.getTime() ?? 0;
  const bTime = b.publishedAt?.getTime() ?? 0;
  if (aTime !== bTime) return bTime - aTime; // publishedAt DESC
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder; // ASC
  return a.id.localeCompare(b.id); // ASC
}

/**
 * Sort a copy of posts into public feed order.
 */
export function sortByPublicOrder<T extends PublicOrderable>(items: T[]): T[] {
  return [...items].sort(comparePublicOrder);
}
