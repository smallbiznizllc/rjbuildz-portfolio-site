"use server";

import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { requireAdmin, AuthError } from "@/lib/auth/admin";
import {
  allocatePostId,
  createPost,
  deletePost,
  getPostById,
  postSlugExists,
  updatePost,
} from "@/lib/firestore/posts";
import { deletePostStorageFolder, deleteStorageFile } from "@/lib/storage/delete";
import { ensureUniqueSlug, slugify } from "@/lib/utils/slug";
import {
  createPostSchema,
  updatePostSchema,
} from "@/lib/validation/schemas";
import type { Post } from "@/types";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function serializePost(post: Post) {
  return {
    ...post,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
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

export async function allocatePostIdAction(): Promise<ActionResult<string>> {
  try {
    await requireAdmin();
    return { ok: true, data: allocatePostId() };
  } catch (error) {
    return toActionError(error, "Unable to allocate post id");
  }
}

export async function createPostAction(
  raw: unknown,
  options?: { id?: string },
): Promise<ActionResult<ReturnType<typeof serializePost>>> {
  try {
    const session = await requireAdmin();

    const parsed = createPostSchema.safeParse(raw);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const path = issue?.path?.length ? `${issue.path.join(".")}: ` : "";
      return {
        ok: false,
        error: `${path}${issue?.message ?? "Invalid post data"}`,
      };
    }

    let slug = slugify(parsed.data.slug) || slugify(parsed.data.title);
    slug = await ensureUniqueSlug(slug, (s) => postSlugExists(s));

    const post = await createPost(
      { ...parsed.data, slug, sortOrder: parsed.data.sortOrder ?? 0 },
      session.uid,
      { id: options?.id },
    );

    revalidatePath("/admin");
    revalidatePath("/admin/posts");
    revalidatePath("/");

    return { ok: true, data: serializePost(post) };
  } catch (error) {
    return toActionError(error, "Failed to create post");
  }
}

export async function updatePostAction(
  raw: unknown,
): Promise<ActionResult<ReturnType<typeof serializePost>>> {
  try {
    const session = await requireAdmin();

    const parsed = updatePostSchema.safeParse(raw);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const path = issue?.path?.length ? `${issue.path.join(".")}: ` : "";
      return {
        ok: false,
        error: `${path}${issue?.message ?? "Invalid post data"}`,
      };
    }

    const existing = await getPostById(parsed.data.id);
    if (!existing) {
      return { ok: false, error: "Post not found" };
    }

    let payload = { ...parsed.data };

    if (payload.slug !== undefined) {
      let slug =
        slugify(payload.slug) || slugify(payload.title ?? existing.title);
      if (await postSlugExists(slug, existing.id)) {
        slug = await ensureUniqueSlug(slug, (s) =>
          postSlugExists(s, existing.id),
        );
      }
      payload = { ...payload, slug };
    }

    const post = await updatePost(payload, session.uid);

    revalidatePath("/admin");
    revalidatePath("/admin/posts");
    revalidatePath(`/admin/posts/${post.id}/edit`);
    revalidatePath("/");
    if (post.slug) revalidatePath(`/work/${post.slug}`);

    return { ok: true, data: serializePost(post) };
  } catch (error) {
    return toActionError(error, "Failed to update post");
  }
}

export async function deletePostAction(
  id: string,
): Promise<ActionResult<{ storageErrors: string[] }>> {
  try {
    await requireAdmin();

    const existing = await getPostById(id);
    if (!existing) {
      return { ok: false, error: "Post not found" };
    }

    await deletePost(id);

    const storageResult = await deletePostStorageFolder(id);

    revalidatePath("/admin");
    revalidatePath("/admin/posts");
    revalidatePath("/admin/media");
    revalidatePath("/");

    return {
      ok: true,
      data: { storageErrors: storageResult.errors },
    };
  } catch (error) {
    return toActionError(error, "Failed to delete post");
  }
}

export async function deleteStoragePathAction(
  path: string,
): Promise<ActionResult> {
  try {
    await requireAdmin();
    if (!path.startsWith("posts/")) {
      return { ok: false, error: "Invalid storage path" };
    }
    const result = await deleteStorageFile(path);
    if (result.error) {
      return { ok: false, error: result.error };
    }
    return { ok: true, data: undefined };
  } catch (error) {
    return toActionError(error, "Failed to delete file");
  }
}
