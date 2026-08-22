import { AdminShell } from "@/components/admin/AdminShell";
import {
  PostTagSearchPanel,
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
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
        <PostTagSearchPanel
          kind="feature"
          title="Features"
          tags={toListItem(featureTags, featureCountMap)}
        />
        <PostTagSearchPanel
          kind="createdWith"
          title="Created with"
          tags={toListItem(createdWithTags, createdWithCountMap)}
        />
      </div>
    </AdminShell>
  );
}
