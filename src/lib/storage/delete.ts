import { adminStorage } from "@/lib/firebase/admin";

function getBucket() {
  return adminStorage.bucket();
}

/**
 * Delete a single object by Storage path. Ignores not-found errors.
 */
export async function deleteStorageFile(path: string): Promise<{
  deleted: boolean;
  error?: string;
}> {
  if (!path) return { deleted: false, error: "Empty path" };

  try {
    const file = getBucket().file(path);
    const [exists] = await file.exists();
    if (!exists) return { deleted: false };
    await file.delete({ ignoreNotFound: true });
    return { deleted: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed";
    return { deleted: false, error: message };
  }
}

/**
 * Delete all objects under posts/{postId}/.
 * Continues on partial failures and returns a summary.
 */
export async function deletePostStorageFolder(postId: string): Promise<{
  deleted: number;
  errors: string[];
}> {
  const prefix = `posts/${postId}/`;
  const errors: string[] = [];
  let deleted = 0;

  try {
    const [files] = await getBucket().getFiles({ prefix });
    await Promise.all(
      files.map(async (file) => {
        try {
          await file.delete({ ignoreNotFound: true });
          deleted += 1;
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Delete failed";
          errors.push(`${file.name}: ${message}`);
        }
      }),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "List failed";
    errors.push(message);
  }

  return { deleted, errors };
}
