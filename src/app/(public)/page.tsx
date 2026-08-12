import { Suspense } from "react";
import { Hero } from "@/components/public/Hero";
import { PostList } from "@/components/public/PostList";
import { Spinner } from "@/components/ui/Spinner";
import {
  safeGetCategories,
  safeGetPublishedPosts,
} from "@/lib/firestore/safe-public";

export default async function HomePage() {
  const [posts, categories] = await Promise.all([
    safeGetPublishedPosts({ limit: 12 }),
    safeGetCategories(),
  ]);

  return (
    <>
      <Hero />
      <section
        id="work"
        className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20"
        aria-labelledby="work-heading"
      >
        <div className="mb-10 max-w-2xl">
          <h2
            id="work-heading"
            className="font-display text-3xl text-charcoal sm:text-4xl"
          >
            Selected work
          </h2>
          <p className="mt-3 text-ink-muted leading-relaxed">
            Browse the portfolio — filter by category or search by title.
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
    </>
  );
}
