import type { Category, PostTag } from "@/types";

type CategoryRef = Pick<Category, "id" | "name" | "slug">;
type TagRef = Pick<PostTag, "id" | "name"> & { slug?: string };

function categoryKeys(categories: CategoryRef[]) {
  const ids = new Set(categories.map((category) => category.id));
  const names = new Set(categories.map((category) => category.name.toLowerCase()));
  const slugs = new Set(categories.map((category) => category.slug.toLowerCase()));
  return { ids, names, slugs };
}

/** True when a tag duplicates a category (same id, name, or slug). */
export function isCategoryDuplicateTag(
  tag: TagRef,
  categories: CategoryRef[],
): boolean {
  const { ids, names, slugs } = categoryKeys(categories);
  if (ids.has(tag.id)) return true;
  if (names.has(tag.name.toLowerCase())) return true;
  if (tag.slug && slugs.has(tag.slug.toLowerCase())) return true;
  return false;
}

export function sortTagsAlphabetically<T extends TagRef>(tags: T[]): T[] {
  return [...tags].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  );
}

export function filterTagsExcludingCategories<T extends TagRef>(
  tags: T[],
  categories: CategoryRef[],
): T[] {
  return sortTagsAlphabetically(
    tags.filter((tag) => !isCategoryDuplicateTag(tag, categories)),
  );
}

export function filterTagIdsExcludingCategories(
  tagIds: string[],
  tags: TagRef[],
  categories: CategoryRef[],
): string[] {
  const { ids: categoryIds } = categoryKeys(categories);
  const duplicateTagIds = new Set(
    tags
      .filter((tag) => isCategoryDuplicateTag(tag, categories))
      .map((tag) => tag.id),
  );

  return tagIds.filter(
    (id) => !categoryIds.has(id) && !duplicateTagIds.has(id),
  );
}

export function categoryNameTaken(
  name: string,
  categories: CategoryRef[],
): boolean {
  const trimmed = name.trim().toLowerCase();
  return categories.some((category) => category.name.toLowerCase() === trimmed);
}
