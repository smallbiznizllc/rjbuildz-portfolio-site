import { stripHtml } from "@/lib/utils/sanitize";

export const TAG_MAX_LENGTH = 80;
export const TAG_MAX_COUNT = 24;

export function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const item of value) {
    const tag = String(item).replace(/\s+/g, " ").trim().slice(0, TAG_MAX_LENGTH);
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
    if (tags.length >= TAG_MAX_COUNT) break;
  }
  return tags;
}

/** Pull plain-text items out of a TipTap/HTML list (or newline-separated fallback). */
export function htmlListToTags(html: string): string[] {
  if (!html?.trim()) return [];
  const items = [...html.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)].map((match) =>
    stripHtml(match[1] ?? "")
      .replace(/\s+/g, " ")
      .trim(),
  );
  if (items.some(Boolean)) {
    return normalizeTags(items);
  }
  return normalizeTags(
    stripHtml(html)
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean),
  );
}

export function tagsFromStoredOrHtml(stored: unknown, html: string): string[] {
  const fromStored = normalizeTags(stored);
  if (fromStored.length > 0) return fromStored;
  return htmlListToTags(html);
}
