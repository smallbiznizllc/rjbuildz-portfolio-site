import {
  FieldValue,
  Timestamp,
  type DocumentData,
} from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import {
  isSocialNetworkId,
  resolveSocialHref,
  type SocialNetworkId,
} from "@/lib/social/networks";
import type { SiteSettingsInput } from "@/lib/validation/schemas";
import type { SocialAccount, SiteSettings } from "@/types";

const COLLECTION = "siteSettings";
const GENERAL_DOC = "general";

const LEGACY_NETWORKS = [
  "instagram",
  "facebook",
  "linkedin",
  "youtube",
  "x",
  "website",
] as const;

function toDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date(0);
}

function parseAccount(raw: unknown, index: number): SocialAccount | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  const network = String(data.network ?? "");
  if (!isSocialNetworkId(network)) return null;
  const handle = String(data.handle ?? data.href ?? "").trim();
  if (!handle) return null;
  let href = String(data.href ?? "").trim();
  if (!href) {
    try {
      href = resolveSocialHref(network, handle);
    } catch {
      return null;
    }
  }
  return {
    id: String(data.id ?? `social-${index}`),
    network,
    handle,
    href,
    sortOrder:
      typeof data.sortOrder === "number" ? data.sortOrder : index,
  };
}

function accountsFromLegacy(social: Record<string, unknown>): SocialAccount[] {
  const accounts: SocialAccount[] = [];
  for (const network of LEGACY_NETWORKS) {
    const value = social[network];
    if (typeof value !== "string" || !value.trim()) continue;
    try {
      accounts.push({
        id: `legacy-${network}`,
        network,
        handle: value.trim(),
        href: resolveSocialHref(network, value),
        sortOrder: accounts.length,
      });
    } catch {
      /* skip invalid legacy URL */
    }
  }
  return accounts;
}

function toLegacySocialLinks(
  accounts: SocialAccount[],
): SiteSettings["socialLinks"] {
  const links: SiteSettings["socialLinks"] = {};
  for (const account of accounts) {
    if (
      account.network === "instagram" ||
      account.network === "facebook" ||
      account.network === "linkedin" ||
      account.network === "youtube" ||
      account.network === "x" ||
      account.network === "website"
    ) {
      if (!links[account.network]) {
        links[account.network] = account.href;
      }
    }
  }
  return links;
}

export function mapSiteSettings(data: DocumentData | undefined): SiteSettings {
  const social = (data?.socialLinks ?? {}) as Record<string, unknown>;
  const fromArray = Array.isArray(data?.socialAccounts)
    ? data.socialAccounts
        .map((item: unknown, index: number) => parseAccount(item, index))
        .filter((item: SocialAccount | null): item is SocialAccount =>
          Boolean(item),
        )
        .sort((a: SocialAccount, b: SocialAccount) => a.sortOrder - b.sortOrder)
    : [];
  const socialAccounts =
    fromArray.length > 0 ? fromArray : accountsFromLegacy(social);

  return {
    siteName: String(data?.siteName ?? "RJ Buildz"),
    owner: data?.owner != null ? String(data.owner) : null,
    aboutBlurb: data?.aboutBlurb != null ? String(data.aboutBlurb) : null,
    tagline: data?.tagline != null ? String(data.tagline) : null,
    contactEmail: data?.contactEmail != null ? String(data.contactEmail) : null,
    logoUrl: data?.logoUrl != null ? String(data.logoUrl) : null,
    socialAccounts,
    socialLinks: toLegacySocialLinks(socialAccounts),
    updatedAt: toDate(data?.updatedAt),
    updatedBy: data?.updatedBy != null ? String(data.updatedBy) : null,
  };
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const doc = await adminDb.collection(COLLECTION).doc(GENERAL_DOC).get();
  if (!doc.exists) {
    return mapSiteSettings(undefined);
  }
  return mapSiteSettings(doc.data());
}

export async function updateSiteSettings(
  input: SiteSettingsInput,
  updatedBy: string,
): Promise<SiteSettings> {
  const ref = adminDb.collection(COLLECTION).doc(GENERAL_DOC);
  const payload: DocumentData = {
    siteName: input.siteName,
    owner: input.owner ?? null,
    aboutBlurb: input.aboutBlurb ?? null,
    tagline: input.tagline ?? null,
    contactEmail: input.contactEmail || null,
    logoUrl: input.logoUrl || null,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy,
  };

  await ref.set(payload, { merge: true });
  const updated = await ref.get();
  return mapSiteSettings(updated.data());
}

export async function updateSocialAccounts(
  accounts: SocialAccount[],
  updatedBy: string,
): Promise<SiteSettings> {
  const normalized = accounts.map((account, index) => ({
    ...account,
    sortOrder: index,
  }));
  const ref = adminDb.collection(COLLECTION).doc(GENERAL_DOC);
  await ref.set(
    {
      socialAccounts: normalized,
      socialLinks: toLegacySocialLinks(normalized),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy,
    },
    { merge: true },
  );
  const updated = await ref.get();
  return mapSiteSettings(updated.data());
}

export function serializeSocialAccount(account: SocialAccount) {
  return {
    id: account.id,
    network: account.network as SocialNetworkId,
    handle: account.handle,
    href: account.href,
    sortOrder: account.sortOrder,
  };
}
