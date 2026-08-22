import { notFound } from "next/navigation";
import Link from "next/link";
import { List, Plus } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { PostForm } from "@/components/admin/PostForm";
import { toPostFormPost } from "@/lib/admin/post-form";
import { getCategories } from "@/lib/firestore/categories";
import { getPostTags } from "@/lib/firestore/post-tags";
import { getAdminPosts, getPostById } from "@/lib/firestore/posts";

interface EditPostPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id } = await params;
  const [post, categories, featureTags, createdWithTags, relatedPostOptions] =
    await Promise.all([
      getPostById(id),
      getCategories(),
      getPostTags("feature"),
      getPostTags("createdWith"),
      getAdminPosts({ limit: 300 }),
    ]);

  if (!post) notFound();

  return (
    <AdminShell
      title="Edit post"
      actions={
        <>
          <Link
            href="/admin/posts"
            className="inline-flex items-center gap-1.5 rounded-md bg-copper px-3.5 py-2 text-sm font-medium text-white hover:bg-copper-hover"
          >
            <List className="size-4" aria-hidden />
            Back to posts
          </Link>
          <Link
            href="/admin/posts/new"
            className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            <Plus className="size-4" aria-hidden />
            New post
          </Link>
        </>
      }
    >
      <div className="mx-auto max-w-6xl">
        <PostForm
          mode="edit"
          post={toPostFormPost(post)}
          categories={categories.map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
          }))}
          featureTags={featureTags.map((tag) => ({
            id: tag.id,
            name: tag.name,
            slug: tag.slug,
          }))}
          createdWithTags={createdWithTags.map((tag) => ({
            id: tag.id,
            name: tag.name,
            slug: tag.slug,
          }))}
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
