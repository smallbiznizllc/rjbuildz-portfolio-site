import { z } from "zod";

export const postStatusSchema = z.enum(["draft", "published", "archived"]);

export const slugSchema = z
  .string()
  .trim()
  .min(1, "Slug is required")
  .max(120, "Slug must be 120 characters or fewer")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug must be lowercase kebab-case (a-z, 0-9, hyphens)",
  );

export const seoSchema = z.object({
  title: z.string().trim().max(70).nullable().optional().default(null),
  description: z.string().trim().max(160).nullable().optional().default(null),
  ogImage: z
    .union([z.string().url(), z.literal(""), z.null()])
    .optional()
    .default(null),
  keywords: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
});

export const postImageSchema = z.object({
  // Empty path is allowed for external/placeholder URLs (e.g. seed data).
  path: z.string().default(""),
  url: z.string().url("Image URL is invalid"),
  alt: z.string().trim().max(200).default(""),
  width: z.number().int().positive().nullable().optional().default(null),
  height: z.number().int().positive().nullable().optional().default(null),
});

export const galleryImageSchema = postImageSchema.extend({
  id: z.string().min(1, "Gallery image id is required"),
  sortOrder: z.number().int().min(0).default(0),
  caption: z.string().trim().max(300).nullable().optional().default(null),
});

export const createPostSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(160),
  slug: slugSchema,
  excerpt: z.string().trim().max(500).default(""),
  content: z.string().default(""),
  features: z.string().default(""),
  featureTags: z
    .array(z.string().trim().min(1).max(80))
    .max(24)
    .default([]),
  builtUsing: z.string().default(""),
  createdWithTags: z
    .array(z.string().trim().min(1).max(80))
    .max(24)
    .default([]),
  seeItLive: z
    .union([z.string().trim().url("Enter a valid URL"), z.literal(""), z.null()])
    .optional()
    .default(null),
  inProgress: z.boolean().default(false),
  favorite: z.boolean().default(false),
  status: postStatusSchema.default("draft"),
  categoryIds: z
    .array(z.string().min(1))
    .max(20)
    .default([]),
  mainImage: postImageSchema.nullable().optional().default(null),
  gallery: z.array(galleryImageSchema).max(50).default([]),
  seo: seoSchema.optional().default({
    title: null,
    description: null,
    ogImage: null,
    keywords: [],
  }),
  sortOrder: z.number().int().min(0).default(0),
  publishedAt: z.coerce.date().nullable().optional().default(null),
});

export const updatePostSchema = createPostSchema.partial().extend({
  id: z.string().min(1),
});

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  slug: slugSchema,
  description: z.string().trim().max(500).nullable().optional().default(null),
  sortOrder: z.number().int().min(0).default(0),
});

export const updateCategorySchema = createCategorySchema.partial().extend({
  id: z.string().min(1),
});

export const contactMessageSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Valid email required").max(254),
  subject: z.string().trim().max(200).optional().default(""),
  message: z.string().trim().min(1, "Message is required").max(5000),
});

export const imageUploadMetaSchema = z.object({
  contentType: z.enum([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/avif",
  ]),
  size: z
    .number()
    .int()
    .positive()
    .max(10 * 1024 * 1024, "Image must be under 10MB"),
  fileName: z.string().min(1).max(255),
});

export const siteSettingsSchema = z.object({
  siteName: z.string().trim().min(1, "Site name is required").max(120),
  owner: z.string().trim().max(120).nullable().optional().default(null),
  aboutBlurb: z.string().trim().max(2000).nullable().optional().default(null),
  tagline: z.string().trim().max(200).nullable().optional().default(null),
  contactEmail: z
    .union([z.string().trim().email().max(254), z.literal(""), z.null()])
    .optional()
    .default(null),
  logoUrl: z
    .union([z.string().url(), z.literal(""), z.null()])
    .optional()
    .default(null),
  socialLinks: z
    .object({
      instagram: z.string().url().optional(),
      facebook: z.string().url().optional(),
      linkedin: z.string().url().optional(),
      youtube: z.string().url().optional(),
      x: z.string().url().optional(),
      website: z.string().url().optional(),
    })
    .optional()
    .default({}),
});

