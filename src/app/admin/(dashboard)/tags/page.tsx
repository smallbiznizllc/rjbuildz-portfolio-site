import { AdminShell } from "@/components/admin/AdminShell";
import {
  PostTagsClient,
  type PostTagListItem,
} from "@/components/admin/PostTagsClient";
import { getPostTags } from "@/lib/firestore/post-tags";
import {
  countPostsByCreatedWithTag,
  countPostsByFeatureTag,
} from "@/lib/firestore/posts";

export default async function TagsPage() {
  const [featureTags, createdWithTags] = await Promise.all([
    getPostTags("feature"),
    getPostTags("createdWith"),
  ]);

  const [featureCounts, createdWithCounts] = await Promise.all([
    Promise.all(
      featureTags.map(async (tag) => ({
        id: tag.id,
        count: await countPostsByFeatureTag(tag.id),
      })),
    ),
    Promise.all(
      createdWithTags.map(async (tag) => ({
        id: tag.id,
        count: await countPostsByCreatedWithTag(tag.id),
      })),
    ),
  ]);

  const featureCountMap = new Map(featureCounts.map((item) => [item.id, item.count]));
  const createdWithCountMap = new Map(
    createdWithCounts.map((item) => [item.id, item.count]),
  );

  const toListItem = (
    tags: typeof featureTags,
    countMap: Map<string, number>,
  ): PostTagListItem[] =>
    tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      description: tag.description,
      sortOrder: tag.sortOrder,
      createdAt: tag.createdAt.toISOString(),
      updatedAt: tag.updatedAt.toISOString(),
      postCount: countMap.get(tag.id) ?? 0,
    }));

  return (
    <AdminShell title="Tags">
      <div className="mx-auto max-w-3xl space-y-10">
        <section>
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">Features</h2>
          <PostTagsClient
            kind="feature"
            title="Features"
            tags={toListItem(featureTags, featureCountMap)}
          />
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">
            Created with
          </h2>
          <PostTagsClient
            kind="createdWith"
            title="Created with"
            tags={toListItem(createdWithTags, createdWithCountMap)}
          />
        </section>
      </div>
    </AdminShell>
  );
}
