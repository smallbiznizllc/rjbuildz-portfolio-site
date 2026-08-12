import Link from "next/link";
import { ContactForm } from "@/components/forms/ContactForm";
import { SITE_NAME } from "@/lib/site";
import type { Category } from "@/types";

const FOOTER_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
];

export function Footer({
  categories,
  contactEmail,
}: {
  categories: Category[];
  contactEmail?: string | null;
}) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-parchment/10 bg-charcoal text-parchment">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-12 lg:px-8 lg:py-16">
        <div className="lg:col-span-4">
          <p className="font-display text-3xl tracking-tight">{SITE_NAME}</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-parchment/70">
            A creative portfolio of builds, interiors, and crafted environments.
          </p>
          {contactEmail ? (
            <a
              href={`mailto:${contactEmail}`}
              className="mt-5 inline-block text-sm text-copper transition-colors hover:text-parchment"
            >
              {contactEmail}
            </a>
          ) : null}
        </div>

        <div className="lg:col-span-3">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-parchment/50">
            Explore
          </p>
          <ul className="mt-4 flex flex-col gap-2">
            {FOOTER_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-parchment/80 transition-colors hover:text-copper"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            {categories.map((cat) => (
              <li key={cat.id}>
                <Link
                  href={`/category/${cat.slug}`}
                  className="text-sm text-parchment/80 transition-colors hover:text-copper"
                >
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div id="contact" className="scroll-mt-8 lg:col-span-5">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-parchment/50">
            Get in touch
          </p>
          <p className="mt-3 mb-5 text-sm text-parchment/70">
            Share a brief note — we&apos;ll follow up soon.
          </p>
          <ContactForm variant="footer" />
        </div>
      </div>

      <div className="border-t border-parchment/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-parchment/45 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>
            © {year} {SITE_NAME}. All rights reserved.
          </p>
          <p>Built with care.</p>
        </div>
      </div>
    </footer>
  );
}
