import { describe, expect, it } from "vitest";
import { resolveSocialHref } from "@/lib/social/networks";
import { socialAccountsSchema } from "@/lib/validation/schemas";

describe("resolveSocialHref", () => {
  it("keeps a full URL", () => {
    expect(resolveSocialHref("instagram", "https://instagram.com/rjbuildz")).toBe(
      "https://instagram.com/rjbuildz",
    );
  });

  it("turns a handle into a profile URL", () => {
    expect(resolveSocialHref("instagram", "@rjbuildz")).toBe(
      "https://www.instagram.com/rjbuildz",
    );
    expect(resolveSocialHref("github", "rjbuildz")).toBe(
      "https://github.com/rjbuildz",
    );
    expect(resolveSocialHref("tiktok", "@rjbuildz")).toBe(
      "https://www.tiktok.com/@rjbuildz",
    );
  });

  it("prefixes website domains with https", () => {
    expect(resolveSocialHref("website", "rjbuildz.com")).toBe(
      "https://rjbuildz.com/",
    );
  });

  it("turns an email address into a mailto link", () => {
    expect(resolveSocialHref("email", "hello@example.com")).toBe(
      "mailto:hello@example.com",
    );
  });

  it("turns a phone number into a tel link", () => {
    expect(resolveSocialHref("phone", "+1 (555) 123-4567")).toBe(
      "tel:+15551234567",
    );
    expect(resolveSocialHref("phone", "555-123-4567")).toBe("tel:5551234567");
    expect(resolveSocialHref("phone", "tel:+15551234567")).toBe(
      "tel:+15551234567",
    );
  });

  it("rejects empty input", () => {
    expect(() => resolveSocialHref("x", "  ")).toThrow("Enter a URL or handle");
  });
});

describe("socialAccountsSchema", () => {
  it("accepts a valid account list", () => {
    const result = socialAccountsSchema.safeParse([
      {
        id: "1",
        network: "linkedin",
        handle: "in/rafael",
        href: "https://www.linkedin.com/in/rafael",
        sortOrder: 0,
      },
    ]);
    expect(result.success).toBe(true);
  });

  it("accepts a mailto email account", () => {
    const result = socialAccountsSchema.safeParse([
      {
        id: "2",
        network: "email",
        handle: "hello@example.com",
        href: "mailto:hello@example.com",
        sortOrder: 1,
      },
    ]);
    expect(result.success).toBe(true);
  });

  it("accepts a tel phone account", () => {
    const result = socialAccountsSchema.safeParse([
      {
        id: "3",
        network: "phone",
        handle: "+1 (555) 123-4567",
        href: "tel:+15551234567",
        sortOrder: 2,
      },
    ]);
    expect(result.success).toBe(true);
  });

  it("rejects an unknown network", () => {
    const result = socialAccountsSchema.safeParse([
      {
        id: "1",
        network: "myspace",
        handle: "rj",
        href: "https://example.com",
        sortOrder: 0,
      },
    ]);
    expect(result.success).toBe(false);
  });
});
