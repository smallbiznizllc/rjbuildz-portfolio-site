"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Filter, X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import type { Category } from "@/types";

function parseCategoryParam(raw: string | null): string[] {
  if (!raw?.trim()) return [];
  return [
    ...new Set(
      raw
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean),
    ),
  ];
}

function serializeCategoryParam(slugs: string[]): string {
  return slugs.join(",");
}

export function PostFilters({
  categories,
  resultCount,
  loading = false,
  className,
}: {
  categories: Category[];
  resultCount?: number | null;
  loading?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchId = useId();
  const titleId = useId();

  const currentSearch = searchParams.get("q") ?? "";
  const categoryParam = searchParams.get("category") ?? "";
  const selectedSlugs = useMemo(
    () => parseCategoryParam(categoryParam),
    [categoryParam],
  );

  const [query, setQuery] = useState(currentSearch);
  const [modalOpen, setModalOpen] = useState(false);
  const [draftSlugs, setDraftSlugs] = useState<string[]>(selectedSlugs);

  useEffect(() => {
    setQuery(currentSearch);
  }, [currentSearch]);

  // Sync draft from the URL only when the modal opens or the URL filter changes.
  useEffect(() => {
    if (!modalOpen) return;
    setDraftSlugs(parseCategoryParam(categoryParam));
  }, [modalOpen, categoryParam]);

  useEffect(() => {
    if (!modalOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setModalOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modalOpen]);

  const pushParams = useCallback(
    (next: { q?: string; categorySlugs?: string[] }) => {
      const params = new URLSearchParams(searchParams.toString());
      const q = next.q !== undefined ? next.q : currentSearch;
      const slugs =
        next.categorySlugs !== undefined ? next.categorySlugs : selectedSlugs;

      if (q.trim()) params.set("q", q.trim());
      else params.delete("q");

      const serialized = serializeCategoryParam(slugs);
      if (serialized) params.set("category", serialized);
      else params.delete("category");

      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams, currentSearch, selectedSlugs],
  );

  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (query === currentSearch) return;
      pushParams({ q: query });
    }, 350);
    return () => window.clearTimeout(handle);
  }, [query, currentSearch, pushParams]);

  function toggleDraft(slug: string) {
    setDraftSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  }

  function applyFilters() {
    pushParams({ categorySlugs: draftSlugs });
    setModalOpen(false);
  }

  function clearFilters() {
    setDraftSlugs([]);
    pushParams({ categorySlugs: [] });
    setModalOpen(false);
  }

  const activeFilterCount = selectedSlugs.length;
  const selectedFilterNames = useMemo(() => {
    return selectedSlugs
      .map((slug) => {
        const match = categories.find(
          (category) => category.slug === slug || category.id === slug,
        );
        return match?.name ?? slug;
      })
      .filter(Boolean);
  }, [selectedSlugs, categories]);

  const countLabel =
    typeof resultCount === "number"
      ? `${resultCount}${resultCount >= 12 ? "+" : ""}`
      : "";
  const resultLabel =
    selectedFilterNames.length > 0
      ? `${countLabel} ${selectedFilterNames.join(", ")} entries`
      : `${countLabel} entries`;

  return (
    <div className={cn("space-y-5", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex w-full max-w-xl items-stretch gap-2">
          <div className="min-w-0 flex-1">
            <label htmlFor={searchId} className="sr-only">
              Search projects
            </label>
            <Input
              id={searchId}
              type="search"
              name="q"
              placeholder="Search projects…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
            />
          </div>
          {categories.length > 0 ? (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className={cn(
                buttonVariants({ variant: "primary", size: "md" }),
                "relative shrink-0 px-3.5",
              )}
              aria-label={
                activeFilterCount > 0
                  ? `Filter by category, ${activeFilterCount} selected`
                  : "Filter by category"
              }
              aria-haspopup="dialog"
              aria-expanded={modalOpen}
            >
              <Filter className="size-4" aria-hidden />
              <span className="hidden sm:inline">Filter</span>
              {activeFilterCount > 0 ? (
                <span className="absolute -top-1.5 -right-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-copper px-1 text-[0.65rem] font-bold text-black">
                  {activeFilterCount}
                </span>
              ) : null}
            </button>
          ) : null}
        </div>

        <div
          className="flex items-center gap-3 text-sm text-ink-muted"
          aria-live="polite"
        >
          {loading ? <Spinner label="Filtering" /> : null}
          {typeof resultCount === "number" ? <p>{resultLabel}</p> : null}
        </div>
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-charcoal/45"
            aria-label="Dismiss"
            onClick={() => setModalOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative flex max-h-[min(90vh,720px)] w-full max-w-md flex-col overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-parchment shadow-[var(--shadow-soft)]"
          >
            <div className="flex items-start justify-between gap-3 border-b border-[var(--border-subtle)] px-5 py-4">
              <div>
                <h2
                  id={titleId}
                  className="font-display text-2xl text-charcoal"
                >
                  Filter by category
                </h2>
                <p className="mt-1 text-sm text-ink-muted">
                  Select one or more categories.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded p-1.5 text-ink-muted hover:bg-parchment-deep hover:text-charcoal"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto px-5 py-4">
              {categories.map((category) => {
                const slug = category.slug || category.id;
                const checked = draftSlugs.includes(slug);
                const inputId = `filter-cat-${category.id}`;
                return (
                  <li key={category.id}>
                    <label
                      htmlFor={inputId}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-[var(--radius-sm)] px-2 py-2.5 transition-colors hover:bg-parchment-deep/60",
                        checked && "bg-copper-soft",
                      )}
                    >
                      <input
                        id={inputId}
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleDraft(slug)}
                        className="size-4 rounded border-[var(--border-subtle)] text-copper accent-copper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copper"
                      />
                      <span className="text-sm text-ink">{category.name}</span>
                    </label>
                  </li>
                );
              })}
            </ul>

            <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--border-subtle)] px-5 py-4">
              <button
                type="button"
                onClick={clearFilters}
                className={cn(buttonVariants({ variant: "ghost", size: "md" }))}
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className={cn(
                  buttonVariants({ variant: "outline", size: "md" }),
                )}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyFilters}
                className={cn(
                  buttonVariants({ variant: "primary", size: "md" }),
                )}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
