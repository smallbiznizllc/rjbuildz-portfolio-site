"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn } from "lucide-react";
import { ContactNavLink } from "@/components/navigation/ContactNavLink";
import { MobileNav, type NavLink } from "@/components/navigation/MobileNav";
import { cn } from "@/lib/utils/cn";
import { SITE_NAME } from "@/lib/site";

const PRIMARY_LINKS: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
];

const LOGIN_LINK: NavLink = { href: "/admin/login", label: "Login" };

function NavItem({
  href,
  label,
  pathname,
  icon,
}: {
  href: string;
  label: string;
  pathname: string;
  icon?: React.ReactNode;
}) {
  const active =
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <li>
      <Link
        href={href}
        className={cn(
          "inline-flex items-center gap-1.5 text-sm tracking-wide transition-colors",
          active ? "text-copper" : "text-ink-muted hover:text-charcoal",
        )}
        aria-current={active ? "page" : undefined}
      >
        {label}
        {icon}
      </Link>
    </li>
  );
}

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-parchment/90 backdrop-blur-md">
      <div className="mx-auto flex h-[var(--header-height)] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="font-display text-2xl tracking-tight text-charcoal transition-colors hover:text-copper"
        >
          {SITE_NAME}
        </Link>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-8">
            {PRIMARY_LINKS.map((link) => (
              <NavItem
                key={link.href}
                href={link.href}
                label={link.label}
                pathname={pathname}
              />
            ))}
            <li>
              <ContactNavLink
                className="text-sm tracking-wide transition-colors"
                activeClassName="text-copper"
                inactiveClassName="text-ink-muted hover:text-charcoal"
              />
            </li>
            <NavItem
              href={LOGIN_LINK.href}
              label={LOGIN_LINK.label}
              pathname={pathname}
              icon={
                <LogIn className="size-3.5 shrink-0" aria-hidden />
              }
            />
          </ul>
        </nav>

        <button
          type="button"
          className="inline-flex size-10 items-center justify-center text-charcoal lg:hidden"
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          onClick={() => setMobileOpen(true)}
        >
          <span className="sr-only">Menu</span>
          <span aria-hidden className="flex flex-col gap-1.5">
            <span className="block h-px w-5 bg-current" />
            <span className="block h-px w-5 bg-current" />
            <span className="block h-px w-3.5 bg-current" />
          </span>
        </button>
      </div>

      <div id="mobile-nav">
        <MobileNav
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          links={PRIMARY_LINKS}
          endLinks={[LOGIN_LINK]}
          categories={[]}
          showContact
        />
      </div>
    </header>
  );
}
