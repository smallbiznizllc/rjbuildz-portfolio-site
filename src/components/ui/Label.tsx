import { cn } from "@/lib/utils/cn";

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ className, ...props }: LabelProps) {
  return (
    <label
      className={cn(
        "block text-sm font-medium text-ink mb-1.5",
        className,
      )}
      {...props}
    />
  );
}
