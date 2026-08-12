"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils/cn";
import type { Category } from "@/types";

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

  const currentSearch = searchParams.get("q") ?? "";
  const currentCategory = searchParams.get("category") ?? "";

  const [query, setQuery] = useState(currentSearch);

  useEffect(() => {
    setQuery(currentSearch);
  }, [currentSearch]);

  const pushParams = useCallback(
    (next: { q?: string; category?: string }) => {
      const params = new URLSearchParams(searchParams.toString());
      const q = next.q !== undefined ? next.q : currentSearch;
      const category =
        next.category !== undefined ? next.category : currentCategory;

      if (q.trim()) params.set("q", q.trim());
      else params.delete("q");

      if (category) params.set("category", category);
      else params.delete("category");

      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams, currentSearch, currentCategory],
  );

  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (query === currentSearch) return;
      pushParams({ q: query });
    }, 350);
    return () => window.clearTimeout(handle);
  }, [query, currentSearch, pushParams]);

  const chips = useMemo(
    () => [{ id: "", name: "All", slug: "" }, ...categories],
    [categories],
  );

  return (
    <div className={cn("space-y-5", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full max-w-md">
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

        <div
          className="flex items-center gap-3 text-sm text-ink-muted"
          aria-live="polite"
        >
          {loading ? <Spinner label="Filtering" /> : null}
          {typeof resultCount === "number" ? (
            <p>
              {resultCount === 0
                ? "No projects found"
                : `${resultCount}${resultCount >= 12 ? "+" : ""} project${resultCount === 1 ? "" : "s"}`}
            </p>
          ) : null}
        </div>
      </div>

      {categories.length > 0 ? (
        <div
          role="group"
          aria-label="Filter by category"
          className="flex flex-wrap gap-2"
        >
          {chips.map((chip) => {
            const selected =
              chip.id === ""
                ? !currentCategory
                : currentCategory === chip.slug ||
                  currentCategory === chip.id;
            return (
              <button
                key={chip.id || "all"}
                type="button"
                onClick={() =>
                  pushParams({
                    category: chip.id
                      ? chip.slug || chip.id
                      : "",
                  })
                }
                aria-pressed={selected}
                className={cn(
                  "px-3.5 py-1.5 text-sm transition-colors border",
                  selected
                    ? "border-copper bg-copper text-accent-foreground"
                    : "border-[var(--border-subtle)] text-ink-muted hover:border-copper hover:text-copper",
                )}
              >
                {chip.name}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
