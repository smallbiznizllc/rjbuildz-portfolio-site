/**
 * Public site branding & URL helpers — safe for client components.
 */

export const SITE_NAME = "RJ Buildz";
export const SITE_TAGLINE =
  "Crafted spaces and thoughtful builds — documented with care.";

export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://rjbuildz.com"
  );
}

export function getContactEmail(): string | null {
  return process.env.CONTACT_TO_EMAIL || null;
}
