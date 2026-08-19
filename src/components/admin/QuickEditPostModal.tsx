"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { updatePostAction } from "@/app/admin/actions/posts";
import {
  RelatedPostsPicker,
  type RelatedPostOption,
} from "@/components/admin/RelatedPostsPicker";
import { slugify } from "@/lib/utils/slug";

export type QuickEditPost = {
  id: string;
  title: string;
  slug: string;
  categoryIds: string[];
  relatedPostIds: string[];
  seo: {
    title: string | null;
    description: string | null;
    ogImage: string | null;
    keywords: string[];
  };
};

export function QuickEditPostModal({
  post,
  categories,
  relatedOptions,
  onClose,
  onSaved,
}: {
  post: QuickEditPost;
  categories: Array<{ id: string; name: string }>;
  relatedOptions: RelatedPostOption[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const titleId = useId();
  const titleRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState(post.title);
  const [slug, setSlug] = useState(post.slug);
  const [slugTouched, setSlugTouched] = useState(true);
  const [categoryIds, setCategoryIds] = useState(post.categoryIds);
  const [relatedPostIds, setRelatedPostIds] = useState(post.relatedPostIds);
  const [metaTitle, setMetaTitle] = useState(post.seo.title ?? "");
  const [metaDescription, setMetaDescription] = useState(
    post.seo.description ?? "",
  );
  const [keywords, setKeywords] = useState(post.seo.keywords.join(", "));

  useEffect(() => {
    titleRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, pending]);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  function handleSave() {
    const nextTitle = title.trim();
    if (!nextTitle) {
      toast.error("Title is required");
      return;
    }
    const nextSlug = slugify(slug) || slugify(nextTitle);
    if (!nextSlug) {
      toast.error("Enter a valid slug");
      return;
    }

    startTransition(async () => {
      const result = await updatePostAction({
        id: post.id,
        title: nextTitle,
        slug: nextSlug,
        categoryIds,
        relatedPostIds,
        seo: {
          title: metaTitle.trim() || null,
          description: metaDescription.trim() || null,
          ogImage: post.seo.ogImage,
          keywords: keywords
            .split(",")
            .map((item) => item.trim())
            .filter((item) => item.length > 0 && item.length <= 40)
            .slice(0, 20),
        },
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Post updated");
      onSaved();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-zinc-900/40"
        aria-label="Dismiss"
        disabled={pending}
        onClick={() => {
          if (!pending) onClose();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex max-h-[min(90vh,760px)] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg"
      >
        <div className="border-b border-zinc-200 px-5 py-4">
          <h2
            id={titleId}
            className="text-lg font-semibold text-zinc-900"
          >
            Quick edit
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Title, slug, categories, SEO, and related posts.
          </p>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-800">
              Title
            </label>
            <input
              ref={titleRef}
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-[#b87333] focus:ring-1 focus:ring-[#b87333]"
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
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-zinc-800">Categories</p>
            {categories.length === 0 ? (
              <p className="text-sm text-zinc-500">No categories yet.</p>
            ) : (
              <ul className="max-h-40 space-y-2 overflow-y-auto rounded-md border border-zinc-200 bg-zinc-50 p-3">
                {categories.map((category) => {
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
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-zinc-800">SEO</p>
            <label className="mb-1 block text-sm font-medium text-zinc-800">
              Meta title
            </label>
            <input
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              maxLength={70}
              placeholder="Defaults to post title"
              className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-[#b87333] focus:ring-1 focus:ring-[#b87333]"
            />
            <label className="mb-1 mt-3 block text-sm font-medium text-zinc-800">
              Meta description
            </label>
            <textarea
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              maxLength={160}
              rows={3}
              placeholder="Defaults to excerpt"
              className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-[#b87333] focus:ring-1 focus:ring-[#b87333]"
            />
            <label className="mb-1 mt-3 block text-sm font-medium text-zinc-800">
              Keywords
            </label>
            <input
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="Comma-separated"
              className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-[#b87333] focus:ring-1 focus:ring-[#b87333]"
            />
          </div>

          <div>
            <p className="mb-1 text-sm font-medium text-zinc-800">
              Related posts
            </p>
            <RelatedPostsPicker
              compact
              currentPostId={post.id}
              options={relatedOptions}
              value={relatedPostIds}
              onChange={setRelatedPostIds}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-zinc-200 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="rounded-md border border-zinc-200 bg-white px-3.5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={pending}
            className="rounded-md bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
