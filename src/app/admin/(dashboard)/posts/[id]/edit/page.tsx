import { notFound } from "next/navigation";
import Link from "next/link";
import { List } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { PostForm } from "@/components/admin/PostForm";
import { toPostFormPost } from "@/lib/admin/post-form";
import { getCategories } from "@/lib/firestore/categories";
import { getPostById } from "@/lib/firestore/posts";

interface EditPostPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id } = await params;
  const [post, categories] = await Promise.all([
    getPostById(id),
    getCategories(),
  ]);

  if (!post) notFound();

  return (
    <AdminShell
      title="Edit post"
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
          mode="edit"
          post={toPostFormPost(post)}
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        />
      </div>
    </AdminShell>
  );
}
