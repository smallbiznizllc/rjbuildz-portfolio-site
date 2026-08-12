import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MasonryGrid } from "@/components/gallery/MasonryGrid";
import { PostTile } from "@/components/public/PostTile";
import { buttonVariants } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils/cn";
import {
  safeGetCategories,
  safeGetCategoryBySlug,
  safeGetPublishedPosts,
} from "@/lib/firestore/safe-public";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ cursor?: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await safeGetCategoryBySlug(slug);
  if (!category) {
    return { title: "Category not found" };
  }
  return {
    title: category.name,
    description:
      category.description ||
      `Projects in the ${category.name} category.`,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const { cursor } = await searchParams;

  const category = await safeGetCategoryBySlug(slug);
  if (!category) notFound();

  const [result, categories] = await Promise.all([
    safeGetPublishedPosts({
      limit: 12,
      categoryId: category.id,
      cursor: cursor || null,
    }),
    safeGetCategories(),
  ]);

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
      <header className="mb-12 max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-copper">
          Category
        </p>
        <h1 className="mt-3 font-display text-4xl text-charcoal sm:text-5xl">
          {category.name}
        </h1>
        {category.description ? (
          <p className="mt-4 text-ink-muted leading-relaxed">
            {category.description}
          </p>
        ) : null}
      </header>

      {result.items.length === 0 ? (
        <EmptyState
          title="No projects in this category"
          description="Published work will show up here once it's ready."
          action={
            <Link
              href="/"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Back to all work
            </Link>
          }
        />
      ) : (
        <>
          <MasonryGrid labelledBy={undefined}>
            {result.items.map((post, index) => (
              <div key={post.id} role="listitem">
                <PostTile
                  post={post}
                  categories={post.categoryIds
                    .map((id) => categoryMap.get(id))
                    .filter((c): c is NonNullable<typeof c> => Boolean(c))}
                  index={index}
                  priority={index < 3}
                />
              </div>
            ))}
          </MasonryGrid>

          {result.hasMore && result.nextCursor ? (
            <div className="mt-10 flex justify-center">
              <Link
                href={`/category/${slug}?cursor=${encodeURIComponent(result.nextCursor)}`}
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                Load more
              </Link>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
