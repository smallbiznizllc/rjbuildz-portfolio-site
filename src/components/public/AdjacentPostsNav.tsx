"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { AdjacentPosts } from "@/types";

type AdjacentItem = NonNullable<AdjacentPosts["previous"]>;

function AdjacentCard({
  post,
  label,
  align = "left",
}: {
  post: AdjacentItem;
  label: string;
  align?: "left" | "right";
}) {
  const image = post.mainImage;

  return (
    <Link
      href={`/posts/${post.slug}`}
      className={cn(
        "group relative flex min-h-[14rem] flex-1 overflow-hidden bg-charcoal-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copper sm:min-h-[18rem]",
        align === "right" ? "text-right" : "text-left",
      )}
    >
      {image?.url ? (
        <Image
          src={image.url}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
      ) : (
        <div
          className="absolute inset-0 bg-gradient-to-br from-charcoal-soft via-charcoal-muted/50 to-copper/25"
          aria-hidden
        />
      )}

      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/45 to-charcoal/15",
          "transition-colors duration-300 group-hover:from-charcoal/95",
        )}
        aria-hidden
      />

      <div
        className={cn(
          "relative z-10 mt-auto flex w-full flex-col justify-end p-6 sm:p-8",
          align === "right" ? "items-end" : "items-start",
        )}
      >
        <span className="inline-flex items-center justify-center gap-0.5 rounded-full bg-copper px-2.5 py-1 text-xs leading-none font-bold uppercase tracking-[0.14em] text-black">
          {align === "left" ? (
            <ChevronLeft className="size-[1em] shrink-0" strokeWidth={2.5} aria-hidden />
          ) : null}
          <span className="leading-none">{label}</span>
          {align === "right" ? (
            <ChevronRight className="size-[1em] shrink-0" strokeWidth={2.5} aria-hidden />
          ) : null}
        </span>
        <span className="mt-2 max-w-sm font-display text-2xl leading-tight text-parchment [text-shadow:0px_1px_2px_#000] sm:text-3xl">
          {post.title}
        </span>
      </div>
    </Link>
  );
}

function FloatingAdjacentLink({
  post,
  direction,
}: {
  post: AdjacentItem;
  direction: "previous" | "next";
}) {
  const isPrev = direction === "previous";
  const image = post.mainImage;

  return (
    <Link
      href={`/posts/${post.slug}`}
      aria-label={`${isPrev ? "Previous" : "Next"}: ${post.title}`}
      className={cn(
        "group fixed top-1/2 z-50 hidden -translate-y-1/2 md:block",
        isPrev ? "left-0" : "right-0",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copper",
      )}
    >
      <span
        className={cn(
          "relative inline-flex h-[8.625rem] overflow-hidden border border-white bg-charcoal-soft text-white shadow-[var(--shadow-soft)]",
          "transition-transform duration-200 ease-out motion-reduce:transition-none",
          "group-hover:scale-105 group-focus-visible:scale-105",
          isPrev ? "origin-left" : "origin-right",
        )}
      >
        {image?.url ? (
          <span className="absolute inset-0" aria-hidden>
            <Image
              src={image.url}
              alt=""
              fill
              sizes="400px"
              className="object-cover"
            />
          </span>
        ) : null}
        <span className="absolute inset-0 bg-charcoal/60" aria-hidden />
        <span
          className={cn(
            "relative z-10 inline-flex h-full items-center gap-0 px-3",
            "transition-[gap] duration-200 ease-out motion-reduce:transition-none",
            "group-hover:gap-2 group-focus-visible:gap-2",
            isPrev ? "" : "flex-row-reverse",
          )}
        >
          {isPrev ? (
            <ChevronLeft className="size-5 shrink-0" strokeWidth={2.5} aria-hidden />
          ) : (
            <ChevronRight className="size-5 shrink-0" strokeWidth={2.5} aria-hidden />
          )}
          <span
            className={cn(
              "w-0 min-w-0 overflow-hidden text-xs font-bold leading-snug tracking-[0.08em] uppercase opacity-0",
              "break-words",
              "transition-all duration-200 ease-out motion-reduce:transition-none",
              "group-hover:w-[18rem] group-hover:opacity-100",
              "group-focus-visible:w-[18rem] group-focus-visible:opacity-100",
              isPrev ? "text-left" : "text-right",
            )}
          >
            {post.title}
          </span>
        </span>
      </span>
    </Link>
  );
}

export function AdjacentPostsNav({
  previous,
  next,
}: AdjacentPosts) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!previous && !next) return null;

  const floating =
    mounted && typeof document !== "undefined"
      ? createPortal(
          <>
            {previous ? (
              <FloatingAdjacentLink post={previous} direction="previous" />
            ) : null}
            {next ? (
              <FloatingAdjacentLink post={next} direction="next" />
            ) : null}
          </>,
          document.body,
        )
      : null;

  return (
    <>
      {floating}

      <nav
        aria-label="Adjacent projects"
        className="mt-16 grid grid-cols-1 border-t border-[var(--border-subtle)] md:hidden"
      >
        {previous ? (
          <AdjacentCard post={previous} label="Previous" align="left" />
        ) : null}
        {next ? (
          <AdjacentCard post={next} label="Next" align="right" />
        ) : null}
      </nav>
    </>
  );
}
