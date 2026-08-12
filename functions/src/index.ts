/**
 * Cloud Functions for the RJ Buildz portfolio CMS.
 *
 * - onPostDeleted: cleanup Storage objects under posts/{postId}/ when a post doc is deleted.
 * - submitContact: optional callable stub — production contact flow uses the Next.js
 *   API route at POST /api/contact (rate limit + Firestore + optional Resend email).
 */

import { initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { logger } from "firebase-functions";
import { onDocumentDeleted } from "firebase-functions/v2/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";

initializeApp();

/**
 * When a post document is deleted, remove its Storage folder.
 * Paths follow: posts/{postId}/main/... and posts/{postId}/gallery/...
 */
export const onPostDeleted = onDocumentDeleted(
  "posts/{postId}",
  async (event) => {
    const postId = event.params.postId;
    if (!postId) {
      logger.warn("onPostDeleted missing postId");
      return;
    }

    const prefix = `posts/${postId}/`;
    const bucket = getStorage().bucket();

    try {
      const [files] = await bucket.getFiles({ prefix });
      if (!files.length) {
        logger.info(`No storage files for ${prefix}`);
        return;
      }

      await Promise.all(
        files.map(async (file) => {
          await file.delete({ ignoreNotFound: true });
        }),
      );
      logger.info(`Deleted ${files.length} file(s) under ${prefix}`);
    } catch (error) {
      logger.error(`Failed cleaning storage for ${prefix}`, error);
      throw error;
    }
  },
);

/**
 * Optional callable for contact submissions.
 * Prefer the Next.js route (`src/app/api/contact/route.ts`) which already
 * validates with Zod, rate-limits, writes contactMessages, and emails via Resend.
 * This stub exists so Functions can host an alternate entry point if needed.
 */
export const submitContact = onCall(async (request) => {
  const data = request.data as {
    name?: string;
    email?: string;
    subject?: string;
    message?: string;
  };

  if (!data?.name || !data?.email || !data?.message) {
    throw new HttpsError(
      "invalid-argument",
      "name, email, and message are required",
    );
  }

  throw new HttpsError(
    "unimplemented",
    "Use POST /api/contact on the Next.js app. This callable is a stub only.",
  );
});
