import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Category, Post } from "@/types";

/** Humme-style alternating tile heights — driven by index, not image metadata. */
const ASPECT_CLASSES = [
  "masonry-aspect-tall",
  "masonry-aspect-short",
  "masonry-aspect-square",
  "masonry-aspect-wide",
  "masonry-aspect-tall",
  "masonry-aspect-short",
  "masonry-aspect-wide",
] as const;

export function PostTile({
  post,
  category,
  categories,
  index = 0,
  priority = false,
}: {
  post: Post;
  /** @deprecated prefer `categories` */
  category?: Category | null;
  categories?: Category[];
  index?: number;
  priority?: boolean;
}) {
  const href = `/posts/${post.slug}`;
  const image = post.mainImage;
  const aspect = ASPECT_CLASSES[index % ASPECT_CLASSES.length]!;
  const alt = image?.alt || post.title;

  return (
    <article className="block w-full">
      <Link
        href={href}
        className={cn(
          "group relative block overflow-hidden bg-charcoal-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copper",
          aspect,
        )}
      >
        {image?.url ? (
          <Image
            src={image.url}
            alt={alt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="tile-image object-cover"
            priority={priority}
          />
        ) : (
          <div
            className="absolute inset-0 bg-gradient-to-br from-charcoal-soft via-charcoal-muted/40 to-copper/20"
            aria-hidden
          />
        )}

        {post.favorite ? (
          <span
            className="absolute top-3 left-3 z-20 inline-flex size-8 items-center justify-center rounded-full bg-copper text-white [filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.35))]"
            aria-hidden
          >
            <Star className="size-4 fill-current" strokeWidth={0} />
          </span>
        ) : null}

        {post.inProgress ? (
          <span className="absolute top-3 right-3 z-20 inline-flex items-center gap-1.5 rounded-full bg-white/50 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-charcoal backdrop-blur-[2px]">
            <span
              className="size-1.5 shrink-0 rounded-full bg-emerald-500"
              aria-hidden
            />
            In Progress
          </span>
        ) : null}

        <div
          className="tile-overlay absolute inset-0 flex flex-col justify-end p-5 sm:p-6"
          aria-hidden={false}
        >
          <p className="font-display text-[1rem] font-bold leading-tight text-parchment [text-shadow:0px_1px_2px_#000]">
            {post.title}
          </p>
        </div>

        <span className="sr-only">
          {post.title}
          {post.favorite ? ", Favorite" : ""}
          {post.inProgress ? ", In Progress" : ""}
        </span>
      </Link>
    </article>
  );
}
