import { AdminShell } from "@/components/admin/AdminShell";
import { PostForm } from "@/components/admin/PostForm";
import { getCategories } from "@/lib/firestore/categories";

export default async function NewPostPage() {
  const categories = await getCategories();

  return (
    <AdminShell title="New post">
      <div className="mx-auto max-w-6xl">
        <PostForm
          mode="create"
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        />
      </div>
    </AdminShell>
  );
}
