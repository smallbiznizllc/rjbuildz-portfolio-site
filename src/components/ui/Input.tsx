import { cn } from "@/lib/utils/cn";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, type = "text", ...props }: InputProps) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-parchment-soft px-3.5 text-sm text-ink placeholder:text-ink-muted/70 transition-colors",
        "hover:border-charcoal-muted/40",
        "focus-visible:border-copper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper/30",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
