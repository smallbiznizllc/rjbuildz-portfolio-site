import Image from "next/image";
import Link from "next/link";
import type { Post } from "@/types";

type RelatedItem = Pick<Post, "id" | "slug" | "title" | "mainImage">;

export function RelatedPosts({ posts }: { posts: RelatedItem[] }) {
  if (posts.length === 0) return null;

  return (
    <section
      aria-labelledby="related-heading"
      className="mt-16 border-t border-[var(--border-subtle)]"
    >
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2
          id="related-heading"
          className="font-display text-3xl text-charcoal sm:text-4xl"
        >
          Related
        </h2>
        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <li key={post.id}>
              <Link
                href={`/posts/${post.slug}`}
                className="group relative flex min-h-[14rem] overflow-hidden bg-charcoal-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copper"
              >
                {post.mainImage?.url ? (
                  <Image
                    src={post.mainImage.url}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
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
                  <span className="inline-flex rounded-full bg-copper px-2.5 py-1 text-xs font-bold uppercase tracking-[0.14em] text-black">
                    Project
                  </span>
                  <span className="mt-2 block font-display text-2xl leading-tight text-parchment [text-shadow:0px_1px_2px_#000]">
                    {post.title}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
