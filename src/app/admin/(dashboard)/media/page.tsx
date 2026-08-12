import { AdminShell } from "@/components/admin/AdminShell";
import { MediaClient } from "@/components/admin/MediaClient";
import { getAllPostsForMedia } from "@/lib/firestore/posts";
import type { MediaItem } from "@/app/admin/actions/media";

export default async function MediaPage() {
  const posts = await getAllPostsForMedia();
  const items: MediaItem[] = [];

  for (const post of posts) {
    if (post.mainImage?.path) {
      items.push({
        path: post.mainImage.path,
        url: post.mainImage.url,
        alt: post.mainImage.alt,
        kind: "main",
        postId: post.id,
        postTitle: post.title || "Untitled",
      });
    }
    for (const image of post.gallery) {
      if (!image.path) continue;
      items.push({
        path: image.path,
        url: image.url,
        alt: image.alt,
        kind: "gallery",
        postId: post.id,
        postTitle: post.title || "Untitled",
        galleryImageId: image.id,
      });
    }
  }

  return (
    <AdminShell title="Media">
      <div className="mx-auto max-w-6xl">
        <p className="mb-4 text-sm text-zinc-500">
          Images attached to posts as main or gallery media.
        </p>
        <MediaClient items={items} />
      </div>
    </AdminShell>
  );
}
