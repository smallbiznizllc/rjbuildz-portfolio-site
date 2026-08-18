import type { Metadata } from "next";
import type { GlobalSeo } from "@/types";
import { getSiteUrl, SITE_NAME } from "@/lib/site";

export const DEFAULT_GLOBAL_SEO: GlobalSeo = {
  googleAnalyticsId: null,
  googleTagManagerId: null,
  googleSiteVerification: null,
  metaTitle: null,
  metaDescription: null,
  metaKeywords: [],
  canonicalUrl: null,
  robotsIndex: true,
  robotsFollow: true,
  ogTitle: null,
  ogDescription: null,
  ogImageUrl: null,
  ogType: "website",
  twitterCard: "summary_large_image",
  twitterHandle: null,
  schemaJson: null,
};

function emptyToNull(value: unknown): string | null {
  if (value == null) return null;
  const text = String(value).trim();
  return text || null;
}

export function parseGlobalSeo(raw: unknown): GlobalSeo {
  const data =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const twitterCard =
    data.twitterCard === "summary" ? "summary" : "summary_large_image";
  const keywords = Array.isArray(data.metaKeywords)
    ? data.metaKeywords
        .map((item) => String(item).trim())
        .filter(Boolean)
        .slice(0, 24)
    : [];

  return {
    googleAnalyticsId: emptyToNull(data.googleAnalyticsId),
    googleTagManagerId: emptyToNull(data.googleTagManagerId),
    googleSiteVerification: emptyToNull(data.googleSiteVerification),
    metaTitle: emptyToNull(data.metaTitle),
    metaDescription: emptyToNull(data.metaDescription),
    metaKeywords: keywords,
    canonicalUrl: emptyToNull(data.canonicalUrl),
    robotsIndex: data.robotsIndex !== false,
    robotsFollow: data.robotsFollow !== false,
    ogTitle: emptyToNull(data.ogTitle),
    ogDescription: emptyToNull(data.ogDescription),
    ogImageUrl: emptyToNull(data.ogImageUrl),
    ogType: toOpenGraphType(String(data.ogType ?? "website")),
    twitterCard,
    twitterHandle: emptyToNull(data.twitterHandle),
    schemaJson: emptyToNull(data.schemaJson),
  };
}

export function safeSchemaJson(raw: string | null): string | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed === null || typeof parsed !== "object") return null;
    return JSON.stringify(parsed);
  } catch {
    return null;
  }
}

export function twitterHandleValue(handle: string | null): string | undefined {
  if (!handle) return undefined;
  const cleaned = handle.trim().replace(/^@/, "");
  return cleaned ? `@${cleaned}` : undefined;
}

const GA_ID_PATTERN = /^(G|GT|AW|UA)-[A-Z0-9-]+$/;
const GTM_ID_PATTERN = /^GTM-[A-Z0-9]+$/;
const OG_TYPES = ["website", "article", "profile", "book"] as const;

export type SupportedOgType = (typeof OG_TYPES)[number];

export function sanitizeGaId(id: string | null): string | null {
  if (!id) return null;
  const trimmed = id.trim().toUpperCase();
  return GA_ID_PATTERN.test(trimmed) ? trimmed : null;
}

export function sanitizeGtmId(id: string | null): string | null {
  if (!id) return null;
  const trimmed = id.trim().toUpperCase();
  return GTM_ID_PATTERN.test(trimmed) ? trimmed : null;
}

export function toOpenGraphType(value: string): SupportedOgType {
  return (OG_TYPES as readonly string[]).includes(value)
    ? (value as SupportedOgType)
    : "website";
}

export function buildRootMetadata(seo: GlobalSeo): Metadata {
  const siteUrl = getSiteUrl();
  const title = seo.metaTitle || `${SITE_NAME} — Creative Portfolio`;
  const description =
    seo.metaDescription ||
    `${SITE_NAME} — a professional creative portfolio of design, build, and craft work.`;
  const ogTitle = seo.ogTitle || title;
  const ogDescription = seo.ogDescription || description;
  const twitter = twitterHandleValue(seo.twitterHandle);

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: title,
      template: `%s · ${SITE_NAME}`,
    },
    description,
    keywords: seo.metaKeywords.length ? seo.metaKeywords : undefined,
    alternates: seo.canonicalUrl
      ? { canonical: seo.canonicalUrl }
      : undefined,
    verification: seo.googleSiteVerification
      ? { google: seo.googleSiteVerification }
      : undefined,
    robots: {
      index: seo.robotsIndex,
      follow: seo.robotsFollow,
    },
    openGraph: {
      type: toOpenGraphType(seo.ogType),
      locale: "en_US",
      siteName: SITE_NAME,
      title: ogTitle,
      description: ogDescription,
      images: seo.ogImageUrl ? [{ url: seo.ogImageUrl }] : undefined,
    },
    twitter: {
      card: seo.twitterCard,
      title: ogTitle,
      description: ogDescription,
      images: seo.ogImageUrl ? [seo.ogImageUrl] : undefined,
      creator: twitter,
      site: twitter,
    },
  };
}
