import { describe, expect, it } from "vitest";
import { ensureUniqueSlug, slugify } from "@/lib/utils/slug";

describe("slugify", () => {
  it("converts titles to kebab-case", () => {
    expect(slugify("Hello World")).toBe("hello-world");
    expect(slugify("  Post B — Midwinter  ")).toBe("post-b-midwinter");
  });

  it("strips diacritics", () => {
    expect(slugify("Café Résumé")).toBe("cafe-resume");
  });

  it("collapses punctuation and hyphens", () => {
    expect(slugify("A---B!!!C")).toBe("a-b-c");
  });

  it("caps length at 120", () => {
    const long = "a".repeat(200);
    expect(slugify(long).length).toBe(120);
  });
});

describe("ensureUniqueSlug", () => {
  it("returns the base slug when unused", async () => {
    const slug = await ensureUniqueSlug("My Post", async () => false);
    expect(slug).toBe("my-post");
  });

  it("appends -2, -3 when collisions exist", async () => {
    const taken = new Set(["my-post", "my-post-2"]);
    const slug = await ensureUniqueSlug("My Post", async (candidate) =>
      taken.has(candidate),
    );
    expect(slug).toBe("my-post-3");
  });
});
