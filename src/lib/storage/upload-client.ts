"use client";

import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { getClientStorage } from "@/lib/firebase/client";
import { assertValidImageFile } from "@/lib/storage/images";
import {
  generateGalleryImagePath,
  generateMainImagePath,
} from "@/lib/storage/paths";
import type { GalleryImage, PostImage } from "@/types";

export async function uploadMainImage(
  postId: string,
  file: File,
  alt = "",
): Promise<PostImage> {
  assertValidImageFile(file);
  const path = generateMainImagePath(postId, file.name);
  const storageRef = ref(getClientStorage(), path);
  const snapshot = await uploadBytes(storageRef, file, {
    contentType: file.type,
  });
  const url = await getDownloadURL(snapshot.ref);

  return {
    path,
    url,
    alt,
    width: null,
    height: null,
  };
}

export async function uploadGalleryImage(
  postId: string,
  imageId: string,
  file: File,
  options?: { alt?: string; caption?: string | null; sortOrder?: number },
): Promise<GalleryImage> {
  assertValidImageFile(file);
  const path = generateGalleryImagePath(postId, imageId, file.name);
  const storageRef = ref(getClientStorage(), path);
  const snapshot = await uploadBytes(storageRef, file, {
    contentType: file.type,
  });
  const url = await getDownloadURL(snapshot.ref);

  return {
    id: imageId,
    path,
    url,
    alt: options?.alt ?? "",
    caption: options?.caption ?? null,
    sortOrder: options?.sortOrder ?? 0,
    width: null,
    height: null,
  };
}

export async function deleteClientStorageFile(path: string): Promise<void> {
  if (!path) return;
  const storageRef = ref(getClientStorage(), path);
  try {
    await deleteObject(storageRef);
  } catch (error) {
    // Ignore missing files; surface other failures.
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code: string }).code)
        : "";
    if (code !== "storage/object-not-found") {
      throw error;
    }
  }
}

export function createGalleryImageId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `img-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
