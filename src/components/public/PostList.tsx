"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { MasonryGrid } from "@/components/gallery/MasonryGrid";
import { PostTile } from "@/components/public/PostTile";
import { PostFilters } from "@/components/public/PostFilters";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import type { Category, PaginatedResult, Post } from "@/types";

type SerializedPost = Omit<
  Post,
  "publishedAt" | "createdAt" | "updatedAt"
> & {
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

function deserializePost(raw: SerializedPost): Post {
  return {
    ...raw,
    publishedAt: raw.publishedAt ? new Date(raw.publishedAt) : null,
    createdAt: new Date(raw.createdAt),
    updatedAt: new Date(raw.updatedAt),
  };
}

export function PostList({
  initial,
  categories,
  headingId = "work-heading",
}: {
  initial: PaginatedResult<Post>;
  categories: Category[];
  headingId?: string;
}) {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const categoryParam = searchParams.get("category") ?? "";

  const categoryId = useMemo(() => {
    if (!categoryParam) return null;
    const bySlug = categories.find((c) => c.slug === categoryParam);
    if (bySlug) return bySlug.id;
    const byId = categories.find((c) => c.id === categoryParam);
    return byId?.id ?? categoryParam;
  }, [categoryParam, categories]);

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    for (const c of categories) map.set(c.id, c);
    return map;
  }, [categories]);

  const [posts, setPosts] = useState<Post[]>(initial.items);
  const [nextCursor, setNextCursor] = useState(initial.nextCursor);
  const [hasMore, setHasMore] = useState(initial.hasMore);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [loadingMore, setLoadingMore] = useState(false);

  const filterKey = `${q}::${categoryId ?? ""}`;

  const fetchPage = useCallback(
    async (cursor: string | null, append: boolean) => {
      const params = new URLSearchParams();
      params.set("limit", "12");
      if (q.trim()) params.set("search", q.trim());
      if (categoryId) params.set("categoryId", categoryId);
      if (cursor) params.set("cursor", cursor);

      const res = await fetch(`/api/posts?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to load projects");
      }
      const data = (await res.json()) as {
        items: SerializedPost[];
        nextCursor: string | null;
        hasMore: boolean;
      };
      const items = data.items.map(deserializePost);
      setPosts((prev) => (append ? [...prev, ...items] : items));
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
      setError(null);
    },
    [q, categoryId],
  );

  useEffect(() => {
    // Initial SSR data already matches empty filters.
    if (!q && !categoryId) {
      setPosts(initial.items);
      setNextCursor(initial.nextCursor);
      setHasMore(initial.hasMore);
      return;
    }

    startTransition(async () => {
      try {
        await fetchPage(null, false);
      } catch {
        setError("Unable to filter projects right now.");
        setPosts([]);
        setHasMore(false);
        setNextCursor(null);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  async function onLoadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      await fetchPage(nextCursor, true);
    } catch {
      setError("Unable to load more projects.");
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="space-y-8">
      <PostFilters
        categories={categories}
        resultCount={posts.length}
        loading={pending}
      />

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      {pending && posts.length === 0 ? (
        <div className="flex justify-center py-16">
          <Spinner label="Loading projects" />
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Published work will appear here. Check back soon, or try a different search."
        />
      ) : (
        <>
          <MasonryGrid labelledBy={headingId}>
            {posts.map((post, index) => (
              <div key={post.id} role="listitem" className="masonry-item">
                <PostTile
                  post={post}
                  categories={post.categoryIds
                    .map((id) => categoryMap.get(id))
                    .filter((c): c is Category => Boolean(c))}
                  index={index}
                  priority={index < 3}
                />
              </div>
            ))}
          </MasonryGrid>

          {hasMore ? (
            <div className="flex justify-center pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? "Loading…" : "Load more"}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
