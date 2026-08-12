import {
  FieldValue,
  Timestamp,
  type DocumentData,
} from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import type { SiteSettings } from "@/types";
import type { SiteSettingsInput } from "@/lib/validation/schemas";

const COLLECTION = "siteSettings";
const GENERAL_DOC = "general";

function toDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date(0);
}

export function mapSiteSettings(data: DocumentData | undefined): SiteSettings {
  const social = data?.socialLinks ?? {};
  return {
    siteName: String(data?.siteName ?? "RJ Buildz"),
    owner: data?.owner != null ? String(data.owner) : null,
    aboutBlurb: data?.aboutBlurb != null ? String(data.aboutBlurb) : null,
    tagline: data?.tagline != null ? String(data.tagline) : null,
    contactEmail: data?.contactEmail != null ? String(data.contactEmail) : null,
    logoUrl: data?.logoUrl != null ? String(data.logoUrl) : null,
    socialLinks: {
      instagram: social.instagram ? String(social.instagram) : undefined,
      facebook: social.facebook ? String(social.facebook) : undefined,
      linkedin: social.linkedin ? String(social.linkedin) : undefined,
      youtube: social.youtube ? String(social.youtube) : undefined,
      x: social.x ? String(social.x) : undefined,
      website: social.website ? String(social.website) : undefined,
    },
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
    socialLinks: input.socialLinks ?? {},
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy,
  };

  await ref.set(payload, { merge: true });
  const updated = await ref.get();
  return mapSiteSettings(updated.data());
}
