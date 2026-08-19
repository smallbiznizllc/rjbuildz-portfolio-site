import "server-only";

import { DEFAULT_GLOBAL_SEO } from "@/lib/seo/global";
import type {
  AdjacentPosts,
  Category,
  PaginatedResult,
  Post,
  SiteSettings,
} from "@/types";

/** Soft-fail wrapper so public pages never crash when Firebase is unset. */
export async function safeCall<T>(
  fn: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[safeCall]", error);
    }
    return fallback;
  }
}

export async function safeGetPublishedPosts(options?: {
  limit?: number;
  cursor?: string | null;
  categoryId?: string | null;
  categoryIds?: string[] | null;
  search?: string | null;
}): Promise<PaginatedResult<Post>> {
  const empty: PaginatedResult<Post> = {
    items: [],
    nextCursor: null,
    hasMore: false,
  };
  return safeCall(async () => {
    const { getPublishedPosts } = await import("@/lib/firestore/posts");
    return getPublishedPosts(options);
  }, empty);
}

export async function safeGetCategories(): Promise<Category[]> {
  return safeCall(async () => {
    const { getCategories } = await import("@/lib/firestore/categories");
    return getCategories();
  }, []);
}

/** Categories that have at least one published post (for public filters). */
export async function safeGetCategoriesWithPublishedPosts(): Promise<
  Category[]
> {
  return safeCall(async () => {
    const { getCategoriesWithPublishedPosts } = await import(
      "@/lib/firestore/categories"
    );
    return getCategoriesWithPublishedPosts();
  }, []);
}

export async function safeGetCategoryBySlug(
  slug: string,
): Promise<Category | null> {
  return safeCall(async () => {
    const { getCategoryBySlug } = await import("@/lib/firestore/categories");
    return getCategoryBySlug(slug);
  }, null);
}

export async function safeGetPostBySlug(slug: string): Promise<Post | null> {
  return safeCall(async () => {
    const { getPostBySlug } = await import("@/lib/firestore/posts");
    return getPostBySlug(slug);
  }, null);
}

export async function safeGetAdjacentPosts(
  publishedAt: Date,
  id: string,
): Promise<AdjacentPosts> {
  return safeCall(async () => {
    const { getAdjacentPosts } = await import("@/lib/firestore/posts");
    return getAdjacentPosts(publishedAt, id);
  }, { previous: null, next: null });
}

export async function safeGetPublishedPostsByIds(
  ids: string[],
): Promise<Post[]> {
  if (!ids.length) return [];
  return safeCall(async () => {
    const { getPublishedPostsByIds } = await import("@/lib/firestore/posts");
    return getPublishedPostsByIds(ids);
  }, []);
}

const EMPTY_SITE_SETTINGS: SiteSettings = {
  siteName: "RJ Buildz",
  owner: null,
  aboutBlurb: null,
  tagline: null,
  contactEmail: null,
  logoUrl: null,
  socialAccounts: [],
  socialLinks: {},
  seo: DEFAULT_GLOBAL_SEO,
  updatedAt: new Date(0),
  updatedBy: null,
};

export async function safeGetSiteSettings(): Promise<SiteSettings> {
  return safeCall(async () => {
    const { getSiteSettings } = await import("@/lib/firestore/settings");
    return getSiteSettings();
  }, EMPTY_SITE_SETTINGS);
}
