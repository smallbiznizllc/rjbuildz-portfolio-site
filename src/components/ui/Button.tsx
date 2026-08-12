import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copper disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-copper text-accent-foreground hover:bg-copper-hover",
        secondary:
          "bg-transparent text-parchment border border-parchment/40 hover:border-parchment hover:bg-parchment/10",
        outline:
          "bg-transparent text-ink border border-[var(--border-subtle)] hover:border-copper hover:text-copper",
        ghost: "bg-transparent text-ink hover:text-copper",
        link: "bg-transparent text-copper underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        sm: "h-9 px-3.5 text-sm rounded-[var(--radius-sm)]",
        md: "h-11 px-5 text-sm rounded-[var(--radius-sm)]",
        lg: "h-12 px-7 text-base rounded-[var(--radius-sm)]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { buttonVariants };
