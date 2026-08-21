"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Category, Post } from "@/types";

type RelatedItem = Pick<Post, "id" | "slug" | "title" | "mainImage">;

function RelatedCard({ post }: { post: RelatedItem }) {
  return (
    <Link
      href={`/posts/${post.slug}`}
      draggable={false}
      onDragStart={(event) => event.preventDefault()}
      className="group relative flex min-h-[14rem] overflow-hidden bg-charcoal-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copper"
    >
      {post.mainImage?.url ? (
        <Image
          src={post.mainImage.url}
          alt=""
          fill
          sizes="(max-width: 640px) 85vw, (max-width: 1024px) 50vw, 33vw"
          draggable={false}
          className="pointer-events-none object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
      ) : (
        <div
          className="absolute inset-0 bg-gradient-to-br from-charcoal-soft via-charcoal-muted/50 to-copper/25"
          aria-hidden
        />
      )}
      <div
        className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/40 to-charcoal/10"
        aria-hidden
      />
      <div className="relative z-10 mt-auto p-5 sm:p-6">
        <span className="block font-display text-[1rem] font-bold leading-tight text-parchment [text-shadow:0px_1px_2px_#000]">
          {post.title}
        </span>
      </div>
    </Link>
  );
}

function CategoryPills({
  categories,
}: {
  categories: Pick<Category, "id" | "slug" | "name">[];
}) {
  if (categories.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={`/category/${cat.slug}`}
          className="inline-flex rounded-full bg-copper px-2.5 py-1 text-xs font-bold uppercase tracking-[0.14em] text-black transition-colors hover:bg-copper-hover"
        >
          {cat.name}
        </Link>
      ))}
    </div>
  );
}

export function RelatedPosts({
  posts,
  categories = [],
}: {
  posts: RelatedItem[];
  categories?: Pick<Category, "id" | "slug" | "name">[];
}) {
  const scrollerRef = useRef<HTMLUListElement>(null);
  const dragRef = useRef({ dragged: false });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [dragging, setDragging] = useState(false);

  const updateOverflow = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = Math.max(0, el.scrollWidth - el.clientWidth);
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft < max - 4);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateOverflow();
    const observer = new ResizeObserver(updateOverflow);
    observer.observe(el);
    el.addEventListener("scroll", updateOverflow, { passive: true });
    return () => {
      observer.disconnect();
      el.removeEventListener("scroll", updateOverflow);
    };
  }, [posts, updateOverflow]);

  const scrollByCard = useCallback((direction: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector("li");
    const gap = 16;
    const delta = (card?.getBoundingClientRect().width ?? el.clientWidth) + gap;
    el.scrollBy({ left: direction * delta, behavior: "smooth" });
  }, []);

  function onMouseDown(event: ReactMouseEvent<HTMLUListElement>) {
    if (event.button !== 0) return;
    const el = scrollerRef.current;
    if (!el) return;
    const startX = event.clientX;
    const startScroll = el.scrollLeft;
    let dragged = false;

    const onMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      if (Math.abs(dx) <= 6) return;
      if (!dragged) {
        dragged = true;
        dragRef.current.dragged = true;
        setDragging(true);
      }
      moveEvent.preventDefault();
      el.scrollLeft = startScroll - dx;
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      setDragging(false);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function onClickCapture(event: ReactMouseEvent<HTMLUListElement>) {
    if (!dragRef.current.dragged) return;
    event.preventDefault();
    event.stopPropagation();
    dragRef.current.dragged = false;
  }

  if (posts.length === 0 && categories.length === 0) return null;

  const showControls = canPrev || canNext;

  return (
    <section
      aria-labelledby={posts.length > 0 ? "related-heading" : undefined}
      aria-label={posts.length > 0 ? undefined : "Categories"}
      className="mt-16"
    >
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {posts.length > 0 ? (
          <>
            <div className="flex items-end justify-between gap-4">
              <h2
                id="related-heading"
                className="font-display text-3xl text-charcoal sm:text-4xl"
              >
                Related Works
              </h2>
              {showControls ? (
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => scrollByCard(-1)}
                    disabled={!canPrev}
                    className={cn(
                      "inline-flex size-10 items-center justify-center border border-[var(--border-subtle)] text-charcoal transition-colors",
                      "hover:border-copper hover:text-copper",
                      "disabled:pointer-events-none disabled:opacity-35",
                    )}
                    aria-label="Previous related projects"
                  >
                    <ChevronLeft className="size-5" strokeWidth={2.25} aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollByCard(1)}
                    disabled={!canNext}
                    className={cn(
                      "inline-flex size-10 items-center justify-center border border-[var(--border-subtle)] text-charcoal transition-colors",
                      "hover:border-copper hover:text-copper",
                      "disabled:pointer-events-none disabled:opacity-35",
                    )}
                    aria-label="Next related projects"
                  >
                    <ChevronRight className="size-5" strokeWidth={2.25} aria-hidden />
                  </button>
                </div>
              ) : null}
            </div>
            <ul
              ref={scrollerRef}
              onMouseDown={onMouseDown}
              onClickCapture={onClickCapture}
              className={cn(
                "mt-8 flex cursor-grab gap-4 overflow-x-auto overscroll-x-contain pb-1 select-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
                dragging
                  ? "cursor-grabbing snap-none"
                  : "snap-x snap-mandatory",
              )}
            >
              {posts.map((post) => (
                <li
                  key={post.id}
                  className="w-[min(100%,20rem)] shrink-0 snap-start sm:w-[calc(50%-0.5rem)] lg:w-[calc((100%-2rem)/3)]"
                >
                  <RelatedCard post={post} />
                </li>
              ))}
            </ul>
          </>
        ) : null}
        {categories.length > 0 ? (
          <div className={posts.length > 0 ? "mt-8" : undefined}>
            <CategoryPills categories={categories} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
