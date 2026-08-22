/**
 * Pull inline post tags from Firestore and optionally migrate them into
 * managed taxonomy collections (featureTags / createdWithTags).
 *
 * Usage
 * -----
 * Pull tag inventory from production into ./backup/post-tags-taxonomy.json:
 *   npm run tags:pull
 *
 * Apply taxonomy + post ID links to production:
 *   npm run tags:apply:production
 *
 * Apply the same backup to local emulators (emulators must be running):
 *   npm run tags:apply:emulator
 *
 * Dry run (no writes):
 *   DRY_RUN=true npm run tags:apply:production
 */
import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { FieldValue } from "firebase-admin/firestore";
import {
  createScriptApp,
  getScriptDb,
  resolveProjectId,
  USE_EMULATOR,
} from "./lib/firebase-admin-script";
import { slugify } from "../src/lib/utils/slug";
import { tagsFromStoredOrHtml } from "../src/lib/utils/tags";
import type { PostTagKind } from "../src/types";

createScriptApp();
const db = getScriptDb();

const BACKUP_DIR = path.join(process.cwd(), "backup");
const BACKUP_PATH = path.join(BACKUP_DIR, "post-tags-taxonomy.json");
const DRY_RUN = process.env.DRY_RUN === "true";

const COLLECTION_BY_KIND: Record<PostTagKind, string> = {
  feature: "featureTags",
  createdWith: "createdWithTags",
};

const POST_ID_FIELD: Record<PostTagKind, "featureTagIds" | "createdWithTagIds"> =
  {
    feature: "featureTagIds",
    createdWith: "createdWithTagIds",
  };

type PostTagRecord = {
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
};

type PostTagAssignment = {
  slug: string;
  featureTags: string[];
  createdWithTags: string[];
};

type TagBackup = {
  exportedAt: string;
  sourceProjectId: string;
  featureTags: PostTagRecord[];
  createdWithTags: PostTagRecord[];
  posts: PostTagAssignment[];
};

function uniqueSortedNames(values: Iterable<string>): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const value of values) {
    const name = value.replace(/\s+/g, " ").trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    names.push(name);
  }
  return names.sort((a, b) => a.localeCompare(b));
}

async function pullBackup(): Promise<TagBackup> {
  const snap = await db.collection("posts").get();
  const featureNames = new Set<string>();
  const createdWithNames = new Set<string>();
  const posts: PostTagAssignment[] = [];

  for (const doc of snap.docs) {
    const data = doc.data();
    const features = tagsFromStoredOrHtml(
      data.featureTags,
      String(data.features ?? ""),
    );
    const createdWith = tagsFromStoredOrHtml(
      data.createdWithTags,
      String(data.builtUsing ?? ""),
    );

    for (const name of features) featureNames.add(name);
    for (const name of createdWith) createdWithNames.add(name);

    if (features.length === 0 && createdWith.length === 0) continue;

    posts.push({
      slug: String(data.slug ?? doc.id),
      featureTags: features,
      createdWithTags: createdWith,
    });
  }

  const toRecords = (names: Set<string>): PostTagRecord[] =>
    uniqueSortedNames(names).map((name, index) => ({
      name,
      slug: slugify(name) || slugify(name.replace(/\s+/g, "-")),
      description: null,
      sortOrder: index,
    }));

  return {
    exportedAt: new Date().toISOString(),
    sourceProjectId: resolveProjectId(),
    featureTags: toRecords(featureNames),
    createdWithTags: toRecords(createdWithNames),
    posts,
  };
}

async function saveBackup(backup: TagBackup): Promise<void> {
  await mkdir(BACKUP_DIR, { recursive: true });
  await writeFile(BACKUP_PATH, `${JSON.stringify(backup, null, 2)}\n`, "utf8");
}

function loadBackup(): TagBackup {
  const raw = readFileSync(BACKUP_PATH, "utf8");
  return JSON.parse(raw) as TagBackup;
}

