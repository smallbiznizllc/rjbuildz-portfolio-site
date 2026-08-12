"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteCategoryAction } from "@/app/admin/actions/categories";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { formatPublishedDateShort } from "@/lib/utils/dates";

export interface CategoryListItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  postCount: number;
}

interface CategoriesClientProps {
  categories: CategoryListItem[];
}

export function CategoriesClient({ categories }: CategoriesClientProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [editing, setEditing] = useState<CategoryListItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function handleDelete() {
    if (!deleteId) return;
    startTransition(async () => {
      const result = await deleteCategoryAction(deleteId);
      if (!result.ok) {
        toast.error(result.error);
        setDeleteId(null);
        return;
      }
      toast.success("Category deleted");
      setDeleteId(null);
      router.refresh();
    });
  }

  if (mode === "create" || mode === "edit") {
    return (
      <div className="mx-auto max-w-lg rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">
          {mode === "create" ? "New category" : "Edit category"}
        </h2>
        <CategoryForm
          category={
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
          onCancel={() => {
            setMode("list");
            setEditing(null);
          }}
          onSuccess={() => {
            setMode("list");
            setEditing(null);
            router.refresh();
          }}
        />
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setMode("create");
          }}
          className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          <Plus className="h-4 w-4" />
          New category
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <ul className="divide-y divide-zinc-100">
          {categories.map((category) => (
            <li
              key={category.id}
              className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-zinc-900">{category.name}</p>
                <p className="mt-0.5 text-sm text-zinc-500">
                  /{category.slug} · {category.postCount} post
                  {category.postCount === 1 ? "" : "s"} · Updated{" "}
                  {formatPublishedDateShort(category.updatedAt)}
                </p>
                {category.description ? (
                  <p className="mt-1 text-sm text-zinc-600">
                    {category.description}
                  </p>
                ) : null}
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(category);
                    setMode("edit");
                  }}
                  className="rounded p-2 text-zinc-600 hover:bg-zinc-100"
                  aria-label="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteId(category.id)}
                  className="rounded p-2 text-red-600 hover:bg-red-50"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
          {categories.length === 0 ? (
            <li className="px-4 py-10 text-center text-sm text-zinc-500">
              No categories yet.
            </li>
          ) : null}
        </ul>
      </div>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Delete category?"
        description={
          categories.find((c) => c.id === deleteId)?.postCount
            ? "This category still has posts assigned. Deletion will be blocked if any remain."
            : "This permanently deletes the category."
        }
        confirmLabel="Delete"
        loading={pending}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}
