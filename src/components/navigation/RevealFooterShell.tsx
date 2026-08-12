"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  CONTACT_HASH,
  scrollToContactForm,
} from "@/components/navigation/ContactNavLink";

/**
 * Humme-style reveal footer: page content scrolls over a fixed footer,
 * uncovering it when you reach the bottom.
 */
export function RevealFooterShell({
  children,
  footer,
}: {
  children: ReactNode;
  footer: ReactNode;
}) {
  const footerRef = useRef<HTMLDivElement>(null);
  const [footerHeight, setFooterHeight] = useState(420);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = footerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const measure = () => {
      const next = Math.ceil(el.getBoundingClientRect().height);
      setFooterHeight((prev) => (prev === next ? prev : next));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const remaining =
        doc.scrollHeight - window.scrollY - window.innerHeight;
      setRevealed(remaining <= footerHeight * 0.85);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [footerHeight]);

  useEffect(() => {
    if (window.location.hash !== CONTACT_HASH) return;
    const timer = window.setTimeout(() => scrollToContactForm(), 80);
    return () => window.clearTimeout(timer);
  }, [footerHeight]);

  return (
    <>
      <div
        className="reveal-content relative z-10 min-h-screen bg-parchment shadow-[0_24px_48px_rgba(26,24,20,0.18)]"
        style={{ marginBottom: footerHeight }}
      >
        {children}
      </div>

      <div
        ref={footerRef}
        className="reveal-footer fixed inset-x-0 bottom-0 z-0"
        inert={revealed ? undefined : true}
        aria-hidden={!revealed}
      >
        {footer}
      </div>
    </>
  );
}