async function ensureTagId(
  kind: PostTagKind,
  record: PostTagRecord,
  cache: Map<string, string>,
): Promise<string> {
  const key = record.name.toLowerCase();
  const cached = cache.get(key);
  if (cached) return cached;

  const collection = COLLECTION_BY_KIND[kind];
  const existing = await db
    .collection(collection)
    .where("slug", "==", record.slug)
    .limit(1)
    .get();

  if (!existing.empty) {
    const id = existing.docs[0]!.id;
    cache.set(key, id);
    return id;
  }

  if (DRY_RUN) {
    const fakeId = `dry-${kind}-${cache.size}`;
    cache.set(key, fakeId);
    return fakeId;
  }

  const ref = db.collection(collection).doc();
  await ref.set({
    name: record.name,
    slug: record.slug,
    description: record.description,
    sortOrder: record.sortOrder,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  cache.set(key, ref.id);
  return ref.id;
}

async function applyBackup(backup: TagBackup): Promise<void> {
  const featureCache = new Map<string, string>();
  const createdWithCache = new Map<string, string>();

  for (const record of backup.featureTags) {
    await ensureTagId("feature", record, featureCache);
  }
  for (const record of backup.createdWithTags) {
    await ensureTagId("createdWith", record, createdWithCache);
  }

  const postsSnap = await db.collection("posts").get();
  const postsBySlug = new Map(
    postsSnap.docs.map((doc) => [String(doc.data().slug ?? doc.id), doc]),
  );

  let updatedPosts = 0;
  for (const assignment of backup.posts) {
    const doc = postsBySlug.get(assignment.slug);
    if (!doc) {
      console.warn(`[skip post] slug not found: ${assignment.slug}`);
      continue;
    }

    const featureTagIds = [
      ...new Set(
        await Promise.all(
          assignment.featureTags.map(async (name) => {
            const record = backup.featureTags.find(
              (tag) => tag.name.toLowerCase() === name.toLowerCase(),
            );
            if (!record) return null;
            return ensureTagId("feature", record, featureCache);
          }),
        ),
      ),
    ].filter((id): id is string => Boolean(id));

    const createdWithTagIds = [
      ...new Set(
        await Promise.all(
          assignment.createdWithTags.map(async (name) => {
            const record = backup.createdWithTags.find(
              (tag) => tag.name.toLowerCase() === name.toLowerCase(),
            );
            if (!record) return null;
            return ensureTagId("createdWith", record, createdWithCache);
          }),
        ),
      ),
    ].filter((id): id is string => Boolean(id));

    const data = doc.data();
    const existingFeatureIds = Array.isArray(data.featureTagIds)
      ? data.featureTagIds.map(String)
      : [];
    const existingCreatedWithIds = Array.isArray(data.createdWithTagIds)
      ? data.createdWithTagIds.map(String)
      : [];

    const sameFeatures =
      JSON.stringify(existingFeatureIds) === JSON.stringify(featureTagIds);
    const sameCreatedWith =
      JSON.stringify(existingCreatedWithIds) ===
      JSON.stringify(createdWithTagIds);

    if (sameFeatures && sameCreatedWith) continue;

    if (DRY_RUN) {
      console.log(
        `[dry-run] ${assignment.slug}: ${featureTagIds.length} feature IDs, ${createdWithTagIds.length} created-with IDs`,
      );
      updatedPosts += 1;
      continue;
    }

    await doc.ref.update({
      [POST_ID_FIELD.feature]: featureTagIds,
      [POST_ID_FIELD.createdWith]: createdWithTagIds,
      featureTags: [],
      createdWithTags: [],
    });
    updatedPosts += 1;
    console.log(
      `[post] ${assignment.slug}: ${featureTagIds.length} features, ${createdWithTagIds.length} created with`,
    );
  }

  console.log(
    `[apply] ${DRY_RUN ? "Would update" : "Updated"} ${updatedPosts} posts; ${featureCache.size} feature tags, ${createdWithCache.size} created-with tags`,
  );
}

async function main() {
  const mode = process.argv[2] ?? "pull";

  if (mode === "pull") {
    const backup = await pullBackup();
    await saveBackup(backup);
    console.log(
      `[pull] Saved ${backup.featureTags.length} feature tags, ${backup.createdWithTags.length} created-with tags, ${backup.posts.length} posts -> ${BACKUP_PATH}`,
    );
    return;
  }

  if (mode === "apply") {
    const backup = loadBackup();
    console.log(
      `[apply] Using backup from ${backup.exportedAt} (${backup.sourceProjectId})`,
    );
    await applyBackup(backup);
    return;
  }

  throw new Error(`Unknown mode "${mode}". Use "pull" or "apply".`);
}

main().catch((error) => {
  console.error("[sync-post-tag-taxonomy] Failed:", error);
  process.exit(1);
});
