import type { GalleryImage, Post, PostImage, PostStatus, SEO } from "@/types";

/** Serializable post shape passed from Server Components into PostForm. */
export interface PostFormPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  features: string;
  featureTagIds: string[];
  featureTags: string[];
  builtUsing: string;
  createdWithTagIds: string[];
  createdWithTags: string[];
  seeItLive: string | null;
  inProgress: boolean;
  favorite: boolean;
  status: PostStatus;
  categoryIds: string[];
  relatedPostIds: string[];
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
    featureTagIds: post.featureTagIds ?? [],
    featureTags: post.featureTags,
    builtUsing: post.builtUsing,
    createdWithTagIds: post.createdWithTagIds ?? [],
    createdWithTags: post.createdWithTags,
    seeItLive: post.seeItLive,
    inProgress: post.inProgress,
    favorite: post.favorite,
    status: post.status,
    categoryIds: post.categoryIds ?? [],
    relatedPostIds: post.relatedPostIds ?? [],
    mainImage: post.mainImage,
    gallery: post.gallery,
    seo: post.seo,
    sortOrder: post.sortOrder,
    publishedAt: post.publishedAt?.toISOString() ?? null,
  };
}
