"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useSearchParams } from "next/navigation";
import { PostTile } from "@/components/public/PostTile";
import { PostFilters } from "@/components/public/PostFilters";
import { MasonryGrid } from "@/components/gallery/MasonryGrid";
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

  const categoryIds = useMemo(() => {
    if (!categoryParam.trim()) return [] as string[];
    const parts = categoryParam
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    const ids: string[] = [];
    for (const part of parts) {
      const bySlug = categories.find((c) => c.slug === part);
      if (bySlug) {
        ids.push(bySlug.id);
        continue;
      }
      const byId = categories.find((c) => c.id === part);
      ids.push(byId?.id ?? part);
    }
    return [...new Set(ids)];
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
  const [scrollLoadEnabled, setScrollLoadEnabled] = useState(true);
  const [autoLoadFailed, setAutoLoadFailed] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const nextCursorRef = useRef(nextCursor);
  const loadingMoreRef = useRef(false);
  nextCursorRef.current = nextCursor;

  const filterKey = `${q}::${categoryIds.join(",")}`;

  const fetchPage = useCallback(
    async (cursor: string | null, append: boolean) => {
      const params = new URLSearchParams();
      params.set("limit", "12");
      if (q.trim()) params.set("search", q.trim());
      if (categoryIds.length === 1) {
        params.set("categoryId", categoryIds[0]!);
      } else if (categoryIds.length > 1) {
        params.set("categoryIds", categoryIds.join(","));
      }
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
    [q, categoryIds],
  );

  useEffect(() => {
    // Initial SSR data already matches empty filters.
    if (!q && categoryIds.length === 0) {
      setPosts(initial.items);
      setNextCursor(initial.nextCursor);
      setHasMore(initial.hasMore);
      setAutoLoadFailed(false);
      return;
    }

    startTransition(async () => {
      try {
        await fetchPage(null, false);
        setAutoLoadFailed(false);
      } catch {
        setError("Unable to filter projects right now.");
        setPosts([]);
        setHasMore(false);
        setNextCursor(null);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  const loadMore = useCallback(
    async (source: "scroll" | "button") => {
      if (!nextCursorRef.current || loadingMoreRef.current) return;
      loadingMoreRef.current = true;
      setLoadingMore(true);
      try {
        await fetchPage(nextCursorRef.current, true);
        setAutoLoadFailed(false);
      } catch {
        setError("Unable to load more projects.");
        if (source === "scroll") setAutoLoadFailed(true);
      } finally {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      }
    },
    [fetchPage],
  );

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      setScrollLoadEnabled(false);
    }
  }, []);

  useEffect(() => {
    if (!scrollLoadEnabled || autoLoadFailed || !hasMore || pending) return;
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        void loadMore("scroll");
      },
      { root: null, rootMargin: "480px 0px", threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [
    autoLoadFailed,
    hasMore,
    loadMore,
    pending,
    posts.length,
    scrollLoadEnabled,
  ]);

  const showLoadMoreFallback =
    hasMore && (!scrollLoadEnabled || autoLoadFailed);

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
              <div key={post.id} role="listitem">
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
            <div
              ref={sentinelRef}
              className="h-px w-full"
              aria-hidden
            />
          ) : null}

          <div className="sr-only" aria-live="polite">
            {loadingMore ? "Loading more projects" : null}
          </div>

          {loadingMore && !showLoadMoreFallback ? (
            <div className="flex justify-center pt-4">
              <Spinner label="Loading more projects" />
            </div>
          ) : null}

          {showLoadMoreFallback ? (
            <div className="flex justify-center pt-4">
              <Button
                type="button"
                variant="primary"
                className="bg-copper text-white hover:bg-copper-hover"
                onClick={() => void loadMore("button")}
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
