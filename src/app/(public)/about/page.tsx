import type { Metadata } from "next";
import { ContactNavLink } from "@/components/navigation/ContactNavLink";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: `Learn about ${SITE_NAME} — craft, builds, and intentional spaces.`,
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-copper">
        About
      </p>
      <h1 className="mt-3 font-display text-4xl text-charcoal sm:text-5xl md:text-6xl">
        {SITE_NAME}
      </h1>
      <div className="mt-8 space-y-5 text-base leading-relaxed text-ink-muted sm:text-lg">
        <p>
          {SITE_NAME} is a creative practice focused on thoughtful builds and
          environments that feel lived-in from day one — honest materials,
          clear proportion, and craft you can see up close.
        </p>
        <p>
          This portfolio collects selected projects: interiors, structural
          work, and details worth lingering on. Each piece is documented with
          the same care that went into making it.
        </p>
        <p>
          Looking to collaborate or start a conversation about a future
          project? Reach out — we&apos;d love to hear what you&apos;re
          building.
        </p>
      </div>
      <div className="mt-10">
        <ContactNavLink
          className={cn(buttonVariants({ variant: "primary", size: "lg" }))}
        >
          Get in touch
        </ContactNavLink>
      </div>
    </div>
  );
}
