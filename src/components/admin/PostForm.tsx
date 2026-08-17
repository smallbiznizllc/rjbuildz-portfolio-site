"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createCategoryAction } from "@/app/admin/actions/categories";
import {
  allocatePostIdAction,
  createPostAction,
  updatePostAction,
} from "@/app/admin/actions/posts";
import { GalleryManager } from "@/components/admin/GalleryManager";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import type { PostFormPost } from "@/lib/admin/post-form";
import { slugify } from "@/lib/utils/slug";
import type { Category, GalleryImage, PostImage, PostStatus } from "@/types";

export type { PostFormPost };

interface PostFormProps {
  mode: "create" | "edit";
  post?: PostFormPost | null;
  categories: Array<Pick<Category, "id" | "name">>;
}

function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromDatetimeLocalValue(value: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function PostForm({ mode, post, categories }: PostFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [addingCategory, startAddCategory] = useTransition();
  const [postId, setPostId] = useState(post?.id ?? "");
  const [allocating, setAllocating] = useState(mode === "create");
  const [localCategories, setLocalCategories] = useState(categories);
  const [newCategoryName, setNewCategoryName] = useState("");

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [features, setFeatures] = useState(post?.features ?? "");
  const [builtUsing, setBuiltUsing] = useState(post?.builtUsing ?? "");
  const [seeItLive, setSeeItLive] = useState(post?.seeItLive ?? "");
  const [inProgress, setInProgress] = useState(post?.inProgress ?? false);
  const [favorite, setFavorite] = useState(post?.favorite ?? false);
  const [status, setStatus] = useState<PostStatus>(post?.status ?? "draft");
  const [categoryIds, setCategoryIds] = useState<string[]>(
    post?.categoryIds ?? [],
  );
  const [publishedAt, setPublishedAt] = useState(
    toDatetimeLocalValue(post?.publishedAt),
  );
  const [sortOrder, setSortOrder] = useState(post?.sortOrder ?? 0);
  const [mainImage, setMainImage] = useState<PostImage | null>(
    post?.mainImage ?? null,
  );
  const [gallery, setGallery] = useState<GalleryImage[]>(post?.gallery ?? []);
  const [metaTitle, setMetaTitle] = useState(post?.seo.title ?? "");
  const [metaDescription, setMetaDescription] = useState(
    post?.seo.description ?? "",
  );

  useEffect(() => {
    if (mode !== "create" || postId) {
      setAllocating(false);
      return;
    }

    let cancelled = false;
    (async () => {
      const result = await allocatePostIdAction();
      if (cancelled) return;
      if (!result.ok) {
        toast.error(result.error);
        setAllocating(false);
        return;
      }
      setPostId(result.data);
      setAllocating(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [mode, postId]);

  useEffect(() => {
    if (!slugTouched) {
      setSlug(slugify(title));
    }
  }, [title, slugTouched]);

  const canSave = useMemo(
    () => Boolean(postId && title.trim() && slug.trim() && !allocating),
    [postId, title, slug, allocating],
  );

  function buildPayload() {
    return {
      title: title.trim(),
      slug: slug.trim() || slugify(title),
      excerpt: excerpt.trim(),
      content,
      features,
      builtUsing,
      seeItLive: seeItLive.trim() || null,
      inProgress,
      favorite,
      status,
      categoryIds,
      mainImage,
      gallery,
      seo: {
        title: metaTitle.trim() || null,
        description: metaDescription.trim() || null,
        ogImage: mainImage?.url ?? null,
        keywords: [],
      },
      sortOrder,
      publishedAt: fromDatetimeLocalValue(publishedAt),
    };
  }

  function handleSave(nextStatus?: PostStatus) {
    if (!canSave) return;
    const effectiveStatus = nextStatus ?? status;

    startTransition(async () => {
      const payload = {
        ...buildPayload(),
        status: effectiveStatus,
        publishedAt:
          fromDatetimeLocalValue(publishedAt) ??
          (effectiveStatus === "published" ? new Date() : null),
      };

      if (effectiveStatus === "published" && !publishedAt) {
        setPublishedAt(toDatetimeLocalValue(new Date().toISOString()));
      }

      const result =
        mode === "create"
          ? await createPostAction(payload, { id: postId })
          : await updatePostAction({ id: postId, ...payload });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(
        mode === "create"
          ? "Post created"
          : effectiveStatus === "published"
            ? "Post published"
            : "Post saved",
      );

      if (mode === "create") {
        router.replace(`/admin/posts/${result.data.id}/edit`);
        router.refresh();
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="pb-28">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <section className="space-y-4 rounded-lg border border-zinc-200 bg-white p-4 sm:p-5">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={inProgress}
                onChange={(e) => setInProgress(e.target.checked)}
                disabled={pending}
                className="size-4 rounded border-zinc-300 text-[#b87333] accent-[#b87333] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b87333]"
              />
              <span>
                <span className="block text-sm font-medium text-zinc-800">
                  In Progress
                </span>
                <span className="block text-xs text-zinc-500">
                  Shows an In Progress chip on the home page card.
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={favorite}
                onChange={(e) => setFavorite(e.target.checked)}
                disabled={pending}
                className="size-4 rounded border-zinc-300 text-[#b87333] accent-[#b87333] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b87333]"
              />
              <span>
                <span className="block text-sm font-medium text-zinc-800">
                  Favorite
                </span>
                <span className="block text-xs text-zinc-500">
                  Shows a star on the home page card.
                </span>
              </span>
            </label>
          </section>

          <section className="space-y-4 rounded-lg border border-zinc-200 bg-white p-4 sm:p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Content
            </h2>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-800">
                Title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-[#b87333] focus:ring-1 focus:ring-[#b87333]"
                placeholder="Project title"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-800">
                Slug
              </label>
              <input
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                className="w-full rounded-md border border-zinc-200 px-3 py-2 font-mono text-sm outline-none focus:border-[#b87333] focus:ring-1 focus:ring-[#b87333]"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-800">
                Excerpt
              </label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-[#b87333] focus:ring-1 focus:ring-[#b87333]"
                placeholder="Short summary for cards and SEO"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-800">
                Body
              </label>
              <RichTextEditor value={content} onChange={setContent} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-800">
                Features
              </label>
              <p className="mb-2 text-xs text-zinc-500">
                Shown under a Features heading on the project page when not
                empty.
              </p>
              <RichTextEditor value={features} onChange={setFeatures} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-800">
                Created with
              </label>
              <p className="mb-2 text-xs text-zinc-500">
                Shown under a Created with heading on the project page when not
                empty.
              </p>
              <RichTextEditor value={builtUsing} onChange={setBuiltUsing} />
            </div>
            <div>
              <label
                htmlFor="see-it-live"
                className="mb-1 block text-sm font-medium text-zinc-800"
              >
                See it live
              </label>
              <p className="mb-2 text-xs text-zinc-500">
                Optional URL. Shown as a button below the gallery controls that
                opens in a new tab.
              </p>
              <input
                id="see-it-live"
                type="url"
                value={seeItLive}
                onChange={(e) => setSeeItLive(e.target.value)}
                className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-[#b87333] focus:ring-1 focus:ring-[#b87333]"
                placeholder="https://example.com"
              />
            </div>
          </section>

          <section className="space-y-4 rounded-lg border border-zinc-200 bg-white p-4 sm:p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Media
            </h2>
            {allocating ? (
              <p className="text-sm text-zinc-500">Preparing upload target…</p>
            ) : (
              <>
                <ImageUploader
                  postId={postId}
                  value={mainImage}
                  onChange={setMainImage}
                  disabled={pending}
                />
                <GalleryManager
                  postId={postId}
                  value={gallery}
                  onChange={setGallery}
                  disabled={pending}
                />
              </>
            )}
          </section>

          <section className="space-y-4 rounded-lg border border-zinc-200 bg-white p-4 sm:p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              SEO
            </h2>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-800">
                Meta title
              </label>
              <input
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                maxLength={70}
                className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-[#b87333] focus:ring-1 focus:ring-[#b87333]"
                placeholder="Defaults to post title"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-800">
                Meta description
              </label>
              <textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                maxLength={160}
                rows={3}
                className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-[#b87333] focus:ring-1 focus:ring-[#b87333]"
                placeholder="Defaults to excerpt"
              />
            </div>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <section className="space-y-4 rounded-lg border border-zinc-200 bg-white p-4 sm:p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Publishing
            </h2>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-800">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PostStatus)}
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#b87333] focus:ring-1 focus:ring-[#b87333]"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-800">
                Categories
              </label>
              {localCategories.length === 0 ? (
                <p className="text-sm text-zinc-500">
                  No categories yet. Add one below.
                </p>
              ) : (
                <ul className="max-h-48 space-y-2 overflow-y-auto rounded-md border border-zinc-200 bg-white p-3">
                  {localCategories.map((category) => {
                    const checked = categoryIds.includes(category.id);
                    return (
                      <li key={category.id}>
                        <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-800">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setCategoryIds((prev) =>
                                checked
                                  ? prev.filter((id) => id !== category.id)
                                  : [...prev, category.id],
                              );
                            }}
                            className="size-4 rounded border-zinc-300 text-[#b87333] focus:ring-[#b87333]"
                          />
                          {category.name}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
              <form
                className="mt-2 flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  const name = newCategoryName.trim();
                  const slug = slugify(name);
                  if (!name || !slug) {
                    toast.error("Enter a category name");
                    return;
                  }
                  startAddCategory(async () => {
                    const result = await createCategoryAction({
                      name,
                      slug,
                      description: null,
                      sortOrder: localCategories.length,
                    });
                    if (!result.ok) {
                      toast.error(result.error);
                      return;
                    }
                    setLocalCategories((prev) => [
                      ...prev,
                      { id: result.data.id, name: result.data.name },
                    ]);
                    setCategoryIds((prev) =>
                      prev.includes(result.data.id)
                        ? prev
                        : [...prev, result.data.id],
                    );
                    setNewCategoryName("");
                    toast.success("Category created");
                  });
                }}
              >
                <input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="New category"
                  maxLength={80}
                  disabled={addingCategory}
                  className="min-w-0 flex-1 rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-[#b87333] focus:ring-1 focus:ring-[#b87333] disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={addingCategory || !newCategoryName.trim()}
                  className="shrink-0 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                >
                  {addingCategory ? "Adding…" : "Add"}
                </button>
              </form>
              <p className="mt-1 text-xs text-zinc-500">
                Select one or more categories, or add a new one.
              </p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-800">
                Published at
              </label>
              <input
                type="datetime-local"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-[#b87333] focus:ring-1 focus:ring-[#b87333]"
              />
              <p className="mt-1 text-xs text-zinc-500">
                Controls public ordering. Editable anytime.
              </p>
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
              <p className="mt-1 text-xs text-zinc-500">
                Tie-break when publishedAt matches (lower first).
              </p>
            </div>
          </section>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <p className="text-sm text-zinc-500">
            {status === "published"
              ? "This post will appear on the public site."
              : "Drafts stay private until published."}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!canSave || pending}
              onClick={() => {
                setStatus("draft");
                handleSave("draft");
              }}
              className="rounded-md border border-zinc-200 bg-white px-3.5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
            >
              Save draft
            </button>
            <button
              type="button"
              disabled={!canSave || pending}
              onClick={() => {
                setStatus("published");
                handleSave("published");
              }}
              className="rounded-md bg-[#b87333] px-3.5 py-2 text-sm font-medium text-white hover:bg-[#a5662d] disabled:opacity-50"
            >
              {pending ? "Saving…" : "Publish"}
            </button>
            <button
              type="button"
              disabled={!canSave || pending}
              onClick={() => handleSave()}
              className="rounded-md bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
