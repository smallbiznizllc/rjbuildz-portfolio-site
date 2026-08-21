"use client";

import { useLayoutEffect, useRef, useState } from "react";

function TagPills({ tags }: { tags: string[] }) {
  return (
    <ul className="mt-4 flex flex-wrap gap-2">
      {tags.map((tag) => (
        <li
          key={tag}
          className="inline-flex rounded-full border border-copper/35 bg-copper-soft px-3 py-1.5 text-sm font-medium text-copper"
        >
          {tag}
        </li>
      ))}
    </ul>
  );
}

function DetailsMetaBlock({
  headingId,
  title,
  tags,
  html,
}: {
  headingId: string;
  title: string;
  tags: string[];
  html: string;
}) {
  return (
    <section aria-labelledby={headingId}>
      <h3
        id={headingId}
        className="font-display text-[1rem] leading-none text-ink"
      >
        {title}
      </h3>
      {tags.length > 0 ? (
        <TagPills tags={tags} />
      ) : (
        <div
          className="prose-portfolio mt-4 [&_p:last-child]:mb-0"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </section>
  );
}

export function PostDetailsSection({
  html,
  featureTags = [],
  featureHtml = "",
  createdWithTags = [],
  createdWithHtml = "",
}: {
  html: string;
  featureTags?: string[];
  featureHtml?: string;
  createdWithTags?: string[];
  createdWithHtml?: string;
}) {
  const showFeatures = featureTags.length > 0 || Boolean(featureHtml);
  const showCreatedWith =
    createdWithTags.length > 0 || Boolean(createdWithHtml);
  const showMeta = showFeatures || showCreatedWith;

  const metaRef = useRef<HTMLDivElement>(null);
  const [metaHeight, setMetaHeight] = useState(0);

  useLayoutEffect(() => {
    const el = metaRef.current;
    if (!el || !showMeta) {
      setMetaHeight(0);
      return;
    }
    const update = () => setMetaHeight(el.offsetHeight);
    update();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [showMeta, showFeatures, showCreatedWith, featureTags, createdWithTags]);

  return (
    <section
      aria-labelledby="details-heading"
      className="relative z-20 bg-charcoal min-[1000px]:bg-[linear-gradient(to_bottom,transparent_0%,var(--charcoal)_6rem,var(--charcoal)_100%)] min-[1000px]:overflow-x-clip"
    >
      <div className="-mt-10 md:mx-auto md:w-full md:max-w-[1100px] min-[1000px]:relative min-[1000px]:top-[-40px]">
        <div className="relative max-[999px]:-mt-5">
          <h2
            id="details-heading"
            className="absolute z-30 bg-copper px-5 py-3 text-center font-display text-3xl leading-none text-black sm:text-4xl md:px-6 md:py-3.5 max-[1200px]:top-[-30px] max-[1200px]:left-0 max-[1200px]:w-[min(350px,100%)] min-[1201px]:top-[-20px] min-[1201px]:-left-[50px] min-[1201px]:w-auto min-[1201px]:text-left"
          >
            The Details
          </h2>
          <div className="relative">
            {html ? (
              <div className="post-details-body px-6 pt-16 pb-12 sm:px-10 sm:pt-16 sm:pb-14 md:px-14 md:pt-20 md:pb-16 lg:px-16">
                <div
                  className="relative z-[1] prose-portfolio prose-portfolio--on-dark text-left [&_p:last-child]:mb-0"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              </div>
            ) : null}
            {showMeta ? (
              <div
                ref={metaRef}
                className="post-details-meta absolute inset-x-0 top-full z-10 px-6 pt-[80px] pb-8 sm:px-10 sm:pb-10 md:px-14 md:pb-12 lg:px-16"
              >
                <div
                  className={`relative z-[1] grid grid-cols-1 gap-6 text-center md:text-left ${
                    showFeatures && showCreatedWith
                      ? "md:grid-cols-2 md:gap-8"
                      : ""
                  }`}
                >
                  {showFeatures ? (
                    <DetailsMetaBlock
                      headingId="features-heading"
                      title="Features"
                      tags={featureTags}
                      html={featureHtml}
                    />
                  ) : null}
                  {showCreatedWith ? (
                    <DetailsMetaBlock
                      headingId="built-using-heading"
                      title="Created with"
                      tags={createdWithTags}
                      html={createdWithHtml}
                    />
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
          {showMeta ? (
            <div
              className="pointer-events-none h-[var(--meta-h)] bg-background max-[999px]:h-[calc(var(--meta-h)+2.5rem)]"
              style={{ ["--meta-h" as string]: `${metaHeight}px` }}
              aria-hidden
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
