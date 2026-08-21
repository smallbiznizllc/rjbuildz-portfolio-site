import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { PostGallery } from "@/components/gallery/PostGallery";
import { AdjacentPostsNav } from "@/components/public/AdjacentPostsNav";
import { PostDetailsSection } from "@/components/public/PostDetailsSection";
import { RelatedPosts } from "@/components/public/RelatedPosts";
import { SeeItLiveButton } from "@/components/public/SeeItLiveButton";
import { formatPublishedDate } from "@/lib/utils/dates";
import { sanitizeHtml, stripHtml } from "@/lib/utils/sanitize";
import {
  safeGetAdjacentPosts,
  safeGetCategories,
  safeGetPostBySlug,
  safeGetPublishedPostsByIds,
  safeGetPublishedPostsSharingCategories,
} from "@/lib/firestore/safe-public";
import { getSiteUrl, SITE_NAME } from "@/lib/site";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function hasRichText(html: string): boolean {
  return stripHtml(html).length > 0;
}

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

  const [categories, adjacent, related, categoryRelated] = await Promise.all([
    safeGetCategories(),
    post.publishedAt
      ? safeGetAdjacentPosts(post.publishedAt, post.id)
      : Promise.resolve({ previous: null, next: null }),
    safeGetPublishedPostsByIds(
      (post.relatedPostIds ?? []).filter((id) => id !== post.id),
    ),
    safeGetPublishedPostsSharingCategories(post.categoryIds, [post.id]),
  ]);

  const relatedIds = new Set(related.map((item) => item.id));
  const relatedPosts = [
    ...related,
    ...categoryRelated.filter((item) => !relatedIds.has(item.id)),
  ];

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
  const featureTags = post.featureTags;
  const createdWithTags = post.createdWithTags;
  const safeFeatures =
    featureTags.length === 0 && hasRichText(post.features)
      ? sanitizeHtml(post.features)
      : "";
  const safeBuiltUsing =
    createdWithTags.length === 0 && hasRichText(post.builtUsing)
      ? sanitizeHtml(post.builtUsing)
      : "";
  const showFeatures = featureTags.length > 0 || Boolean(safeFeatures);
  const showCreatedWith =
    createdWithTags.length > 0 || Boolean(safeBuiltUsing);
  const showDetails = Boolean(safeContent) || showFeatures || showCreatedWith;

  return (
    <article className="pb-20 min-[1000px]:overflow-x-clip">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="relative z-0 bg-charcoal">
        {post.mainImage?.url ? (
          <div
            className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
            aria-hidden
          >
            <Image
              src={post.mainImage.url}
              alt=""
              fill
              sizes="100vw"
              className="object-cover opacity-5 scale-200"
            />
          </div>
        ) : null}
        <div className="relative z-10 mx-auto max-w-7xl px-4 pb-14 pt-16 sm:px-6 sm:pb-16 sm:pt-20 lg:px-8">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-copper">
            Project
          </p>
          <h1 className="mt-4 w-full font-display text-[1.8rem] leading-tight text-parchment sm:text-[2.4rem] md:text-[3rem]">
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
          <div className="relative z-10 mx-auto aspect-[16/10] w-full max-w-7xl overflow-hidden sm:aspect-[16/9]">
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

      {post.seeItLive ? (
        <div className="relative z-30 h-0">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
            <SeeItLiveButton href={post.seeItLive} />
          </div>
        </div>
      ) : null}

      <PostGallery images={post.gallery} className="pb-[120px]" />

      {showDetails ? (
        <PostDetailsSection
          html={safeContent}
          featureTags={featureTags}
          featureHtml={safeFeatures}
          createdWithTags={createdWithTags}
          createdWithHtml={safeBuiltUsing}
        />
      ) : null}

      <RelatedPosts posts={relatedPosts} categories={postCategories} />

      <AdjacentPostsNav previous={adjacent.previous} next={adjacent.next} />
    </article>
  );
}
