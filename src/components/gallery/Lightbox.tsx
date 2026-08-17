"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import type { GalleryImage } from "@/types";

type LightboxProps = {
  images: GalleryImage[];
  startIndex?: number;
  open: boolean;
  onClose: () => void;
};

export function Lightbox({
  images,
  startIndex = 0,
  open,
  onClose,
}: LightboxProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchStartX = useRef<number | null>(null);
  const [index, setIndex] = useState(startIndex);
  const [reducedMotion, setReducedMotion] = useState(false);
  const openedAtRef = useRef(0);

  useEffect(() => {
    if (open) openedAtRef.current = Date.now();
  }, [open]);

  useEffect(() => {
    if (open) setIndex(startIndex);
  }, [open, startIndex]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const goPrev = useCallback(() => {
    setIndex((i) => (i <= 0 ? images.length - 1 : i - 1));
  }, [images.length]);

  const goNext = useCallback(() => {
    setIndex((i) => (i >= images.length - 1 ? 0 : i + 1));
  }, [images.length]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      } else if (event.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
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
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, goPrev, goNext]);

  if (!open || images.length === 0) return null;

  const current = images[index]!;
  const caption = current.caption?.trim() || "";
  const label = caption || `Image ${index + 1} of ${images.length}`;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-charcoal/92 p-4"
      role="presentation"
      onClick={() => {
        if (Date.now() - openedAtRef.current < 400) return;
        onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex max-h-[90vh] w-full max-w-5xl flex-col"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => {
          touchStartX.current = e.changedTouches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          const start = touchStartX.current;
          const end = e.changedTouches[0]?.clientX;
          touchStartX.current = null;
          if (start == null || end == null) return;
          const delta = end - start;
          if (Math.abs(delta) < 50) return;
          if (delta > 0) goPrev();
          else goNext();
        }}
      >
        <p id={titleId} className="sr-only">
          Gallery lightbox — {label}
        </p>

        <div className="mb-3 flex items-center justify-between gap-3 text-parchment">
          <p className="text-sm text-parchment/70" aria-live="polite">
            {index + 1} / {images.length}
          </p>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="inline-flex size-10 items-center justify-center text-parchment hover:text-copper"
            aria-label="Close lightbox"
          >
            <span aria-hidden className="text-2xl leading-none">
              ×
            </span>
          </button>
        </div>

        <div
          className={cn(
            "relative aspect-[4/3] w-full overflow-hidden bg-charcoal-soft sm:aspect-[16/10]",
            !reducedMotion && "transition-opacity duration-200",
          )}
        >
          {current.url ? (
            <Image
              src={current.url}
              alt={label}
              fill
              sizes="90vw"
              className="object-contain"
              priority
            />
          ) : null}
        </div>

        {caption ? (
          <p className="mt-3 text-center text-sm text-parchment/75">
            {caption}
          </p>
        ) : null}

        {images.length > 1 ? (
          <div className="mt-4 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={goPrev}
              className="px-4 py-2 text-sm text-parchment border border-parchment/30 hover:border-copper hover:text-copper"
              aria-label="Previous image"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={goNext}
              className="px-4 py-2 text-sm text-parchment border border-parchment/30 hover:border-copper hover:text-copper"
              aria-label="Next image"
            >
              Next
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
