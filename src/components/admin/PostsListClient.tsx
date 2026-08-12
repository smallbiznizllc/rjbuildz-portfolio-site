"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deletePostAction } from "@/app/admin/actions/posts";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { formatPublishedDateShort } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";

export interface AdminPostListItem {
  id: string;
  title: string;
  status: string;
  categoryIds: string[];
  categoryNames: string[];
  thumbnailUrl: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PostsListClientProps {
  posts: AdminPostListItem[];
  categories: Array<{ id: string; name: string }>;
}

export function PostsListClient({ posts, categories }: PostsListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "all";
  const categoryId = searchParams.get("category") ?? "all";

  const [searchInput, setSearchInput] = useState(search);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return posts.filter((post) => {
      if (status !== "all" && post.status !== status) return false;
      if (categoryId !== "all" && !post.categoryIds.includes(categoryId))
        return false;
      if (q && !post.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [posts, search, status, categoryId]);

  function updateParams(patch: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (!value || value === "all") params.delete(key);
      else params.set(key, value);
    }
    const qs = params.toString();
    router.push(qs ? `/admin/posts?${qs}` : "/admin/posts");
  }

  function handleDelete() {
    if (!deleteId) return;
    startTransition(async () => {
      const result = await deletePostAction(deleteId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (result.data.storageErrors.length) {
        toast.warning(
          `Post deleted, but some files failed: ${result.data.storageErrors[0]}`,
        );
      } else {
        toast.success("Post deleted");
      }
      setDeleteId(null);
      router.refresh();
    });
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid flex-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">
              Search
            </label>
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  updateParams({ search: searchInput });
                }
              }}
              onBlur={() => updateParams({ search: searchInput })}
              placeholder="Search titles…"
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#b87333] focus:ring-1 focus:ring-[#b87333]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => updateParams({ status: e.target.value })}
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#b87333] focus:ring-1 focus:ring-[#b87333]"
            >
              <option value="all">All</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => updateParams({ category: e.target.value })}
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#b87333] focus:ring-1 focus:ring-[#b87333]"
            >
              <option value="all">All</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <Link
          href="/admin/posts/new"
          className="inline-flex items-center justify-center gap-1.5 rounded-md bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          <Plus className="h-4 w-4" />
          New post
        </Link>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-lg border border-zinc-200 bg-white md:block">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-medium">Post</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Published</th>
              <th className="px-4 py-3 font-medium">Updated</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((post) => (
              <tr key={post.id} className="border-b border-zinc-100 last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-16 shrink-0 overflow-hidden rounded bg-zinc-100">
                      {post.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={post.thumbnailUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div>
                      <p className="font-medium text-zinc-900">{post.title}</p>
                      <p className="text-xs text-zinc-500">
                        Created {formatPublishedDateShort(post.createdAt)}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {post.categoryNames.length
                    ? post.categoryNames.join(", ")
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={post.status} />
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {post.publishedAt
                    ? formatPublishedDateShort(post.publishedAt)
                    : "—"}
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {formatPublishedDateShort(post.updatedAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Link
                      href={`/admin/posts/${post.id}/edit`}
                      className="rounded p-2 text-zinc-600 hover:bg-zinc-100"
                      aria-label="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => setDeleteId(post.id)}
                      className="rounded p-2 text-red-600 hover:bg-red-50"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-zinc-500"
                >
                  No posts match these filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {filtered.map((post) => (
          <div
            key={post.id}
            className="rounded-lg border border-zinc-200 bg-white p-4"
          >
            <div className="flex gap-3">
              <div className="h-16 w-20 shrink-0 overflow-hidden rounded bg-zinc-100">
                {post.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.thumbnailUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-zinc-900">{post.title}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {post.categoryNames.length
                    ? post.categoryNames.join(", ")
                    : "Uncategorized"}{" "}
                  ·{" "}
                  {formatPublishedDateShort(post.updatedAt)}
                </p>
                <div className="mt-2">
                  <StatusBadge status={post.status} />
                </div>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Link
                href={`/admin/posts/${post.id}/edit`}
                className="flex-1 rounded-md border border-zinc-200 px-3 py-2 text-center text-sm font-medium text-zinc-700"
              >
                Edit
              </Link>
              <button
                type="button"
                onClick={() => setDeleteId(post.id)}
                className="rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-300 bg-white px-4 py-10 text-center text-sm text-zinc-500">
            No posts match these filters.
          </p>
        ) : null}
      </div>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Delete post?"
        description="This permanently deletes the post and its storage files. This cannot be undone."
        confirmLabel="Delete post"
        loading={pending}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize",
        status === "published" && "bg-emerald-50 text-emerald-700",
        status === "draft" && "bg-amber-50 text-amber-700",
        status === "archived" && "bg-zinc-100 text-zinc-600",
      )}
    >
      {status}
    </span>
  );
}
