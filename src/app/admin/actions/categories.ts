"use server";

import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { requireAdmin, AuthError } from "@/lib/auth/admin";
import {
  categorySlugExists,
  createCategory,
  deleteCategory,
  getCategoryById,
  updateCategory,
} from "@/lib/firestore/categories";
import { countPostsByCategory } from "@/lib/firestore/posts";
import { ensureUniqueSlug, slugify } from "@/lib/utils/slug";
import {
  createCategorySchema,
  updateCategorySchema,
} from "@/lib/validation/schemas";
import type { Category } from "@/types";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function serializeCategory(category: Category) {
  return {
    ...category,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
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

export async function createCategoryAction(
  raw: unknown,
): Promise<ActionResult<ReturnType<typeof serializeCategory>>> {
  try {
    await requireAdmin();

    const parsed = createCategorySchema.safeParse(raw);
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Invalid category data",
      };
    }

    let slug = slugify(parsed.data.slug) || slugify(parsed.data.name);
    slug = await ensureUniqueSlug(slug, (s) => categorySlugExists(s));

    const category = await createCategory({
      ...parsed.data,
      slug,
      sortOrder: parsed.data.sortOrder ?? 0,
    });

    revalidatePath("/admin/categories");
    revalidatePath("/admin/posts");
    revalidatePath("/admin");
    revalidatePath("/");

    return { ok: true, data: serializeCategory(category) };
  } catch (error) {
    return toActionError(error, "Failed to create category");
  }
}

export async function updateCategoryAction(
  raw: unknown,
): Promise<ActionResult<ReturnType<typeof serializeCategory>>> {
  try {
    await requireAdmin();

    const parsed = updateCategorySchema.safeParse(raw);
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Invalid category data",
      };
    }

    const existing = await getCategoryById(parsed.data.id);
    if (!existing) {
      return { ok: false, error: "Category not found" };
    }

    let payload = { ...parsed.data };
    if (payload.slug !== undefined) {
      let slug =
        slugify(payload.slug) || slugify(payload.name ?? existing.name);
      if (await categorySlugExists(slug, existing.id)) {
        slug = await ensureUniqueSlug(slug, (s) =>
          categorySlugExists(s, existing.id),
        );
      }
      payload = { ...payload, slug };
    }

    const category = await updateCategory(payload);

    revalidatePath("/admin/categories");
    revalidatePath("/admin");
    revalidatePath("/");

    return { ok: true, data: serializeCategory(category) };
  } catch (error) {
    return toActionError(error, "Failed to update category");
  }
}

export async function deleteCategoryAction(
  id: string,
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const existing = await getCategoryById(id);
    if (!existing) {
      return { ok: false, error: "Category not found" };
    }

    const assigned = await countPostsByCategory(id);
    if (assigned > 0) {
      return {
        ok: false,
        error: `Cannot delete: ${assigned} post${assigned === 1 ? "" : "s"} still use this category. Reassign or remove them first.`,
      };
    }

    await deleteCategory(id);

    revalidatePath("/admin/categories");
    revalidatePath("/admin");
    revalidatePath("/");

    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error, "Failed to delete category");
  }
}
