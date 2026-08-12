"use server";

import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { requireAdmin, AuthError } from "@/lib/auth/admin";
import {
  getAllPostsForMedia,
  getPostById,
  updatePost,
} from "@/lib/firestore/posts";
import { deleteStorageFile } from "@/lib/storage/delete";
import type { GalleryImage, PostImage } from "@/types";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export interface MediaItem {
  path: string;
  url: string;
  alt: string;
  kind: "main" | "gallery";
  postId: string;
  postTitle: string;
  galleryImageId?: string;
}

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
    const items: MediaItem[] = [];

    for (const post of posts) {
      if (post.mainImage?.path) {
        items.push({
          path: post.mainImage.path,
          url: post.mainImage.url,
          alt: post.mainImage.alt,
          kind: "main",
          postId: post.id,
          postTitle: post.title,
        });
      }
      for (const image of post.gallery) {
        if (!image.path) continue;
        items.push({
          path: image.path,
          url: image.url,
          alt: image.alt,
          kind: "gallery",
          postId: post.id,
          postTitle: post.title,
          galleryImageId: image.id,
        });
      }
    }

    return { ok: true, data: items };
  } catch (error) {
    return toActionError(error, "Failed to load media");
  }
}

export async function deleteMediaAction(input: {
  postId: string;
  path: string;
  kind: "main" | "gallery";
  galleryImageId?: string;
}): Promise<ActionResult<{ storageError?: string }>> {
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
