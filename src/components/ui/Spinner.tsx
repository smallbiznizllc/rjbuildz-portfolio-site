import { cn } from "@/lib/utils/cn";

export function Spinner({
  className,
  label = "Loading",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn("inline-flex items-center gap-2 text-ink-muted", className)}
    >
      <span
        className="size-4 rounded-full border-2 border-copper/30 border-t-copper animate-spin"
        aria-hidden
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}
