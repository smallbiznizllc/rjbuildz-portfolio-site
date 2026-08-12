"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Lightbox } from "@/components/gallery/Lightbox";
import type { GalleryImage } from "@/types";

export function PostGallery({ images }: { images: GalleryImage[] }) {
  const sorted = useMemo(
    () => [...images].sort((a, b) => a.sortOrder - b.sortOrder),
    [images],
  );
  const [open, setOpen] = useState(false);
  const [startIndex, setStartIndex] = useState(0);

  if (sorted.length === 0) return null;

  return (
    <section aria-labelledby="gallery-heading" className="mt-12">
      <h2
        id="gallery-heading"
        className="font-display text-2xl text-charcoal sm:text-3xl"
      >
        Gallery
      </h2>

      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:gap-4">
        {sorted.map((image, index) => (
          <li key={image.id}>
            <button
              type="button"
              className="group relative aspect-square w-full overflow-hidden bg-charcoal-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copper"
              onClick={() => {
                setStartIndex(index);
                setOpen(true);
              }}
              aria-label={`Open gallery image ${index + 1}${image.alt ? `: ${image.alt}` : ""}`}
            >
              {image.url ? (
                <Image
                  src={image.url}
                  alt={image.alt || ""}
                  fill
                  sizes="(max-width: 640px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                />
              ) : null}
            </button>
          </li>
        ))}
      </ul>

      <Lightbox
        images={sorted}
        open={open}
        startIndex={startIndex}
        onClose={() => setOpen(false)}
      />
    </section>
  );
}
