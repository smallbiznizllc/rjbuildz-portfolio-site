/**
 * Persist featureTags / createdWithTags on emulator posts by parsing
 * existing Features and Created with HTML lists.
 *
 * Usage (emulators must be running):
 *   USE_EMULATOR=true tsx scripts/migrate-feature-tags.ts
 */
import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { tagsFromStoredOrHtml } from "../src/lib/utils/tags";

process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";

const PROJECT_ID = "demo-rjbuildz";

if (!getApps().length) {
  initializeApp({ projectId: PROJECT_ID });
}

async function main() {
  const db = getFirestore();
  const snap = await db.collection("posts").get();
  let updated = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    const featureTags = tagsFromStoredOrHtml(
      data.featureTags,
      String(data.features ?? ""),
    );
    const createdWithTags = tagsFromStoredOrHtml(
      data.createdWithTags,
      String(data.builtUsing ?? ""),
    );

    const sameFeatures =
      Array.isArray(data.featureTags) &&
      JSON.stringify(data.featureTags) === JSON.stringify(featureTags);
    const sameCreated =
      Array.isArray(data.createdWithTags) &&
      JSON.stringify(data.createdWithTags) === JSON.stringify(createdWithTags);

    if (sameFeatures && sameCreated) continue;

    await doc.ref.update({ featureTags, createdWithTags });
    updated += 1;
    console.log(
      `[tags] ${data.slug ?? doc.id}: ${featureTags.length} features, ${createdWithTags.length} created with`,
    );
  }

  console.log(`[migrate-feature-tags] Updated ${updated} of ${snap.size} posts`);
}

main().catch((error) => {
  console.error("[migrate-feature-tags] Failed:", error);
  process.exit(1);
});
