import { AdminShell } from "@/components/admin/AdminShell";
import { MediaClient } from "@/components/admin/MediaClient";
import { getAllPostsForMedia } from "@/lib/firestore/posts";
import { collectMediaItems } from "@/lib/media/collect";

export default async function MediaPage() {
  const posts = await getAllPostsForMedia();
  const items = collectMediaItems(posts);

  return (
    <AdminShell title="Media">
      <div className="mx-auto max-w-6xl">
        <p className="mb-4 text-sm text-zinc-500">
          Main and gallery images attached to posts. Main images can be reused
          when editing a post via “Choose from library”.
        </p>
        <MediaClient items={items} />
      </div>
    </AdminShell>
  );
}
