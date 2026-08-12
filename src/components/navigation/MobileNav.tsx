"use client";

import { useCallback, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn } from "lucide-react";
import { ContactNavLink } from "@/components/navigation/ContactNavLink";
import { cn } from "@/lib/utils/cn";
import type { Category } from "@/types";

export type NavLink = {
  href: string;
  label: string;
};

type MobileNavProps = {
  open: boolean;
  onClose: () => void;
  links: NavLink[];
  endLinks?: NavLink[];
  categories: Category[];
  showContact?: boolean;
};

export function MobileNav({
  open,
  onClose,
  links,
  endLinks = [],
  categories,
  showContact = false,
}: MobileNavProps) {
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!open) return;
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [open, onClose],
  );

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, handleKeyDown]);

  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] lg:hidden" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-charcoal/55"
        aria-label="Close menu"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="absolute inset-y-0 right-0 flex h-dvh w-[min(100%,20rem)] flex-col bg-parchment shadow-[var(--shadow-soft)]"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--border-subtle)] px-5 py-4">
          <p id={titleId} className="font-display text-xl text-charcoal">
            Menu
          </p>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            className="inline-flex size-10 items-center justify-center rounded border border-copper/40 text-ink hover:text-copper"
            aria-label="Close navigation"
          >
            <span aria-hidden className="text-2xl leading-none">
              ×
            </span>
          </button>
        </div>

        <nav
          aria-label="Mobile"
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6"
        >
          <ul className="flex flex-col gap-1">
            {links.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      "block py-2.5 text-base transition-colors",
                      active
                        ? "text-copper"
                        : "text-ink hover:text-copper",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {categories.length > 0 ? (
            <div className="mt-8 border-t border-[var(--border-subtle)] pt-6">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-muted">
                Categories
              </p>
              <ul className="mt-3 flex flex-col gap-1">
                {categories.map((cat) => {
                  const href = `/category/${cat.slug}`;
                  const active = pathname === href;
                  return (
                    <li key={cat.id}>
                      <Link
                        href={href}
                        className={cn(
                          "block py-2 text-sm transition-colors",
                          active
                            ? "text-copper"
                            : "text-ink-muted hover:text-copper",
                        )}
                        aria-current={active ? "page" : undefined}
                      >
                        {cat.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          {showContact || endLinks.length > 0 ? (
            <ul
              className={cn(
                "flex flex-col gap-1",
                categories.length > 0 || links.length > 0
                  ? "mt-8 border-t border-[var(--border-subtle)] pt-6"
                  : "",
              )}
            >
              {showContact ? (
                <li>
                  <ContactNavLink
                    className="block py-2.5 text-base transition-colors"
                    activeClassName="text-copper"
                    inactiveClassName="text-ink hover:text-copper"
                  />
                </li>
              ) : null}
              {endLinks.map((link) => {
                const active = pathname.startsWith(link.href);
                const isLogin = link.href === "/admin/login";
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        "inline-flex items-center gap-1.5 py-2.5 text-base transition-colors",
                        active
                          ? "text-copper"
                          : "text-ink hover:text-copper",
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      {link.label}
                      {isLogin ? (
                        <LogIn className="size-4 shrink-0" aria-hidden />
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </nav>
      </div>
    </div>,
    document.body,
  );
}
