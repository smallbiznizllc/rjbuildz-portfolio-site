import Link from "next/link";
import { buttonVariants } from "@/components/ui/Button";
import { SITE_NAME } from "@/lib/site";
import { cn } from "@/lib/utils/cn";

export function Hero({
  headline = "Spaces shaped with intention.",
  supporting = "A curated portfolio of builds, interiors, and craft — photographed as they live.",
  ctaLabel = "View the work",
  ctaHref = "#work",
}: {
  headline?: string;
  supporting?: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  return (
    <section
      className="hero-plane relative flex min-h-[78vh] items-end sm:min-h-[85vh]"
      aria-labelledby="hero-brand"
    >
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-16 pt-28 sm:px-6 sm:pb-20 sm:pt-32 lg:px-8 lg:pb-24">
        <p
          id="hero-brand"
          className="animate-fade-up font-display text-5xl leading-none tracking-tight text-parchment sm:text-6xl md:text-7xl lg:text-8xl"
        >
          {SITE_NAME}
        </p>
        <h1 className="animate-fade-up animate-fade-up-delay-1 mt-6 max-w-2xl font-display text-2xl font-medium leading-snug text-parchment/95 sm:text-3xl md:text-4xl">
          {headline}
        </h1>
        <p className="animate-fade-up animate-fade-up-delay-2 mt-4 max-w-lg text-base leading-relaxed text-parchment/70 sm:text-lg">
          {supporting}
        </p>
        <div className="animate-fade-up animate-fade-up-delay-3 mt-8">
          <Link
            href={ctaHref}
            className={cn(buttonVariants({ variant: "primary", size: "lg" }))}
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
