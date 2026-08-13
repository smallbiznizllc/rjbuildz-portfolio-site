import { Suspense } from "react";
import { PostList } from "@/components/public/PostList";
import { Spinner } from "@/components/ui/Spinner";
import {
  safeGetCategoriesWithPublishedPosts,
  safeGetPublishedPosts,
} from "@/lib/firestore/safe-public";
import { SITE_NAME } from "@/lib/site";

export default async function HomePage() {
  const [posts, categories] = await Promise.all([
    safeGetPublishedPosts({ limit: 12 }),
    safeGetCategoriesWithPublishedPosts(),
  ]);

  return (
    <section
      id="work"
      className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20"
      aria-labelledby="work-heading"
    >
      <div className="mb-10 max-w-2xl">
        <h1
          id="work-heading"
          className="font-display text-4xl text-charcoal sm:text-5xl md:text-6xl"
        >
          {SITE_NAME}
        </h1>
        <p className="mt-4 text-base text-ink-muted leading-relaxed sm:text-lg">
          A curated portfolio of designs and builds — filter by category or
          search by title.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex justify-center py-16">
            <Spinner label="Loading projects" />
          </div>
        }
      >
        <PostList initial={posts} categories={categories} />
      </Suspense>
    </section>
  );
}
