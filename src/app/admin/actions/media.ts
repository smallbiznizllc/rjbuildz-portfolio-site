"use server";

import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { requireAdmin, AuthError } from "@/lib/auth/admin";
import {
  getAllPostsForMedia,
  getPostById,
  updatePost,
} from "@/lib/firestore/posts";
import {
  collectMediaItems,
  countPathReferences,
  dedupeMediaByPath,
  type MediaItem,
} from "@/lib/media/collect";
import { deleteStorageFile } from "@/lib/storage/delete";
import type { GalleryImage, PostImage } from "@/types";

export type { MediaItem };

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function toActionError(error: unknown, fallback: string): ActionResult<never> {
  if (isRedirectError(error)) throw error;
  if (error instanceof AuthError) {
    return { ok: false, error: error.message };
  }
  console.error(fallback, error);
  return { ok: false, error: fallback };
}

export async function listMediaAction(): Promise<ActionResult<MediaItem[]>> {
  try {
    await requireAdmin();
    const posts = await getAllPostsForMedia();
    return {
      ok: true,
      data: dedupeMediaByPath(collectMediaItems(posts)),
    };
  } catch (error) {
    return toActionError(error, "Failed to load media");
  }
}

export async function deleteMediaAction(input: {
  postId: string;
  path: string;
  kind: "main" | "gallery";
  galleryImageId?: string;
}): Promise<ActionResult<{ storageError?: string; keptSharedFile?: boolean }>> {
  try {
    const session = await requireAdmin();

    const post = await getPostById(input.postId);
    if (!post) {
      return { ok: false, error: "Post not found" };
    }

    let mainImage: PostImage | null = post.mainImage;
    let gallery: GalleryImage[] = post.gallery;

    if (input.kind === "main") {
      if (post.mainImage?.path !== input.path) {
        return { ok: false, error: "Main image path does not match" };
      }
      mainImage = null;
    } else {
      gallery = post.gallery.filter((img) => {
        if (input.galleryImageId && img.id === input.galleryImageId) {
          return false;
        }
        return img.path !== input.path;
      });
    }

    await updatePost(
      {
        id: post.id,
        mainImage,
        gallery,
      },
      session.uid,
    );

    // Don't delete Storage if other posts still reuse this file.
    const posts = await getAllPostsForMedia();
    const remaining = countPathReferences(posts, input.path);
    if (remaining > 0) {
      revalidatePath("/admin/media");
      revalidatePath(`/admin/posts/${post.id}/edit`);
      revalidatePath("/admin/posts");
      return { ok: true, data: { keptSharedFile: true } };
    }

    const storage = await deleteStorageFile(input.path);

    revalidatePath("/admin/media");
    revalidatePath(`/admin/posts/${post.id}/edit`);
    revalidatePath("/admin/posts");

    return {
      ok: true,
      data: { storageError: storage.error },
    };
  } catch (error) {
    return toActionError(error, "Failed to delete media");
  }
}
