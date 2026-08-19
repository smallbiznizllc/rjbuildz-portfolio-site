/**
 * Apply excerpt, body, and SEO (title/description/keywords) from
 * docs/post-copy-recommendations.csv. Leaves mainImage, gallery, and seo.ogImage alone.
 *
 * Usage (emulators must be running):
 *   USE_EMULATOR=true tsx scripts/apply-copy-recommendations.ts
 */
import { readFileSync } from "node:fs";
import { getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";

const PROJECT_ID = "demo-rjbuildz";
const CSV_PATH = new URL("../docs/post-copy-recommendations.csv", import.meta.url);

if (!getApps().length) {
  initializeApp({ projectId: PROJECT_ID });
}

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field.replace(/\r$/, ""));
      field = "";
      if (row.some((cell) => cell.length)) rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  if (field.length || row.length) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }

  const header = rows[0];
  if (!header) return [];
  return rows.slice(1).map((cells) => {
    const rec: Record<string, string> = {};
    header.forEach((key, index) => {
      rec[key] = cells[index] ?? "";
    });
    return rec;
  });
}

function keywordsFromCsv(value: string): string[] {
  return value
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);
}

async function main() {
  const csv = parseCsv(readFileSync(CSV_PATH, "utf8"));
  const bySlug = new Map(csv.map((row) => [row.slug, row]));

  const db = getFirestore();
  const snap = await db.collection("posts").get();
  const unmatchedCsv = new Set(bySlug.keys());
  const unmatchedPosts: string[] = [];
  let updated = 0;

  for (const doc of snap.docs) {
    const slug = String(doc.data().slug ?? "");
    const rec = bySlug.get(slug);
    if (!rec) {
      unmatchedPosts.push(slug || doc.id);
      continue;
    }
    unmatchedCsv.delete(slug);

    const keywords = keywordsFromCsv(rec.recommended_seo_keywords ?? "");
    await doc.ref.update({
      excerpt: rec.recommended_excerpt ?? "",
      content: rec.recommended_body_html ?? "",
      "seo.title": rec.recommended_seo_title || null,
      "seo.description": rec.recommended_seo_description || null,
      "seo.keywords": keywords,
      updatedAt: FieldValue.serverTimestamp(),
    });
    updated += 1;
    console.log(`[copy] ${slug}`);
  }

  console.log(`[apply-copy-recommendations] Updated ${updated} of ${snap.size} posts`);
  if (unmatchedCsv.size) {
    console.warn("CSV slugs with no post:", [...unmatchedCsv].join(", "));
  }
  if (unmatchedPosts.length) {
    console.warn("Posts with no CSV row:", unmatchedPosts.join(", "));
  }
}

main().catch((error) => {
  console.error("[apply-copy-recommendations] Failed:", error);
  process.exit(1);
});
