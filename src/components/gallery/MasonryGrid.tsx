import { cn } from "@/lib/utils/cn";

export function MasonryGrid({
  children,
  className,
  labelledBy,
}: {
  children: React.ReactNode;
  className?: string;
  labelledBy?: string;
}) {
  return (
    <div
      className={cn("masonry-grid", className)}
      role="list"
      aria-labelledby={labelledBy}
    >
      {children}
    </div>
  );
}
