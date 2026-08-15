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
  builtUsing: z.string().default(""),
  seeItLive: z
    .union([z.string().trim().url("Enter a valid URL"), z.literal(""), z.null()])
    .optional()
    .default(null),
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

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type ContactMessageInput = z.infer<typeof contactMessageSchema>;
export type ImageUploadMeta = z.infer<typeof imageUploadMetaSchema>;
export type SiteSettingsInput = z.infer<typeof siteSettingsSchema>;
