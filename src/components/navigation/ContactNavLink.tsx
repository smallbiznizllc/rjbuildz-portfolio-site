"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const CONTACT_HASH = "#contact";

function scrollToContactForm() {
  const max =
    document.documentElement.scrollHeight - window.innerHeight;
  window.scrollTo({ top: Math.max(0, max), behavior: "smooth" });

  window.setTimeout(() => {
    const field = document.querySelector<HTMLElement>(
      "#contact input, #contact textarea",
    );
    field?.focus({ preventScroll: true });
  }, 450);
}

export function ContactNavLink({
  className,
  activeClassName,
  inactiveClassName,
  children = "Contact",
}: {
  className?: string;
  activeClassName?: string;
  inactiveClassName?: string;
  children?: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const href = `${pathname}${CONTACT_HASH}`;
  const [hashActive, setHashActive] = useState(false);

  useEffect(() => {
    const sync = () => {
      setHashActive(window.location.hash === CONTACT_HASH);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [pathname]);

  return (
    <Link
      href={href}
      className={cn(
        className,
        hashActive ? activeClassName : inactiveClassName,
      )}
      aria-current={hashActive ? "true" : undefined}
      onClick={(event) => {
        event.preventDefault();
        if (window.location.hash !== CONTACT_HASH) {
          router.replace(href, { scroll: false });
        }
        setHashActive(true);
        scrollToContactForm();
      }}
    >
      {children}
    </Link>
  );
}

export { scrollToContactForm, CONTACT_HASH };
