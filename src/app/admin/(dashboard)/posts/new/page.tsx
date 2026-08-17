import Link from "next/link";
import { List } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { PostForm } from "@/components/admin/PostForm";
import { getCategories } from "@/lib/firestore/categories";

export default async function NewPostPage() {
  const categories = await getCategories();

  return (
    <AdminShell
      title="New post"
      actions={
        <Link
          href="/admin/posts"
          className="inline-flex items-center gap-1.5 rounded-md bg-copper px-3.5 py-2 text-sm font-medium text-white hover:bg-copper-hover"
        >
          <List className="size-4" aria-hidden />
          Back to posts
        </Link>
      }
    >
      <div className="mx-auto max-w-6xl">
        <PostForm
          mode="create"
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        />
      </div>
    </AdminShell>
  );
}
