"use client";

import { useEffect, useId, useMemo, useState, useTransition } from "react";
import { Loader2, Search, X } from "lucide-react";
import { toast } from "sonner";
import { listMediaAction, type MediaItem } from "@/app/admin/actions/media";
import { cn } from "@/lib/utils/cn";

interface MediaPickerModalProps {
  open: boolean;
  excludePath?: string | null;
  onSelect: (item: MediaItem) => void;
  onClose: () => void;
}

type KindFilter = "all" | "main" | "gallery";

export function MediaPickerModal({
  open,
  excludePath,
  onSelect,
  onClose,
}: MediaPickerModalProps) {
  const titleId = useId();
  const [pending, startTransition] = useTransition();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<KindFilter>("all");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    setLoaded(false);
    startTransition(async () => {
      const result = await listMediaAction();
      if (!result.ok) {
        toast.error(result.error);
        setItems([]);
        setLoaded(true);
        return;
      }
      setItems(result.data);
      setLoaded(true);
    });
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (excludePath && item.path === excludePath) return false;
      if (kind !== "all" && item.kind !== kind) return false;
      if (!q) return true;
      return (
        item.postTitle.toLowerCase().includes(q) ||
        item.alt.toLowerCase().includes(q) ||
        item.path.toLowerCase().includes(q)
      );
    });
  }, [items, query, kind, excludePath]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-zinc-900/40"
        aria-label="Dismiss"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex max-h-[min(90vh,720px)] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg"
      >
        <div className="flex items-start justify-between gap-3 border-b border-zinc-200 px-4 py-3 sm:px-5">
          <div>
            <h2
              id={titleId}
              className="font-[family-name:var(--font-dm-sans)] text-lg font-semibold text-zinc-900"
            >
              Choose from media library
            </h2>
            <p className="mt-0.5 text-sm text-zinc-500">
              Reuse a main or gallery image already attached to a post.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3 border-b border-zinc-100 px-4 py-3 sm:flex-row sm:items-center sm:px-5">
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by post, alt, or path"
              className="w-full rounded-md border border-zinc-200 bg-white py-2 pr-3 pl-9 text-sm outline-none focus:border-[#b87333] focus:ring-1 focus:ring-[#b87333]"
            />
          </label>
          <div className="flex gap-1">
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
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          {!loaded || pending ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-12 text-center text-sm text-zinc-500">
              No media matches. Upload a main or gallery image on a post first.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((item) => (
                <button
                  key={`${item.postId}-${item.path}-${item.kind}`}
                  type="button"
                  onClick={() => onSelect(item)}
                  className="group overflow-hidden rounded-lg border border-zinc-200 bg-white text-left transition hover:border-[#b87333] hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b87333]"
                >
                  <div className="aspect-[4/3] bg-zinc-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.url}
                      alt={item.alt || item.postTitle}
                      className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                    />
                  </div>
                  <div className="space-y-1 p-2.5">
                    <p className="truncate text-sm font-medium text-zinc-900">
                      {item.postTitle}
                    </p>
                    <p className="text-xs capitalize text-zinc-500">
                      {item.kind}
                      {item.alt ? ` · ${item.alt}` : ""}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
