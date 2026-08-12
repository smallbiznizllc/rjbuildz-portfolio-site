import { notFound } from "next/navigation";
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
    <AdminShell title="Edit post">
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
