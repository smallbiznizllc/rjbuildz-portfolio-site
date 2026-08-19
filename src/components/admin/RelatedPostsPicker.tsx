"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import type { PostStatus } from "@/types";

export type RelatedPostOption = {
  id: string;
  title: string;
  slug: string;
  status: PostStatus;
};

const MAX_RELATED = 8;

export function RelatedPostsPicker({
  currentPostId,
  options,
  value,
  onChange,
  compact = false,
}: {
  currentPostId: string;
  options: RelatedPostOption[];
  value: string[];
  onChange: (ids: string[]) => void;
  compact?: boolean;
}) {
  const [query, setQuery] = useState("");

  const byId = useMemo(
    () => new Map(options.map((option) => [option.id, option])),
    [options],
  );

  const selected = value
    .map((id) => byId.get(id))
    .filter((option): option is RelatedPostOption => Boolean(option));

  const available = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const selectedSet = new Set(value);
    return options.filter((option) => {
      if (option.id === currentPostId) return false;
      if (selectedSet.has(option.id)) return false;
      if (!needle) return true;
      return (
        option.title.toLowerCase().includes(needle) ||
        option.slug.toLowerCase().includes(needle)
      );
    });
  }, [options, currentPostId, value, query]);

  function add(id: string) {
    if (id === currentPostId || value.includes(id) || value.length >= MAX_RELATED) {
      return;
    }
    onChange([...value, id]);
    setQuery("");
  }

  function move(index: number, delta: number) {
    const nextIndex = index + delta;
    if (nextIndex < 0 || nextIndex >= value.length) return;
    const next = [...value];
    const [item] = next.splice(index, 1);
    if (!item) return;
    next.splice(nextIndex, 0, item);
    onChange(next);
  }

  return (
    <div>
      {!compact ? (
        <>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Related posts
          </h2>
          <p className="mt-1 mb-3 text-xs text-zinc-500">
            Shown above previous/next on the project page. Up to {MAX_RELATED}.
            Order here is the order on the site.
          </p>
        </>
      ) : (
        <p className="mb-3 text-xs text-zinc-500">
          Up to {MAX_RELATED}. Order here is the order on the site.
        </p>
      )}
      {selected.length > 0 ? (
        <ul className="mb-3 space-y-2">
          {selected.map((option, index) => (
            <li
              key={option.id}
              className="flex items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1.5"
            >
              <div className="flex shrink-0 flex-col">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className="rounded p-0.5 text-zinc-500 hover:bg-zinc-200 disabled:opacity-30"
                  aria-label={`Move ${option.title} up`}
                >
                  <ChevronUp className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === selected.length - 1}
                  className="rounded p-0.5 text-zinc-500 hover:bg-zinc-200 disabled:opacity-30"
                  aria-label={`Move ${option.title} down`}
                >
                  <ChevronDown className="size-3.5" />
                </button>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-800">
                  {option.title}
                </p>
                <p className="truncate font-mono text-[11px] text-zinc-500">
                  {option.slug}
                  {option.status !== "published" ? ` · ${option.status}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onChange(value.filter((id) => id !== option.id))}
                className="inline-flex size-7 items-center justify-center rounded text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800"
                aria-label={`Remove ${option.title}`}
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-3 text-sm text-zinc-500">No related posts selected.</p>
      )}

      {value.length >= MAX_RELATED ? (
        <p className="text-xs text-zinc-500">Maximum of {MAX_RELATED} related posts.</p>
      ) : (
        <>
          <label className="mb-1 block text-sm font-medium text-zinc-800">
            Add a related post
          </label>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by title"
            className="mb-2 w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-[#b87333] focus:ring-1 focus:ring-[#b87333]"
          />
          <ul className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-zinc-200 bg-white p-1">
            {available.length === 0 ? (
              <li className="px-2 py-2 text-sm text-zinc-500">
                {options.filter((option) => option.id !== currentPostId).length === 0
                  ? "No other posts yet."
                  : "No matching posts."}
              </li>
            ) : (
              available.map((option) => (
                <li key={option.id}>
                  <button
                    type="button"
                    onClick={() => add(option.id)}
                    className="flex w-full items-start justify-between gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-zinc-100"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-zinc-800">
                        {option.title}
                      </span>
                      <span className="block truncate font-mono text-[11px] text-zinc-500">
                        {option.slug}
                      </span>
                    </span>
                    {option.status !== "published" ? (
                      <span className="shrink-0 text-[11px] uppercase tracking-wide text-zinc-400">
                        {option.status}
                      </span>
                    ) : null}
                  </button>
                </li>
              ))
            )}
          </ul>
        </>
      )}
    </div>
  );
}
