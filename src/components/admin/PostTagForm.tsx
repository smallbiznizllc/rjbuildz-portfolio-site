"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createPostTagAction,
  updatePostTagAction,
} from "@/app/admin/actions/post-tags";
import { slugify } from "@/lib/utils/slug";
import type { PostTag, PostTagKind } from "@/types";

interface PostTagFormProps {
  kind: PostTagKind;
  tag?: PostTag | null;
  initialName?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PostTagForm({
  kind,
  tag,
  initialName,
  onSuccess,
  onCancel,
}: PostTagFormProps) {
  const [name, setName] = useState(tag?.name ?? initialName ?? "");
  const [slug, setSlug] = useState(tag?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(tag));
  const [description, setDescription] = useState(tag?.description ?? "");
  const [sortOrder, setSortOrder] = useState(tag?.sortOrder ?? 0);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!slugTouched) {
      setSlug(slugify(name));
    }
  }, [name, slugTouched]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const payload = {
        kind,
        name,
        slug: slug || slugify(name),
        description: description || null,
        sortOrder,
      };

      const result = tag
        ? await updatePostTagAction({ id: tag.id, ...payload })
        : await createPostTagAction(payload);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(tag ? "Tag updated" : "Tag created");
      onSuccess?.();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-800">
          Name
        </label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-[#b87333] focus:ring-1 focus:ring-[#b87333]"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-800">
          Slug
        </label>
        <input
          required
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
          className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-[#b87333] focus:ring-1 focus:ring-[#b87333]"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-800">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-[#b87333] focus:ring-1 focus:ring-[#b87333]"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-800">
          Sort order
        </label>
        <input
          type="number"
          min={0}
          value={sortOrder}
          onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
          className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-[#b87333] focus:ring-1 focus:ring-[#b87333]"
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-zinc-200 px-3.5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Cancel
          </button>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {pending ? "Saving…" : tag ? "Update" : "Create"}
        </button>
      </div>
    </form>
  );
}
