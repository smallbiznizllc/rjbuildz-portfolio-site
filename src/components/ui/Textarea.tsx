import { cn } from "@/lib/utils/cn";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "flex min-h-[140px] w-full rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-parchment-soft px-3.5 py-3 text-sm text-ink placeholder:text-ink-muted/70 transition-colors resize-y",
        "hover:border-charcoal-muted/40",
        "focus-visible:border-copper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper/30",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
