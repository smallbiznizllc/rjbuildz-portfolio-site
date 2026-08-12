import { AdminShell } from "@/components/admin/AdminShell";
import {
  CategoriesClient,
  type CategoryListItem,
} from "@/components/admin/CategoriesClient";
import { getCategories } from "@/lib/firestore/categories";
import { countPostsByCategory } from "@/lib/firestore/posts";

export default async function CategoriesPage() {
  const categories = await getCategories();
  const counts = await Promise.all(
    categories.map(async (category) => ({
      id: category.id,
      count: await countPostsByCategory(category.id),
    })),
  );
  const countMap = new Map(counts.map((c) => [c.id, c.count]));

  const items: CategoryListItem[] = categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    sortOrder: category.sortOrder,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
    postCount: countMap.get(category.id) ?? 0,
  }));

  return (
    <AdminShell title="Categories">
      <div className="mx-auto max-w-3xl">
        <CategoriesClient categories={items} />
      </div>
    </AdminShell>
  );
}
