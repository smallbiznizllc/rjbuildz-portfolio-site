"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  deleteMediaAction,
  type MediaItem,
} from "@/app/admin/actions/media";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

interface MediaClientProps {
  items: MediaItem[];
}

export function MediaClient({ items }: MediaClientProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<MediaItem | null>(null);

  function handleDelete() {
    if (!selected) return;
    startTransition(async () => {
      const result = await deleteMediaAction({
        postId: selected.postId,
        path: selected.path,
        kind: selected.kind,
        galleryImageId: selected.galleryImageId,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (result.data.storageError) {
        toast.warning(
          `Removed from post, but storage delete failed: ${result.data.storageError}`,
        );
      } else {
        toast.success("Media deleted");
      }
      setSelected(null);
      router.refresh();
    });
  }

  return (
    <>
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 bg-white px-4 py-12 text-center text-sm text-zinc-500">
          No media found on posts yet.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <div
              key={`${item.postId}-${item.path}`}
              className="overflow-hidden rounded-lg border border-zinc-200 bg-white"
            >
              <div className="aspect-[4/3] bg-zinc-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={item.alt || item.postTitle}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="space-y-2 p-3">
                <p className="truncate text-sm font-medium text-zinc-900">
                  {item.postTitle}
                </p>
                <p className="text-xs capitalize text-zinc-500">
                  {item.kind} image
                  {item.alt ? ` · ${item.alt}` : ""}
                </p>
                <button
                  type="button"
                  onClick={() => setSelected(item)}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(selected)}
        title="Delete media?"
        description={
          selected
            ? `This image is used as the ${selected.kind} image on “${selected.postTitle}”. It will be removed from the post and deleted from storage.`
            : ""
        }
        confirmLabel="Delete image"
        loading={pending}
        onCancel={() => setSelected(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}
