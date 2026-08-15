import type { GalleryImage, Post, PostImage, PostStatus, SEO } from "@/types";

/** Serializable post shape passed from Server Components into PostForm. */
export interface PostFormPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  features: string;
  builtUsing: string;
  seeItLive: string | null;
  status: PostStatus;
  categoryIds: string[];
  mainImage: PostImage | null;
  gallery: GalleryImage[];
  seo: SEO;
  sortOrder: number;
  publishedAt: string | null;
}

export function toPostFormPost(post: Post): PostFormPost {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    features: post.features,
    builtUsing: post.builtUsing,
    seeItLive: post.seeItLive,
    status: post.status,
    categoryIds: post.categoryIds ?? [],
    mainImage: post.mainImage,
    gallery: post.gallery,
    seo: post.seo,
    sortOrder: post.sortOrder,
    publishedAt: post.publishedAt?.toISOString() ?? null,
  };
}
