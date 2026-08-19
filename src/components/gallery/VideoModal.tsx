"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { parseVideoUrl } from "@/lib/media/video";
import type { GalleryImage } from "@/types";

export function VideoModal({
  item,
  onClose,
}: {
  item: GalleryImage | null;
  onClose: () => void;
}) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const openedAtRef = useRef(0);

  useEffect(() => {
    if (item) {
      openedAtRef.current = Date.now();
      closeRef.current?.focus();
    }
  }, [item]);

  useEffect(() => {
    if (!item) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [item, onClose]);

  if (!item || typeof document === "undefined") return null;

  const parsed = parseVideoUrl(item.sourceUrl || "");
  const caption = item.caption?.trim() || item.alt?.trim() || "Video";
  const useEmbed = Boolean(parsed?.embedUrl) && parsed?.provider !== "file";

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-charcoal/92 p-4"
      role="presentation"
      onClick={() => {
        if (Date.now() - openedAtRef.current < 400) return;
        onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-5xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-3 text-parchment">
          <p id={titleId} className="truncate text-sm text-parchment/80">
            {caption}
          </p>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="inline-flex size-10 shrink-0 items-center justify-center text-parchment hover:text-copper"
            aria-label="Close video"
          >
            <span aria-hidden className="text-2xl leading-none">
              ×
            </span>
          </button>
        </div>
        <div className="relative aspect-video w-full overflow-hidden bg-black">
          {useEmbed ? (
            <iframe
              title={caption}
              src={parsed!.embedUrl!}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <video
              className="h-full w-full"
              src={item.url}
              controls
              autoPlay
              playsInline
            />
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
