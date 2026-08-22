"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus, Search, X } from "lucide-react";
import { toast } from "sonner";
import { createPostTagAction } from "@/app/admin/actions/post-tags";
import {
  categoryNameTaken,
  sortTagsAlphabetically,
} from "@/lib/admin/post-tags";
import { slugify } from "@/lib/utils/slug";
import type { Category, PostTag, PostTagKind } from "@/types";

type TagOption = Pick<PostTag, "id" | "name" | "slug">;
type CategoryOption = Pick<Category, "id" | "name" | "slug">;

const SEARCH_RESULT_LIMIT = 8;

interface PostTagPickerProps {
  kind: PostTagKind;
  label: string;
  hint: string;
  selectedIds: string[];
  onSelectedIdsChange: (ids: string[]) => void;
  options: TagOption[];
  onOptionsChange: (options: TagOption[]) => void;
  categories: CategoryOption[];
}

export function PostTagPicker({
  kind,
  label,
  hint,
  selectedIds,
  onSelectedIdsChange,
  options,
  onOptionsChange,
  categories,
}: PostTagPickerProps) {
  const [query, setQuery] = useState("");
  const [creating, startCreate] = useTransition();

  const selectedTags = useMemo(() => {
    const byId = new Map(options.map((tag) => [tag.id, tag]));
    return selectedIds
      .map((id) => byId.get(id))
      .filter((tag): tag is TagOption => Boolean(tag));
  }, [options, selectedIds]);

  const trimmedQuery = query.trim();
  const searchResults = useMemo(() => {
    if (!trimmedQuery) return [];
    const q = trimmedQuery.toLowerCase();
    const selected = new Set(selectedIds);
    return options
      .filter(
        (tag) =>
          !selected.has(tag.id) &&
          (tag.name.toLowerCase().includes(q) ||
            tag.slug.toLowerCase().includes(q)),
      )
      .slice(0, SEARCH_RESULT_LIMIT);
  }, [options, selectedIds, trimmedQuery]);

  const exactMatch = useMemo(() => {
    if (!trimmedQuery) return null;
    const q = trimmedQuery.toLowerCase();
    return options.find((tag) => tag.name.toLowerCase() === q) ?? null;
  }, [options, trimmedQuery]);

  function selectTag(tag: TagOption) {
    if (selectedIds.includes(tag.id)) return;
    onSelectedIdsChange([...selectedIds, tag.id]);
    setQuery("");
  }

  function removeTag(tagId: string) {
    onSelectedIdsChange(selectedIds.filter((id) => id !== tagId));
  }

  function createAndSelect() {
    const name = trimmedQuery;
    const slug = slugify(name);
    if (!name || !slug) {
      toast.error("Enter a tag name");
      return;
    }
    if (categoryNameTaken(name, categories)) {
      toast.error("That name is already a category. Use Categories instead.");
      return;
    }
    if (exactMatch) {
      selectTag(exactMatch);
      return;
    }

    startCreate(async () => {
      const result = await createPostTagAction({
        kind,
        name,
        slug,
        description: null,
        sortOrder: options.length,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      const nextTag: TagOption = {
        id: result.data.id,
        name: result.data.name,
        slug: result.data.slug,
      };
      onOptionsChange(sortTagsAlphabetically([...options, nextTag]));
      onSelectedIdsChange(
        selectedIds.includes(nextTag.id)
          ? selectedIds
          : [...selectedIds, nextTag.id],
      );
      setQuery("");
      toast.success(kind === "feature" ? "Feature tag created" : "Created-with tag created");
    });
  }

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-zinc-800">
        {label}
      </label>
      <p className="mb-2 text-xs text-zinc-500">{hint}</p>

      {selectedTags.length > 0 ? (
        <ul className="mb-3 flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <li key={tag.id}>
              <button
                type="button"
                onClick={() => removeTag(tag.id)}
                className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-sm text-zinc-800 hover:border-zinc-300 hover:bg-zinc-100"
              >
                {tag.name}
                <X className="h-3.5 w-3.5 text-zinc-500" aria-hidden />
                <span className="sr-only">Remove {tag.name}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-3 text-sm text-zinc-500">No tags selected yet.</p>
      )}

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${label.toLowerCase()} tags…`}
          maxLength={80}
          disabled={creating}
          className="w-full rounded-md border border-zinc-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#b87333] focus:ring-1 focus:ring-[#b87333] disabled:opacity-50"
          autoComplete="off"
        />
      </div>

      {trimmedQuery ? (
        <div className="mt-2 overflow-hidden rounded-md border border-zinc-200 bg-white">
          {searchResults.length > 0 ? (
            <ul className="max-h-40 divide-y divide-zinc-100 overflow-y-auto">
              {searchResults.map((tag) => (
                <li key={tag.id}>
                  <button
                    type="button"
                    onClick={() => selectTag(tag)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-zinc-800 hover:bg-zinc-50"
                  >
                    <span>{tag.name}</span>
                    <span className="text-xs text-zinc-500">Add</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          {!exactMatch ? (
            <button
              type="button"
              onClick={createAndSelect}
              disabled={creating}
              className="flex w-full items-center gap-1.5 border-t border-zinc-100 px-3 py-2.5 text-left text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
            >
              <Plus className="h-4 w-4 shrink-0" />
              {creating ? "Adding…" : `Add “${trimmedQuery}”`}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
