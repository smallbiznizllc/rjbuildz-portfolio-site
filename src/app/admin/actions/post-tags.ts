"use server";

import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { requireAdmin, AuthError } from "@/lib/auth/admin";
import {
  createPostTag,
  deletePostTag,
  getPostTagById,
  postTagSlugExists,
  updatePostTag,
} from "@/lib/firestore/post-tags";
import {
  countPostsByCreatedWithTag,
  countPostsByFeatureTag,
} from "@/lib/firestore/posts";
import { ensureUniqueSlug, slugify } from "@/lib/utils/slug";
import {
  createPostTagSchema,
  updatePostTagSchema,
} from "@/lib/validation/schemas";
import type { PostTag, PostTagKind } from "@/types";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function serializePostTag(tag: PostTag) {
  return {
    ...tag,
    createdAt: tag.createdAt.toISOString(),
    updatedAt: tag.updatedAt.toISOString(),
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

function revalidateTagPaths() {
  revalidatePath("/admin/tags");
  revalidatePath("/admin/posts");
  revalidatePath("/admin");
  revalidatePath("/");
}

async function countPostsForTag(
  kind: PostTagKind,
  tagId: string,
): Promise<number> {
  if (kind === "feature") return countPostsByFeatureTag(tagId);
  return countPostsByCreatedWithTag(tagId);
}

export async function createPostTagAction(
  raw: unknown,
): Promise<ActionResult<ReturnType<typeof serializePostTag>>> {
  try {
    await requireAdmin();

    const parsed = createPostTagSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Invalid tag data",
      };
    }

    const { kind, ...input } = parsed.data;
    let slug = slugify(input.slug) || slugify(input.name);
    slug = await ensureUniqueSlug(slug, (s) => postTagSlugExists(kind, s));

    const tag = await createPostTag(kind, {
      ...input,
      slug,
      sortOrder: input.sortOrder ?? 0,
    });

    revalidateTagPaths();

    return { ok: true, data: serializePostTag(tag) };
  } catch (error) {
    return toActionError(error, "Failed to create tag");
  }
}

export async function updatePostTagAction(
  raw: unknown,
): Promise<ActionResult<ReturnType<typeof serializePostTag>>> {
  try {
    await requireAdmin();

    const parsed = updatePostTagSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Invalid tag data",
      };
    }

    const { kind, id, ...rest } = parsed.data;
    const existing = await getPostTagById(kind, id);
    if (!existing) {
      return { ok: false, error: "Tag not found" };
    }

    let payload = { id, ...rest };
    if (payload.slug !== undefined) {
      let slug =
        slugify(payload.slug) || slugify(payload.name ?? existing.name);
      if (await postTagSlugExists(kind, slug, existing.id)) {
        slug = await ensureUniqueSlug(slug, (s) =>
          postTagSlugExists(kind, s, existing.id),
        );
      }
      payload = { ...payload, slug };
    }

    const tag = await updatePostTag(kind, { kind, ...payload });

    revalidateTagPaths();

    return { ok: true, data: serializePostTag(tag) };
  } catch (error) {
    return toActionError(error, "Failed to update tag");
  }
}

export async function deletePostTagAction(
  kind: PostTagKind,
  id: string,
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const existing = await getPostTagById(kind, id);
    if (!existing) {
      return { ok: false, error: "Tag not found" };
    }

    const assigned = await countPostsForTag(kind, id);
    if (assigned > 0) {
      const label = kind === "feature" ? "Features" : "Created with";
      return {
        ok: false,
        error: `Cannot delete: ${assigned} post${assigned === 1 ? "" : "s"} still use this ${label.toLowerCase()} tag. Remove it from those posts first.`,
      };
    }

    await deletePostTag(kind, id);

    revalidateTagPaths();

    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error, "Failed to delete tag");
  }
}
