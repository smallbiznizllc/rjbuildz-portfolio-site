"use client";

import { Children, useMemo, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils/cn";

function subscribeColumnCount(onChange: () => void) {
  const sm = window.matchMedia("(min-width: 640px)");
  const lg = window.matchMedia("(min-width: 1024px)");
  sm.addEventListener("change", onChange);
  lg.addEventListener("change", onChange);
  return () => {
    sm.removeEventListener("change", onChange);
    lg.removeEventListener("change", onChange);
  };
}

function getColumnCount() {
  if (window.matchMedia("(min-width: 1024px)").matches) return 3;
  if (window.matchMedia("(min-width: 640px)").matches) return 2;
  return 1;
}

/**
 * Left-to-right, top-to-bottom masonry: items 0,1,2 form the first row,
 * then each column stacks independently so mixed tile heights don't leave holes.
 */
export function MasonryGrid({
  children,
  className,
  labelledBy,
}: {
  children: React.ReactNode;
  className?: string;
  labelledBy?: string;
}) {
  const columnCount = useSyncExternalStore(
    subscribeColumnCount,
    getColumnCount,
    () => 1,
  );

  const columns = useMemo(() => {
    const items = Children.toArray(children);
    const cols: React.ReactNode[][] = Array.from(
      { length: columnCount },
      () => [],
    );
    items.forEach((child, index) => {
      cols[index % columnCount]!.push(child);
    });
    return cols;
  }, [children, columnCount]);

  return (
    <div
      className={cn(
        "flex items-start gap-[var(--masonry-gap)]",
        className,
      )}
      role="list"
      aria-labelledby={labelledBy}
    >
      {columns.map((column, index) => (
        <div
          key={index}
          className="flex min-w-0 flex-1 flex-col gap-[var(--masonry-gap)]"
        >
          {column}
        </div>
      ))}
    </div>
  );
}
