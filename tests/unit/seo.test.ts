import { describe, expect, it } from "vitest";
import {
  buildRootMetadata,
  parseGlobalSeo,
  safeSchemaJson,
  sanitizeGaId,
  sanitizeGtmId,
  twitterHandleValue,
} from "@/lib/seo/global";
import { globalSeoSchema } from "@/lib/validation/schemas";

describe("globalSeoSchema", () => {
  it("accepts empty defaults", () => {
    const result = globalSeoSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.googleAnalyticsId).toBeNull();
      expect(result.data.robotsIndex).toBe(true);
      expect(result.data.twitterCard).toBe("summary_large_image");
    }
  });

  it("accepts a GA4 measurement ID", () => {
    const result = globalSeoSchema.safeParse({
      googleAnalyticsId: "g-abc123xyz",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.googleAnalyticsId).toBe("G-ABC123XYZ");
    }
  });

  it("rejects an invalid analytics ID", () => {
    const result = globalSeoSchema.safeParse({
      googleAnalyticsId: "not-a-ga-id",
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid schema.org JSON", () => {
    const result = globalSeoSchema.safeParse({
      schemaJson: '{"@context":"https://schema.org","@type":"Person","name":"RJ"}',
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid schema.org JSON", () => {
    const result = globalSeoSchema.safeParse({
      schemaJson: "{not json",
    });
    expect(result.success).toBe(false);
  });

  it("rejects JSON primitives for schema.org", () => {
    const result = globalSeoSchema.safeParse({
      schemaJson: '"just a string"',
    });
    expect(result.success).toBe(false);
  });
});

describe("parseGlobalSeo", () => {
  it("falls back to safe defaults", () => {
    const seo = parseGlobalSeo(undefined);
    expect(seo.robotsIndex).toBe(true);
    expect(seo.ogType).toBe("website");
    expect(seo.metaKeywords).toEqual([]);
  });
});

describe("safeSchemaJson", () => {
  it("re-stringifies valid objects", () => {
    expect(safeSchemaJson('{"@type":"Person"}')).toBe('{"@type":"Person"}');
  });

  it("returns null for invalid JSON", () => {
    expect(safeSchemaJson("<script>alert(1)</script>")).toBeNull();
  });
});

describe("tracking ID sanitizers", () => {
  it("keeps valid GA and GTM IDs", () => {
    expect(sanitizeGaId("G-ABCDEF12")).toBe("G-ABCDEF12");
    expect(sanitizeGtmId("gtm-n4abcd")).toBe("GTM-N4ABCD");
  });

  it("drops unexpected values", () => {
    expect(sanitizeGaId("https://evil.example")).toBeNull();
    expect(sanitizeGtmId("GTM-XX';alert(1)")).toBeNull();
  });
});

describe("buildRootMetadata", () => {
  it("uses site defaults when SEO fields are empty", () => {
    const metadata = buildRootMetadata(parseGlobalSeo({}));
    expect(metadata.title).toEqual({
      default: "RJ Buildz — Creative Portfolio",
      template: "%s · RJ Buildz",
    });
  });

  it("prefers custom title and twitter handle", () => {
    const metadata = buildRootMetadata(
      parseGlobalSeo({
        metaTitle: "Custom title",
        twitterHandle: "rjbuildz",
      }),
    );
    expect(metadata.title).toMatchObject({ default: "Custom title" });
    expect(metadata.twitter).toMatchObject({
      creator: "@rjbuildz",
      site: "@rjbuildz",
    });
  });
});

describe("twitterHandleValue", () => {
  it("normalizes a handle", () => {
    expect(twitterHandleValue("rjbuildz")).toBe("@rjbuildz");
    expect(twitterHandleValue("@rjbuildz")).toBe("@rjbuildz");
  });
});
