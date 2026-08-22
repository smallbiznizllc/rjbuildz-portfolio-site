"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deletePostTagAction } from "@/app/admin/actions/post-tags";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { PostTagForm } from "@/components/admin/PostTagForm";
import { formatPublishedDateShort } from "@/lib/utils/dates";
import type { PostTagKind } from "@/types";

export interface PostTagListItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  postCount: number;
}

interface PostTagSearchPanelProps {
  kind: PostTagKind;
  title: string;
  tags: PostTagListItem[];
}

const RESULT_LIMIT = 12;

function matchesQuery(tag: PostTagListItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  return (
    tag.name.toLowerCase().includes(q) || tag.slug.toLowerCase().includes(q)
  );
}

export function PostTagSearchPanel({
  kind,
  title,
  tags,
}: PostTagSearchPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"search" | "create" | "edit">("search");
  const [editing, setEditing] = useState<PostTagListItem | null>(null);
  const [createName, setCreateName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<PostTagListItem | null>(
    null,
  );

  const trimmedQuery = query.trim();
  const results = useMemo(() => {
    if (!trimmedQuery) return [];
    return tags.filter((tag) => matchesQuery(tag, trimmedQuery)).slice(0, RESULT_LIMIT);
  }, [tags, trimmedQuery]);

  const hasMore =
    trimmedQuery.length > 0 &&
    tags.filter((tag) => matchesQuery(tag, trimmedQuery)).length > RESULT_LIMIT;

  function resetToSearch() {
    setMode("search");
    setEditing(null);
    setCreateName("");
  }

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deletePostTagAction(kind, deleteTarget.id);
      if (!result.ok) {
        toast.error(result.error);
        setDeleteTarget(null);
        return;
      }
      toast.success("Tag deleted");
      setDeleteTarget(null);
      resetToSearch();
      router.refresh();
    });
  }

  function startCreate(name?: string) {
    setEditing(null);
    setCreateName(name ?? trimmedQuery);
    setMode("create");
  }

  function startEdit(tag: PostTagListItem) {
    setEditing(tag);
    setCreateName("");
    setMode("edit");
  }

  return (
    <section className="flex min-h-[28rem] flex-col rounded-lg border border-zinc-200 bg-white p-5">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Search {tags.length} tag{tags.length === 1 ? "" : "s"} by name or slug.
        </p>
      </div>

      {mode === "search" ? (
        <>
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${title.toLowerCase()} tags…`}
              className="w-full rounded-md border border-zinc-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#b87333] focus:ring-1 focus:ring-[#b87333]"
              autoComplete="off"
            />
          </label>

          <div className="mt-4 flex-1">
            {!trimmedQuery ? (
              <p className="rounded-md border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-500">
                Type to find a tag to edit, or to add a new one if nothing matches.
              </p>
            ) : results.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  {results.length} match{results.length === 1 ? "" : "es"}
                  {hasMore ? " (showing first 12)" : ""}
                </p>
                <ul className="divide-y divide-zinc-100 overflow-hidden rounded-md border border-zinc-200">
                  {results.map((tag) => (
                    <li
                      key={tag.id}
                      className="flex items-start justify-between gap-3 px-3 py-3"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-zinc-900">{tag.name}</p>
                        <p className="mt-0.5 text-sm text-zinc-500">
                          /{tag.slug} · {tag.postCount} post
                          {tag.postCount === 1 ? "" : "s"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => startEdit(tag)}
                        className="inline-flex shrink-0 items-center gap-1 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-6 text-center">
                <p className="text-sm text-zinc-600">
                  No tags match &ldquo;{trimmedQuery}&rdquo;.
                </p>
                <button
                  type="button"
                  onClick={() => startCreate(trimmedQuery)}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                >
                  <Plus className="h-4 w-4" />
                  Add &ldquo;{trimmedQuery}&rdquo;
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex-1">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-zinc-900">
              {mode === "create" ? "New tag" : "Edit tag"}
            </h3>
            <button
              type="button"
              onClick={resetToSearch}
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
            >
              Back to search
            </button>
          </div>

          <PostTagForm
            kind={kind}
            tag={
              editing
                ? {
                    id: editing.id,
                    name: editing.name,
                    slug: editing.slug,
                    description: editing.description,
                    sortOrder: editing.sortOrder,
                    createdAt: new Date(editing.createdAt),
                    updatedAt: new Date(editing.updatedAt),
                  }
                : null
            }
            initialName={mode === "create" ? createName : undefined}
            onCancel={resetToSearch}
            onSuccess={() => {
              resetToSearch();
              setQuery("");
              router.refresh();
            }}
          />

          {mode === "edit" && editing ? (
            <div className="mt-6 border-t border-zinc-200 pt-4">
              <p className="mb-2 text-xs text-zinc-500">
                Updated {formatPublishedDateShort(editing.updatedAt)} ·{" "}
                {editing.postCount} post{editing.postCount === 1 ? "" : "s"}
              </p>
              <button
                type="button"
                onClick={() => setDeleteTarget(editing)}
                className="inline-flex items-center gap-1.5 rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete tag
              </button>
            </div>
          ) : null}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete tag?"
        description={
          deleteTarget?.postCount
            ? "This tag is still assigned to posts. Deletion will be blocked if any remain."
            : "This permanently deletes the tag."
        }
        confirmLabel="Delete"
        loading={pending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </section>
  );
}
