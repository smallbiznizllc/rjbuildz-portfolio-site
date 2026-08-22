import {
  FieldValue,
  Timestamp,
  type DocumentData,
} from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { slugify } from "@/lib/utils/slug";
import type { PostTag, PostTagKind } from "@/types";
import type {
  CreatePostTagInput,
  UpdatePostTagInput,
} from "@/lib/validation/schemas";

const COLLECTION_BY_KIND: Record<PostTagKind, string> = {
  feature: "featureTags",
  createdWith: "createdWithTags",
};

export const POST_TAG_ID_FIELD: Record<
  PostTagKind,
  "featureTagIds" | "createdWithTagIds"
> = {
  feature: "featureTagIds",
  createdWith: "createdWithTagIds",
};

function collectionFor(kind: PostTagKind): string {
  return COLLECTION_BY_KIND[kind];
}

function toDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date(0);
}

export function mapPostTagDoc(id: string, data: DocumentData): PostTag {
  return {
    id,
    name: String(data.name ?? ""),
    slug: String(data.slug ?? ""),
    description: data.description != null ? String(data.description) : null,
    sortOrder: typeof data.sortOrder === "number" ? data.sortOrder : 0,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export async function getPostTags(kind: PostTagKind): Promise<PostTag[]> {
  const snap = await adminDb.collection(collectionFor(kind)).get();
  return snap.docs
    .map((doc) => mapPostTagDoc(doc.id, doc.data()))
    .sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.name.localeCompare(b.name);
    });
}

export async function getPostTagById(
  kind: PostTagKind,
  id: string,
): Promise<PostTag | null> {
  const doc = await adminDb.collection(collectionFor(kind)).doc(id).get();
  if (!doc.exists) return null;
  return mapPostTagDoc(doc.id, doc.data()!);
}

export async function getPostTagBySlug(
  kind: PostTagKind,
  slug: string,
): Promise<PostTag | null> {
  const snap = await adminDb
    .collection(collectionFor(kind))
    .where("slug", "==", slug)
    .limit(1)
    .get();

  if (snap.empty) return null;
  const doc = snap.docs[0]!;
  return mapPostTagDoc(doc.id, doc.data());
}

export async function createPostTag(
  kind: PostTagKind,
  input: CreatePostTagInput,
): Promise<PostTag> {
  const ref = adminDb.collection(collectionFor(kind)).doc();
  await ref.set({
    name: input.name,
    slug: slugify(input.slug) || input.slug,
    description: input.description ?? null,
    sortOrder: input.sortOrder ?? 0,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  const created = await ref.get();
  return mapPostTagDoc(created.id, created.data()!);
}

export async function updatePostTag(
  kind: PostTagKind,
  input: UpdatePostTagInput,
): Promise<PostTag> {
  const ref = adminDb.collection(collectionFor(kind)).doc(input.id);
  const existing = await ref.get();
  if (!existing.exists) {
    throw new Error(`Tag not found: ${input.id}`);
  }

  const payload: DocumentData = {
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (input.name !== undefined) payload.name = input.name;
  if (input.slug !== undefined) payload.slug = slugify(input.slug) || input.slug;
  if (input.description !== undefined) payload.description = input.description;
  if (input.sortOrder !== undefined) payload.sortOrder = input.sortOrder;

  await ref.update(payload);
  const updated = await ref.get();
  return mapPostTagDoc(updated.id, updated.data()!);
}

export async function deletePostTag(
  kind: PostTagKind,
  id: string,
): Promise<void> {
  await adminDb.collection(collectionFor(kind)).doc(id).delete();
}

export async function postTagSlugExists(
  kind: PostTagKind,
  slug: string,
  excludeId?: string,
): Promise<boolean> {
  const snap = await adminDb
    .collection(collectionFor(kind))
    .where("slug", "==", slug)
    .limit(5)
    .get();

  if (snap.empty) return false;
  if (!excludeId) return true;
  return snap.docs.some((d) => d.id !== excludeId);
}

export async function countPostsByPostTag(
  kind: PostTagKind,
  tagId: string,
): Promise<number> {
  const field = POST_TAG_ID_FIELD[kind];
  const snap = await adminDb
    .collection("posts")
    .where(field, "array-contains", tagId)
    .select()
    .get();
  return snap.size;
}

export function resolvePostTagNames(
  ids: string[],
  tags: PostTag[],
): string[] {
  const byId = new Map(tags.map((tag) => [tag.id, tag.name]));
  return ids
    .map((id) => byId.get(id))
    .filter((name): name is string => Boolean(name));
}
