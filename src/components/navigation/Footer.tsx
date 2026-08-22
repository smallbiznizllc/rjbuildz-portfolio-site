import Link from "next/link";
import { LogIn } from "lucide-react";
import { SiteLogo } from "@/components/brand/SiteLogo";
import { ContactForm } from "@/components/forms/ContactForm";
import { SocialIcon } from "@/components/social/SocialIcon";
import { getSocialNetwork } from "@/lib/social/networks";
import { SHOW_CONTACT, SITE_NAME } from "@/lib/site";
import type { SocialAccount } from "@/types";

const FOOTER_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/admin/login", label: "Login", icon: true },
];

const FOOTER_CATEGORIES = [
  { href: "/category/web-design", label: "Web Design" },
  { href: "/category/web-development", label: "Web Development" },
  { href: "/category/graphics", label: "Graphics" },
  { href: "/category/email-development", label: "Email Development" },
  { href: "/category/print-design", label: "Print Design" },
];

export function Footer({
  socialAccounts = [],
  tagline = null,
}: {
  socialAccounts?: SocialAccount[];
  tagline?: string | null;
}) {
  const year = new Date().getFullYear();
  const accounts = [...socialAccounts].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );

  return (
    <footer className="border-t border-parchment/10 bg-charcoal text-parchment">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-8 gap-y-8 px-4 py-10 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:px-8 lg:py-16">
        <div
          id="socials"
          tabIndex={-1}
          className="col-span-2 flex items-center justify-between gap-6 outline-none lg:col-span-4 lg:block"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <SiteLogo size={48} tone="copper" className="size-12" />
              <p className="font-display text-3xl tracking-tight">{SITE_NAME}</p>
            </div>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-parchment/70">
              A curated portfolio of works by R.J. Oliver
            </p>
          </div>
          {accounts.length > 0 ? (
            <ul className="flex shrink-0 flex-wrap justify-end gap-2.5 lg:mt-6 lg:justify-start">
              {accounts.map((account) => {
                const spec = getSocialNetwork(account.network);
                const isEmail = account.network === "email";
                return (
                  <li key={account.id}>
                    <a
                      href={account.href}
                      {...(isEmail
                        ? {}
                        : { target: "_blank", rel: "noreferrer" })}
                      aria-label={spec.label}
                      className="inline-flex size-10 items-center justify-center rounded-full border border-parchment/15 text-parchment/80 transition-colors hover:border-copper hover:text-copper"
                    >
                      <SocialIcon
                        network={account.network}
                        className="size-4"
                      />
                    </a>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>

        <div className="lg:col-span-2">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-parchment/50">
            Explore
          </p>
          <ul className="mt-4 flex flex-col gap-2">
            {FOOTER_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex items-center gap-1.5 text-sm text-parchment/80 transition-colors hover:text-copper"
                >
                  {link.label}
                  {"icon" in link && link.icon ? (
                    <LogIn className="size-3.5 shrink-0" aria-hidden />
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-2">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-parchment/50">
            Categories
          </p>
          <ul className="mt-4 flex flex-col gap-2">
            {FOOTER_CATEGORIES.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-parchment/80 transition-colors hover:text-copper"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {SHOW_CONTACT ? (
          <div id="contact" className="col-span-2 scroll-mt-8 lg:col-span-4">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-parchment/50">
              Get in touch
            </p>
            <div className="mt-5">
              <ContactForm variant="footer" />
            </div>
          </div>
        ) : null}
      </div>

      <div className="border-t border-parchment/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-parchment/45 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>
            © {year} {SITE_NAME}. All rights reserved.
          </p>
          {tagline ? <p>{tagline}</p> : null}
        </div>
      </div>
    </footer>
  );
}