export const socialNetworkIdSchema = z.enum([
  "instagram",
  "facebook",
  "linkedin",
  "x",
  "youtube",
  "github",
  "dribbble",
  "behance",
  "pinterest",
  "tiktok",
  "threads",
  "vimeo",
  "bluesky",
  "website",
]);

export const socialAccountSchema = z.object({
  id: z.string().min(1),
  network: socialNetworkIdSchema,
  handle: z.string().trim().min(1, "Enter a URL or handle").max(300),
  href: z.string().url("Enter a valid URL"),
  sortOrder: z.number().int().min(0).default(0),
});

export const socialAccountsSchema = z
  .array(socialAccountSchema)
  .max(20, "You can add up to 20 social accounts");

const optionalText = z
  .union([z.string().trim().max(500), z.literal(""), z.null()])
  .optional()
  .transform((value) => {
    if (value == null || value === "") return null;
    return value;
  });

const optionalUrl = z
  .union([z.string().trim().url("Enter a valid URL"), z.literal(""), z.null()])
  .optional()
  .transform((value) => {
    if (value == null || value === "") return null;
    return value;
  });

const trackingIdSchema = z
  .union([
    z
      .string()
      .trim()
      .regex(
        /^(G|GT|AW|UA)-[A-Z0-9-]+$/i,
        "Use a GA ID such as G-XXXXXXXX",
      ),
    z.literal(""),
    z.null(),
  ])
  .optional()
  .transform((value) => {
    if (value == null || value === "") return null;
    return value.toUpperCase();
  });

const gtmIdSchema = z
  .union([
    z
      .string()
      .trim()
      .regex(/^GTM-[A-Z0-9]+$/i, "Use a GTM ID such as GTM-XXXXXXX"),
    z.literal(""),
    z.null(),
  ])
  .optional()
  .transform((value) => {
    if (value == null || value === "") return null;
    return value.toUpperCase();
  });

export const globalSeoSchema = z.object({
  googleAnalyticsId: trackingIdSchema.default(null),
  googleTagManagerId: gtmIdSchema.default(null),
  googleSiteVerification: optionalText.default(null),
  metaTitle: z
    .union([z.string().trim().max(70), z.literal(""), z.null()])
    .optional()
    .transform((value) => (value == null || value === "" ? null : value))
    .default(null),
  metaDescription: z
    .union([z.string().trim().max(160), z.literal(""), z.null()])
    .optional()
    .transform((value) => (value == null || value === "" ? null : value))
    .default(null),
  metaKeywords: z.array(z.string().trim().min(1).max(40)).max(24).default([]),
  canonicalUrl: optionalUrl.default(null),
  robotsIndex: z.boolean().default(true),
  robotsFollow: z.boolean().default(true),
  ogTitle: z
    .union([z.string().trim().max(70), z.literal(""), z.null()])
    .optional()
    .transform((value) => (value == null || value === "" ? null : value))
    .default(null),
  ogDescription: z
    .union([z.string().trim().max(200), z.literal(""), z.null()])
    .optional()
    .transform((value) => (value == null || value === "" ? null : value))
    .default(null),
  ogImageUrl: optionalUrl.default(null),
  ogType: z
    .enum(["website", "article", "profile", "book"])
    .default("website"),
  twitterCard: z.enum(["summary", "summary_large_image"]).default(
    "summary_large_image",
  ),
  twitterHandle: optionalText.default(null),
  schemaJson: z
    .union([z.string(), z.literal(""), z.null()])
    .optional()
    .transform((value) => {
      if (value == null || !value.trim()) return null;
      return value.trim();
    })
    .refine((value) => {
      if (value == null) return true;
      try {
        const parsed = JSON.parse(value) as unknown;
        return typeof parsed === "object" && parsed !== null;
      } catch {
        return false;
      }
    }, "Schema.org JSON-LD must be valid JSON")
    .default(null),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type ContactMessageInput = z.infer<typeof contactMessageSchema>;
export type ImageUploadMeta = z.infer<typeof imageUploadMetaSchema>;
export type SiteSettingsInput = z.infer<typeof siteSettingsSchema>;
export type SocialAccountInput = z.infer<typeof socialAccountSchema>;
export type SocialAccountsInput = z.infer<typeof socialAccountsSchema>;
export type GlobalSeoInput = z.infer<typeof globalSeoSchema>;
