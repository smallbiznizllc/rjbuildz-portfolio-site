function TagPills({ tags }: { tags: string[] }) {
  return (
    <ul className="mt-4 flex flex-wrap gap-2">
      {tags.map((tag) => (
        <li
          key={tag}
          className="inline-flex rounded-full bg-white px-3 py-1.5 text-sm font-medium text-copper"
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
        className="font-display text-2xl leading-none text-white"
      >
        {title}
      </h3>
      {tags.length > 0 ? (
        <TagPills tags={tags} />
      ) : (
        <div
          className="prose-portfolio prose-portfolio--on-copper mt-4 [&_p:last-child]:mb-0"
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

  return (
    <section aria-labelledby="details-heading" className="relative z-20">
      <div className="md:mx-auto md:w-full md:max-w-[1100px]">
        <div className="relative md:-mt-24 lg:-mt-28">
          <h2
            id="details-heading"
            className="absolute z-10 bg-black px-5 py-3 text-center font-display text-3xl leading-none text-white sm:text-4xl md:px-6 md:py-3.5 max-[1200px]:top-[-30px] max-sm:left-[calc(50%-135px)] max-sm:w-[270px] sm:max-[1200px]:left-0 sm:max-[1200px]:w-[350px] min-[1201px]:top-[-40px] min-[1201px]:-left-[50px] min-[1201px]:w-auto min-[1201px]:text-left"
          >
            The Details
          </h2>
          <div className="bg-copper px-6 pt-16 pb-10 sm:px-10 sm:pt-16 sm:pb-12 md:px-14 md:pt-20 md:pb-16 lg:px-16">
            {html ? (
              <div
                className="prose-portfolio prose-portfolio--on-copper text-center md:text-left [&_p:last-child]:mb-0"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            ) : null}
            {showMeta ? (
              <div
                className={`grid grid-cols-1 gap-6 text-center md:text-left ${
                  html ? "mt-10 border-t border-white/25 pt-8" : ""
                } ${showFeatures && showCreatedWith ? "md:grid-cols-2 md:gap-8" : ""}`}
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
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
