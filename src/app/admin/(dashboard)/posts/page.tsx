import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  PostsListClient,
  type AdminPostListItem,
} from "@/components/admin/PostsListClient";
import { getCategories } from "@/lib/firestore/categories";
import { getAdminPosts } from "@/lib/firestore/posts";

export default async function AdminPostsPage() {
  const [posts, categories] = await Promise.all([
    getAdminPosts({ limit: 300 }),
    getCategories(),
  ]);

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const items: AdminPostListItem[] = posts.map((post) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    status: post.status,
    categoryIds: post.categoryIds,
    categoryNames: post.categoryIds
      .map((id) => categoryMap.get(id))
      .filter((name): name is string => Boolean(name)),
    relatedPostIds: post.relatedPostIds ?? [],
    seo: {
      title: post.seo.title,
      description: post.seo.description,
      ogImage: post.seo.ogImage,
      keywords: post.seo.keywords ?? [],
    },
    thumbnailUrl: post.mainImage?.url ?? null,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  }));

  return (
    <AdminShell title="Posts">
      <div className="mx-auto max-w-6xl">
        <Suspense fallback={<p className="text-sm text-zinc-500">Loading…</p>}>
          <PostsListClient
            posts={items}
            categories={categories.map((c) => ({ id: c.id, name: c.name }))}
            relatedOptions={posts.map((post) => ({
              id: post.id,
              title: post.title,
              slug: post.slug,
              status: post.status,
            }))}
          />
        </Suspense>
      </div>
    </AdminShell>
  );
}
