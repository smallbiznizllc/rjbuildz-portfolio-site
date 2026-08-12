"use server";

import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { requireAdmin, AuthError } from "@/lib/auth/admin";
import {
  getSiteSettings,
  updateSiteSettings,
} from "@/lib/firestore/settings";
import { siteSettingsSchema } from "@/lib/validation/schemas";
import type { SiteSettings } from "@/types";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function serializeSettings(settings: SiteSettings) {
  return {
    ...settings,
    updatedAt: settings.updatedAt.toISOString(),
  };
}

function toActionError(error: unknown, fallback: string): ActionResult<never> {
  if (isRedirectError(error)) throw error;
  if (error instanceof AuthError) {
    return { ok: false, error: error.message };
  }
  console.error(fallback, error);
  return { ok: false, error: fallback };
}

export async function getSiteSettingsAction(): Promise<
  ActionResult<ReturnType<typeof serializeSettings>>
> {
  try {
    await requireAdmin();
    const settings = await getSiteSettings();
    return { ok: true, data: serializeSettings(settings) };
  } catch (error) {
    return toActionError(error, "Failed to load settings");
  }
}

export async function updateSiteSettingsAction(
  raw: unknown,
): Promise<ActionResult<ReturnType<typeof serializeSettings>>> {
  try {
    const session = await requireAdmin();

    const parsed = siteSettingsSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Invalid settings",
      };
    }

    const settings = await updateSiteSettings(parsed.data, session.uid);

    revalidatePath("/admin/settings");
    revalidatePath("/");

    return { ok: true, data: serializeSettings(settings) };
  } catch (error) {
    return toActionError(error, "Failed to save settings");
  }
}
