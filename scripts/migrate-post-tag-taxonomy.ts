/**
 * Migrate inline featureTags / createdWithTags strings on posts into
 * managed taxonomy collections (featureTags, createdWithTags) and link
 * posts via featureTagIds / createdWithTagIds.
 *
 * Usage (emulators or production credentials):
 *   USE_EMULATOR=true tsx scripts/migrate-post-tag-taxonomy.ts
 */
import { getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { slugify } from "../src/lib/utils/slug";
import { tagsFromStoredOrHtml } from "../src/lib/utils/tags";
import type { PostTagKind } from "../src/types";

process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";

const PROJECT_ID = "demo-rjbuildz";

if (!getApps().length) {
  initializeApp({ projectId: PROJECT_ID });
}

const COLLECTION_BY_KIND: Record<PostTagKind, string> = {
  feature: "featureTags",
  createdWith: "createdWithTags",
};

const POST_ID_FIELD: Record<PostTagKind, "featureTagIds" | "createdWithTagIds"> =
  {
    feature: "featureTagIds",
    createdWith: "createdWithTagIds",
  };

async function ensureTagId(
  db: FirebaseFirestore.Firestore,
  kind: PostTagKind,
  name: string,
  cache: Map<string, string>,
): Promise<string> {
  const key = name.toLowerCase();
  const cached = cache.get(key);
  if (cached) return cached;

  const slug = slugify(name) || slugify(name.replace(/\s+/g, "-"));
  const collection = COLLECTION_BY_KIND[kind];
  const existing = await db
    .collection(collection)
    .where("slug", "==", slug)
    .limit(1)
    .get();

  if (!existing.empty) {
    const id = existing.docs[0]!.id;
    cache.set(key, id);
    return id;
  }

  const ref = db.collection(collection).doc();
  await ref.set({
    name,
    slug,
    description: null,
    sortOrder: cache.size,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  cache.set(key, ref.id);
  return ref.id;
}

async function main() {
  const db = getFirestore();
  const snap = await db.collection("posts").get();
  const featureCache = new Map<string, string>();
  const createdWithCache = new Map<string, string>();
  let updated = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    const featureNames = tagsFromStoredOrHtml(
      data.featureTags,
      String(data.features ?? ""),
    );
    const createdWithNames = tagsFromStoredOrHtml(
      data.createdWithTags,
      String(data.builtUsing ?? ""),
    );

    if (featureNames.length === 0 && createdWithNames.length === 0) {
      continue;
    }

    const featureTagIds = [
      ...new Set(
        await Promise.all(
          featureNames.map((name) =>
            ensureTagId(db, "feature", name, featureCache),
          ),
        ),
      ),
    ];
    const createdWithTagIds = [
      ...new Set(
        await Promise.all(
          createdWithNames.map((name) =>
            ensureTagId(db, "createdWith", name, createdWithCache),
          ),
        ),
      ),
    ];

    const existingFeatureIds = Array.isArray(data.featureTagIds)
      ? data.featureTagIds.map(String)
      : [];
    const existingCreatedWithIds = Array.isArray(data.createdWithTagIds)
      ? data.createdWithTagIds.map(String)
      : [];

    const sameFeatures =
      JSON.stringify(existingFeatureIds) === JSON.stringify(featureTagIds);
    const sameCreatedWith =
      JSON.stringify(existingCreatedWithIds) === JSON.stringify(createdWithTagIds);

    if (sameFeatures && sameCreatedWith) continue;

    await doc.ref.update({
      [POST_ID_FIELD.feature]: featureTagIds,
      [POST_ID_FIELD.createdWith]: createdWithTagIds,
    });
    updated += 1;
    console.log(
      `[taxonomy] ${data.slug ?? doc.id}: ${featureTagIds.length} features, ${createdWithTagIds.length} created with`,
    );
  }

  console.log(
    `[migrate-post-tag-taxonomy] Updated ${updated} of ${snap.size} posts; created ${featureCache.size} feature tags and ${createdWithCache.size} created-with tags`,
  );
}

main().catch((error) => {
  console.error("[migrate-post-tag-taxonomy] Failed:", error);
  process.exit(1);
});
