import Image from "next/image";
import Link from "next/link";
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
        <span className="text-xs font-medium uppercase tracking-[0.16em] text-copper">
          {label}
        </span>
        <span className="mt-2 max-w-sm font-display text-2xl leading-tight text-parchment sm:text-3xl">
          {post.title}
        </span>
      </div>
    </Link>
  );
}

export function AdjacentPostsNav({
  previous,
  next,
}: AdjacentPosts) {
  if (!previous && !next) return null;

  return (
    <nav
      aria-label="Adjacent projects"
      className="mt-16 grid grid-cols-1 border-t border-[var(--border-subtle)] sm:grid-cols-2"
    >
      {previous ? (
        <AdjacentCard post={previous} label="Previous" align="left" />
      ) : (
        <div className="hidden bg-charcoal-soft/40 sm:block" aria-hidden />
      )}
      {next ? (
        <AdjacentCard post={next} label="Next" align="right" />
      ) : null}
    </nav>
  );
}
