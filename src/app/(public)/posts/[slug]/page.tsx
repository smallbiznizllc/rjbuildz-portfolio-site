import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { PostGallery } from "@/components/gallery/PostGallery";
import { AdjacentPostsNav } from "@/components/public/AdjacentPostsNav";
import { formatPublishedDate } from "@/lib/utils/dates";
import { sanitizeHtml } from "@/lib/utils/sanitize";
import {
  safeGetAdjacentPosts,
  safeGetCategories,
  safeGetPostBySlug,
} from "@/lib/firestore/safe-public";
import { getSiteUrl, SITE_NAME } from "@/lib/site";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await safeGetPostBySlug(slug);
  if (!post || post.status !== "published") {
    return { title: "Project not found" };
  }

  const title = post.seo.title || post.title;
  const description =
    post.seo.description || post.excerpt || `${post.title} — ${SITE_NAME}`;
  const ogImage = post.seo.ogImage || post.mainImage?.url || undefined;

  return {
    title,
    description,
    keywords: post.seo.keywords.length ? post.seo.keywords : undefined,
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await safeGetPostBySlug(slug);

  if (!post || post.status !== "published") {
    notFound();
  }

  const [categories, adjacent] = await Promise.all([
    safeGetCategories(),
    post.publishedAt
      ? safeGetAdjacentPosts(post.publishedAt, post.id)
      : Promise.resolve({ previous: null, next: null }),
  ]);

  const postCategories = post.categoryIds
    .map((id) => categories.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  const siteUrl = getSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt || post.seo.description || undefined,
    image: post.mainImage?.url || post.seo.ogImage || undefined,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: {
      "@type": "Organization",
      name: SITE_NAME,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
    },
    mainEntityOfPage: `${siteUrl}/posts/${post.slug}`,
  };

  const safeContent = sanitizeHtml(post.content);

  return (
    <article className="pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="relative overflow-hidden bg-charcoal">
        <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-16 sm:px-6 sm:pb-16 sm:pt-20 lg:px-8">
          {postCategories.length > 0 ? (
            <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium uppercase tracking-[0.16em] text-copper">
              {postCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className="hover:text-parchment"
                >
                  {cat.name}
                </Link>
              ))}
            </p>
          ) : (
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-copper">
              Project
            </p>
          )}
          <h1 className="mt-4 max-w-3xl font-display text-4xl leading-tight text-parchment sm:text-5xl md:text-6xl">
            {post.title}
          </h1>
          {post.excerpt ? (
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-parchment/70 sm:text-lg">
              {post.excerpt}
            </p>
          ) : null}
          {post.publishedAt ? (
            <time
              dateTime={post.publishedAt.toISOString()}
              className="mt-6 block text-sm text-parchment/45"
            >
              {formatPublishedDate(post.publishedAt)}
            </time>
          ) : null}
        </div>

        {post.mainImage?.url ? (
          <div className="relative mx-auto aspect-[16/10] w-full max-w-7xl overflow-hidden sm:aspect-[21/9]">
            <Image
              src={post.mainImage.url}
              alt={post.mainImage.alt || post.title}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </div>
        ) : null}
      </header>

      <div className="mx-auto max-w-3xl px-4 pt-12 sm:px-6 lg:px-8">
        {safeContent ? (
          <div
            className="prose-portfolio"
            dangerouslySetInnerHTML={{ __html: safeContent }}
          />
        ) : null}

        <PostGallery images={post.gallery} />
      </div>

      <AdjacentPostsNav previous={adjacent.previous} next={adjacent.next} />
    </article>
  );
}
