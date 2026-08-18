/**
 * Shared domain types for the portfolio CMS.
 * Timestamps are represented as Date at the application boundary;
 * Firestore Timestamp values are converted in data-access helpers.
 */

export type PostStatus = "draft" | "published" | "archived";

export type UserRole = "admin" | "user";

export interface User {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SEO {
  title: string | null;
  description: string | null;
  ogImage: string | null;
  keywords: string[];
}

export interface PostImage {
  path: string;
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
}

export interface GalleryImage extends PostImage {
  id: string;
  sortOrder: number;
  caption: string | null;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  /** Lowercase title used for prefix search range queries. */
  searchableTitle: string;
  excerpt: string;
  /** Sanitized HTML body. */
  content: string;
  /** Sanitized HTML for the Features section (optional, legacy). */
  features: string;
  /** Tag list shown as pills on the project page. */
  featureTags: string[];
  /** Sanitized HTML for the Created with section (optional, legacy). */
  builtUsing: string;
  /** Tag list shown as pills on the project page. */
  createdWithTags: string[];
  /** External live demo URL (optional). */
  seeItLive: string | null;
  /** Shown as an “In Progress” chip on public masonry cards. */
  inProgress: boolean;
  /** Shown as a star on public masonry cards. */
  favorite: boolean;
  status: PostStatus;
  /** One or more category document IDs. */
  categoryIds: string[];
  mainImage: PostImage | null;
  gallery: GalleryImage[];
  seo: SEO;
  /** Manual ordering within the same publishedAt (lower = earlier in list after publishedAt DESC). */
  sortOrder: number;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  read: boolean;
  createdAt: Date;
  source?: string | null;
  userAgent?: string | null;
}

export type SocialNetworkId =
  | "instagram"
  | "facebook"
  | "linkedin"
  | "x"
  | "youtube"
  | "github"
  | "dribbble"
  | "behance"
  | "pinterest"
  | "tiktok"
  | "threads"
  | "vimeo"
  | "bluesky"
  | "website";

export interface SocialAccount {
  id: string;
  network: SocialNetworkId;
  handle: string;
  href: string;
  sortOrder: number;
}

export interface GlobalSeo {
  googleAnalyticsId: string | null;
  googleTagManagerId: string | null;
  googleSiteVerification: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string[];
  canonicalUrl: string | null;
  robotsIndex: boolean;
  robotsFollow: boolean;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImageUrl: string | null;
  ogType: string;
  twitterCard: "summary" | "summary_large_image";
  twitterHandle: string | null;
  schemaJson: string | null;
}

export interface SiteSettings {
  siteName: string;
  owner: string | null;
  aboutBlurb: string | null;
  tagline: string | null;
  contactEmail: string | null;
  logoUrl: string | null;
  socialAccounts: SocialAccount[];
  /** @deprecated derived from socialAccounts for older backups */
  socialLinks: {
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    youtube?: string;
    x?: string;
    website?: string;
  };
  seo: GlobalSeo;
  updatedAt: Date;
  updatedBy: string | null;
}

export interface PaginatedResult<T> {
  items: T[];
  /** Opaque cursor for the next page (usually last item id or composite key). */
  nextCursor: string | null;
  hasMore: boolean;
}

export interface PublishedPostsCursor {
  publishedAt: string;
  sortOrder: number;
  id: string;
}

export interface AdjacentPosts {
  previous: Pick<
    Post,
    "id" | "slug" | "title" | "publishedAt" | "mainImage"
  > | null;
  next: Pick<
    Post,
    "id" | "slug" | "title" | "publishedAt" | "mainImage"
  > | null;
}
