import Link from "next/link";
import { List } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { PostForm } from "@/components/admin/PostForm";
import { getCategories } from "@/lib/firestore/categories";
import { getAdminPosts } from "@/lib/firestore/posts";

export default async function NewPostPage() {
  const [categories, relatedPostOptions] = await Promise.all([
    getCategories(),
    getAdminPosts({ limit: 300 }),
  ]);

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
          relatedPostOptions={relatedPostOptions
            .map((item) => ({
              id: item.id,
              title: item.title,
              slug: item.slug,
              status: item.status,
            }))
            .sort((a, b) => a.title.localeCompare(b.title))}
        />
      </div>
    </AdminShell>
  );
}
