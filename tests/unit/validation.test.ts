import { describe, expect, it } from "vitest";
import {
  contactMessageSchema,
  createPostSchema,
} from "@/lib/validation/schemas";

describe("createPostSchema", () => {
  const valid = {
    title: "Harbor kitchen",
    slug: "harbor-kitchen",
    excerpt: "A remodel",
    content: "<p>Details</p>",
    status: "published" as const,
    categoryIds: ["cat-projects"],
    sortOrder: 0,
    publishedAt: new Date("2025-02-15T00:00:00.000Z"),
  };

  it("accepts a valid published post", () => {
    const result = createPostSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.slug).toBe("harbor-kitchen");
      expect(result.data.status).toBe("published");
    }
  });

  it("rejects invalid slugs", () => {
    const result = createPostSchema.safeParse({
      ...valid,
      slug: "Not Valid!",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty titles", () => {
    const result = createPostSchema.safeParse({ ...valid, title: "  " });
    expect(result.success).toBe(false);
  });

  it("defaults status to draft", () => {
    const { status: _status, ...rest } = valid;
    const result = createPostSchema.parse(rest);
    expect(result.status).toBe("draft");
  });

  it("defaults relatedPostIds to an empty list", () => {
    const result = createPostSchema.parse(valid);
    expect(result.relatedPostIds).toEqual([]);
  });

  it("rejects more than 8 related posts", () => {
    const result = createPostSchema.safeParse({
      ...valid,
      relatedPostIds: Array.from({ length: 9 }, (_, i) => `post-${i}`),
    });
    expect(result.success).toBe(false);
  });

  it("defaults gallery items to kind image", () => {
    const result = createPostSchema.parse({
      ...valid,
      gallery: [
        {
          id: "g1",
          path: "",
          url: "https://example.com/a.jpg",
          alt: "",
          sortOrder: 0,
        },
      ],
    });
    expect(result.gallery[0]?.kind).toBe("image");
  });

  it("accepts a gallery video with a YouTube URL", () => {
    const result = createPostSchema.safeParse({
      ...valid,
      gallery: [
        {
          id: "v1",
          path: "",
          url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
          alt: "Demo",
          sortOrder: 0,
          kind: "video",
          sourceUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          posterUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
        },
      ],
    });
    expect(result.success).toBe(true);
  });
});

describe("contactMessageSchema", () => {
  it("accepts a valid message", () => {
    const result = contactMessageSchema.safeParse({
      name: "Ada",
      email: "ada@example.com",
      subject: "Project",
      message: "Hello there",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = contactMessageSchema.safeParse({
      name: "Ada",
      email: "not-an-email",
      message: "Hello",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty message", () => {
    const result = contactMessageSchema.safeParse({
      name: "Ada",
      email: "ada@example.com",
      message: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects oversized name", () => {
    const result = contactMessageSchema.safeParse({
      name: "x".repeat(121),
      email: "ada@example.com",
      message: "Hi",
    });
    expect(result.success).toBe(false);
  });
});
