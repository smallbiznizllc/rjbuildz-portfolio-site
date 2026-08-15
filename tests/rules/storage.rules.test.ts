/**
 * Storage security rules tests.
 *
 * Requires the Storage emulator:
 *   firebase emulators:exec --only storage "npx vitest run tests/rules/storage.rules.test.ts"
 * or start emulators, then run the suite via npm run test:rules.
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
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

const PROJECT_ID = "demo-rjbuildz-storage-rules";
const RULES_PATH = resolve(__dirname, "../../storage.rules");

let testEnv: RulesTestEnvironment;

const SAMPLE_JPEG = Uint8Array.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
  0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
]);

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    storage: {
      rules: readFileSync(RULES_PATH, "utf8"),
      host: "127.0.0.1",
      port: 9199,
    },
  });
});

afterAll(async () => {
  await testEnv?.cleanup();
});

beforeEach(async () => {
  await testEnv.clearStorage();
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const storage = context.storage();
    await uploadBytes(ref(storage, "posts/post-1/main/hero.jpg"), SAMPLE_JPEG, {
      contentType: "image/jpeg",
    });
  });
});

describe("Storage rules — public", () => {
  it("can read images under posts/", async () => {
    const storage = testEnv.unauthenticatedContext().storage();
    await assertSucceeds(
      getDownloadURL(ref(storage, "posts/post-1/main/hero.jpg")),
    );
  });

  it("cannot write images", async () => {
    const storage = testEnv.unauthenticatedContext().storage();
    await assertFails(
      uploadBytes(ref(storage, "posts/post-1/main/hack.jpg"), SAMPLE_JPEG, {
        contentType: "image/jpeg",
      }),
    );
  });

  it("cannot delete images", async () => {
    const storage = testEnv.unauthenticatedContext().storage();
    await assertFails(deleteObject(ref(storage, "posts/post-1/main/hero.jpg")));
  });

  it("cannot read outside posts/", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await uploadBytes(
        ref(context.storage(), "secrets/file.bin"),
        SAMPLE_JPEG,
        { contentType: "image/jpeg" },
      );
    });
    const storage = testEnv.unauthenticatedContext().storage();
    await assertFails(getDownloadURL(ref(storage, "secrets/file.bin")));
  });
});

describe("Storage rules — admin", () => {
  it("can write images under posts/", async () => {
    const storage = testEnv
      .authenticatedContext("admin-uid", { admin: true })
      .storage();
    await assertSucceeds(
      uploadBytes(ref(storage, "posts/post-2/main/cover.jpg"), SAMPLE_JPEG, {
        contentType: "image/jpeg",
      }),
    );
  });

  it("rejects non-image content types", async () => {
    const storage = testEnv
      .authenticatedContext("admin-uid", { admin: true })
      .storage();
    await assertFails(
      uploadBytes(ref(storage, "posts/post-2/main/notes.txt"), Buffer.from("hi"), {
        contentType: "text/plain",
      }),
    );
  });

  it("can delete images under posts/", async () => {
    const storage = testEnv
      .authenticatedContext("admin-uid", { admin: true })
      .storage();
    await assertSucceeds(
      deleteObject(ref(storage, "posts/post-1/main/hero.jpg")),
    );
  });

  it("signed-in non-admin cannot delete images", async () => {
    const storage = testEnv.authenticatedContext("user-uid").storage();
    await assertFails(deleteObject(ref(storage, "posts/post-1/main/hero.jpg")));
  });
});
