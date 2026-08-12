import Link from "next/link";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-24 text-center">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-copper">
        404
      </p>
      <h1 className="mt-3 font-display text-4xl text-charcoal sm:text-5xl">
        Page not found
      </h1>
      <p className="mt-4 text-ink-muted leading-relaxed">
        That page doesn&apos;t exist or the project may have been unpublished.
      </p>
      <Link
        href="/"
        className={cn(buttonVariants({ variant: "primary" }), "mt-8")}
      >
        Back to work
      </Link>
    </div>
  );
}
