import sanitize from "sanitize-html";

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "a",
  "ul",
  "ol",
  "li",
  "blockquote",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "pre",
  "code",
  "hr",
  "img",
  "figure",
  "figcaption",
  "span",
  "div",
];

const ALLOWED_ATTR: Record<string, string[]> = {
  a: ["href", "name", "target", "rel", "class", "title"],
  img: ["src", "alt", "title", "width", "height", "class"],
  "*": ["class", "title"],
};

/**
 * Sanitize rich-text HTML from the editor before persistence or public render.
 * Uses sanitize-html (no jsdom) so Vercel serverless/SSR stays stable.
 */
export function sanitizeHtml(dirty: string): string {
  return sanitize(dirty, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTR,
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowProtocolRelative: false,
    transformTags: {
      a: sanitize.simpleTransform(
        "a",
        {
          target: "_blank",
          rel: "noopener noreferrer",
        },
        true,
      ),
    },
  });
}

/**
 * Strip all HTML — useful for excerpts / plain-text previews.
 */
export function stripHtml(dirty: string): string {
  return sanitize(dirty, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();
}
