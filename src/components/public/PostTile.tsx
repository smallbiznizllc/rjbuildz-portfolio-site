import Image from "next/image";
import Link from "next/link";
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
  const labels =
    categories && categories.length > 0
      ? categories.map((c) => c.name)
      : category
        ? [category.name]
        : [];

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

        <div
          className="tile-overlay absolute inset-0 flex flex-col justify-end p-5 sm:p-6"
          aria-hidden={false}
        >
          <p className="font-display text-xl font-bold leading-tight text-parchment [text-shadow:0px_1px_2px_#000] sm:text-2xl">
            {post.title}
          </p>
          {labels.length > 0 ? (
            <p className="mt-1.5 text-xs font-bold uppercase tracking-[0.14em] text-copper [text-shadow:0px_1px_2px_#000]">
              {labels.join(" · ")}
            </p>
          ) : null}
        </div>

        <span className="sr-only">
          {post.title}
          {labels.length ? `, ${labels.join(", ")}` : ""}
        </span>
      </Link>
    </article>
  );
}
