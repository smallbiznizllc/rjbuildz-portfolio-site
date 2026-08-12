import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";

function toDate(value: Date | string | number | null | undefined): Date | null {
  if (value == null) return null;
  if (value instanceof Date) return isValid(value) ? value : null;
  if (typeof value === "number") {
    const d = new Date(value);
    return isValid(d) ? d : null;
  }
  const parsed = parseISO(value);
  if (isValid(parsed)) return parsed;
  const fallback = new Date(value);
  return isValid(fallback) ? fallback : null;
}

/** e.g. "August 10, 2026" */
export function formatPublishedDate(
  value: Date | string | number | null | undefined,
  pattern = "MMMM d, yyyy",
): string {
  const date = toDate(value);
  if (!date) return "";
  return format(date, pattern);
}

/** e.g. "Aug 10, 2026" */
export function formatPublishedDateShort(
  value: Date | string | number | null | undefined,
): string {
  return formatPublishedDate(value, "MMM d, yyyy");
}

/** e.g. "about 2 hours ago" */
export function formatPublishedRelative(
  value: Date | string | number | null | undefined,
): string {
  const date = toDate(value);
  if (!date) return "";
  return formatDistanceToNow(date, { addSuffix: true });
}

/** ISO string for JSON / cursors, or empty if invalid. */
export function toIsoString(
  value: Date | string | number | null | undefined,
): string | null {
  const date = toDate(value);
  return date ? date.toISOString() : null;
}
