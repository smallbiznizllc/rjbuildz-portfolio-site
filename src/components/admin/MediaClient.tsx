"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  deleteMediaAction,
  type MediaItem,
} from "@/app/admin/actions/media";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { cn } from "@/lib/utils/cn";

interface MediaClientProps {
  items: MediaItem[];
}

type KindFilter = "all" | "main" | "gallery";

export function MediaClient({ items }: MediaClientProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [kind, setKind] = useState<KindFilter>("all");

  const filtered = useMemo(() => {
    if (kind === "all") return items;
    return items.filter((item) => item.kind === kind);
  }, [items, kind]);

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
      if (result.data.keptSharedFile) {
        toast.success(
          "Removed from this post. File kept because another post still uses it.",
        );
      } else if (result.data.storageError) {
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
      <div className="mb-4 flex gap-1">
        {(
          [
            ["all", "All"],
            ["main", "Main"],
            ["gallery", "Gallery"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setKind(value)}
            className={cn(
              "rounded-md px-2.5 py-1.5 text-xs font-medium",
              kind === value
                ? "bg-zinc-900 text-white"
                : "bg-white text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-50",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 bg-white px-4 py-12 text-center text-sm text-zinc-500">
          {items.length === 0
            ? "No media found on posts yet."
            : `No ${kind} images found.`}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item) => (
            <div
              key={`${item.postId}-${item.kind}-${item.path}-${item.galleryImageId ?? "main"}`}
              className="overflow-hidden rounded-lg border border-zinc-200 bg-white"
            >
              <div className="relative aspect-[4/3] bg-zinc-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={item.alt || item.postTitle}
                  className="h-full w-full object-cover"
                />
                <span
                  className={cn(
                    "absolute top-2 left-2 rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
                    item.kind === "main"
                      ? "bg-zinc-900 text-white"
                      : "bg-white/90 text-zinc-700",
                  )}
                >
                  {item.kind}
                </span>
              </div>
              <div className="space-y-2 p-3">
                <p className="truncate text-sm font-medium text-zinc-900">
                  {item.postTitle}
                </p>
                <p className="truncate text-xs text-zinc-500">
                  {item.alt || "No alt text"}
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
            ? `This image is used as the ${selected.kind} image on “${selected.postTitle}”. It will be removed from the post. The file is kept in storage if another post still reuses it.`
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
