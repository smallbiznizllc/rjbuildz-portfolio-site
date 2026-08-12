import { describe, expect, it } from "vitest";
import { sanitizeHtml, stripHtml } from "@/lib/utils/sanitize";

describe("sanitizeHtml", () => {
  it("keeps allowed formatting tags", () => {
    const html = sanitizeHtml(
      "<p>Hello <strong>world</strong> and <em>friends</em></p>",
    );
    expect(html).toContain("<p>");
    expect(html).toContain("<strong>");
    expect(html).toContain("<em>");
  });

  it("strips script tags and event handlers", () => {
    const html = sanitizeHtml(
      '<p onclick="alert(1)">Safe</p><script>alert(2)</script>',
    );
    expect(html).not.toContain("script");
    expect(html).not.toContain("onclick");
    expect(html).toContain("Safe");
  });

  it("allows safe links and images", () => {
    const html = sanitizeHtml(
      '<a href="https://example.com">site</a><img src="https://picsum.photos/200" alt="x" />',
    );
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain("<img");
  });
});

describe("stripHtml", () => {
  it("removes all tags", () => {
    expect(stripHtml("<p>Hello <b>world</b></p>")).toBe("Hello world");
  });
});
