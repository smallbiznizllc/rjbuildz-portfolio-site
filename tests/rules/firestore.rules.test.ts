/**
 * Firestore security rules tests.
 *
 * Requires the Firestore emulator (and preferably the full suite):
 *   firebase emulators:exec --only firestore,auth "npm run test:rules"
 * or start emulators separately, then: npm run test:rules
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

const PROJECT_ID = "demo-rjbuildz-rules";
const RULES_PATH = resolve(__dirname, "../../firestore.rules");

let testEnv: RulesTestEnvironment;

const publishedPost = {
  title: "Published",
  slug: "published",
  searchableTitle: "published",
  excerpt: "ex",
  content: "<p>hi</p>",
  status: "published",
  categoryIds: ["cat-1"],
  mainImage: null,
  gallery: [],
  seo: { title: null, description: null, ogImage: null, keywords: [] },
  sortOrder: 0,
  publishedAt: Timestamp.fromDate(new Date("2025-01-10T00:00:00Z")),
  createdAt: Timestamp.fromDate(new Date("2026-08-10T00:00:00Z")),
  updatedAt: Timestamp.fromDate(new Date("2026-08-10T00:00:00Z")),
  authorId: "admin-uid",
};

const draftPost = {
  ...publishedPost,
  title: "Draft",
  slug: "draft",
  searchableTitle: "draft",
  status: "draft",
  publishedAt: null,
};

function contactPayload(overrides: Record<string, unknown> = {}) {
  return {
    name: "Ada Lovelace",
    email: "ada@example.com",
    subject: "Hello",
    message: "Interested in a project.",
    createdAt: Timestamp.now(),
    read: false,
    source: "website",
    ...overrides,
  };
}

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync(RULES_PATH, "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv?.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, "posts/pub-1"), publishedPost);
    await setDoc(doc(db, "posts/draft-1"), draftPost);
    await setDoc(doc(db, "categories/cat-1"), {
      name: "Photography",
      slug: "photography",
      description: "Photos",
      sortOrder: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    await setDoc(doc(db, "siteSettings/general"), {
      siteName: "RJ Buildz",
      updatedAt: Timestamp.now(),
    });
  });
});

describe("Firestore rules — public", () => {
  it("can read published posts and categories", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertSucceeds(getDoc(doc(db, "posts/pub-1")));
    await assertSucceeds(getDoc(doc(db, "categories/cat-1")));
    await assertSucceeds(getDoc(doc(db, "siteSettings/general")));
  });

  it("cannot read draft posts", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, "posts/draft-1")));
  });

  it("cannot write posts or categories", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(
      setDoc(doc(db, "posts/hacker"), { ...publishedPost, title: "Nope" }),
    );
    await assertFails(
      updateDoc(doc(db, "posts/pub-1"), { title: "Hacked" }),
    );
    await assertFails(deleteDoc(doc(db, "posts/pub-1")));
    await assertFails(
      setDoc(doc(db, "categories/cat-x"), {
        name: "X",
        slug: "x",
        description: null,
        sortOrder: 9,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }),
    );
  });

  it("can create contactMessages; cannot read them", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    const ref = await assertSucceeds(
      addDoc(collection(db, "contactMessages"), contactPayload()),
    );
    await assertFails(getDoc(doc(db, `contactMessages/${ref.id}`)));
  });
});

describe("Firestore rules — admin", () => {
  function adminDb() {
    return testEnv
      .authenticatedContext("admin-uid", { admin: true })
      .firestore();
  }

  it("can CRUD posts and categories", async () => {
    const db = adminDb();
    await assertSucceeds(getDoc(doc(db, "posts/draft-1")));
    await assertSucceeds(
      setDoc(doc(db, "posts/admin-new"), {
        ...publishedPost,
        title: "Admin created",
        slug: "admin-created",
      }),
    );
    await assertSucceeds(
      updateDoc(doc(db, "posts/pub-1"), { title: "Updated by admin" }),
    );
    await assertSucceeds(deleteDoc(doc(db, "posts/admin-new")));
    await assertSucceeds(
      updateDoc(doc(db, "categories/cat-1"), { description: "Updated" }),
    );
  });

  it("can read contactMessages", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        doc(context.firestore(), "contactMessages/msg-1"),
        contactPayload(),
      );
    });
    const db = adminDb();
    await assertSucceeds(getDoc(doc(db, "contactMessages/msg-1")));
  });
});
