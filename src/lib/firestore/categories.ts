import {
  FieldValue,
  Timestamp,
  type DocumentData,
} from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { slugify } from "@/lib/utils/slug";
import type { Category } from "@/types";
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/lib/validation/schemas";

const CATEGORIES = "categories";

function toDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date(0);
}

export function mapCategoryDoc(id: string, data: DocumentData): Category {
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

export async function getCategories(): Promise<Category[]> {
  const snap = await adminDb
    .collection(CATEGORIES)
    .orderBy("sortOrder", "asc")
    .orderBy("name", "asc")
    .get();

  return snap.docs.map((doc) => mapCategoryDoc(doc.id, doc.data()));
}

export async function getCategoryBySlug(
  slug: string,
): Promise<Category | null> {
  const snap = await adminDb
    .collection(CATEGORIES)
    .where("slug", "==", slug)
    .limit(1)
    .get();

  if (snap.empty) return null;
  const doc = snap.docs[0]!;
  return mapCategoryDoc(doc.id, doc.data());
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const doc = await adminDb.collection(CATEGORIES).doc(id).get();
  if (!doc.exists) return null;
  return mapCategoryDoc(doc.id, doc.data()!);
}

export async function createCategory(
  input: CreateCategoryInput,
): Promise<Category> {
  const ref = adminDb.collection(CATEGORIES).doc();
  await ref.set({
    name: input.name,
    slug: slugify(input.slug) || input.slug,
    description: input.description ?? null,
    sortOrder: input.sortOrder ?? 0,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  const created = await ref.get();
  return mapCategoryDoc(created.id, created.data()!);
}

export async function updateCategory(
  input: UpdateCategoryInput,
): Promise<Category> {
  const ref = adminDb.collection(CATEGORIES).doc(input.id);
  const existing = await ref.get();
  if (!existing.exists) {
    throw new Error(`Category not found: ${input.id}`);
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
  return mapCategoryDoc(updated.id, updated.data()!);
}

export async function deleteCategory(id: string): Promise<void> {
  await adminDb.collection(CATEGORIES).doc(id).delete();
}

export async function categorySlugExists(
  slug: string,
  excludeId?: string,
): Promise<boolean> {
  const snap = await adminDb
    .collection(CATEGORIES)
    .where("slug", "==", slug)
    .limit(5)
    .get();

  if (snap.empty) return false;
  if (!excludeId) return true;
  return snap.docs.some((d) => d.id !== excludeId);
}
