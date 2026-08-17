"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Lightbox } from "@/components/gallery/Lightbox";
import { buttonVariants } from "@/components/ui/Button";
import type { GalleryImage } from "@/types";

function imageSize(
  image: GalleryImage,
  measured: Record<string, { w: number; h: number }>,
) {
  const known = measured[image.id];
  return {
    w: image.width || known?.w || 800,
    h: image.height || known?.h || 600,
    known: Boolean(
      (image.width && image.height) || (known && known.w && known.h),
    ),
  };
}

function ringOffset(i: number, index: number, count: number) {
  let d = i - index;
  d -= Math.round(d / count) * count;
  return d;
}

function SeeItLiveButton({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={buttonVariants({ variant: "primary", size: "md" })}
    >
      See it live
      <ArrowRight className="size-4" strokeWidth={2.25} aria-hidden />
    </a>
  );
}

function slideTransform(offset: number) {
  const abs = Math.abs(offset);
  const tx = offset * 58;
  const tz = -Math.min(abs, 3.2) * 160;
  const ry = Math.max(-1, Math.min(1, offset)) * -42;
  const scale = Math.max(0.62, 1 - abs * 0.12);
  const opacity = abs > 3.4 ? 0 : Math.max(0.12, 1 - abs * 0.26);
  const zIndex = 100 - Math.round(abs * 10);

  return {
    transform: `translate(-50%, -50%) translateX(${tx}%) translateZ(${tz}px) rotateY(${ry}deg) scale(${scale})`,
    opacity,
    zIndex,
  };
}

export function PostGallery({
  images,
  seeItLive,
}: {
  images: GalleryImage[];
  seeItLive?: string | null;
}) {
  const sorted = useMemo(
    () => [...images].sort((a, b) => a.sortOrder - b.sortOrder),
    [images],
  );
  const count = sorted.length;

  const stageRef = useRef<HTMLDivElement>(null);
  const deckRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(0);
  const dragRef = useRef({
    dragging: false,
    startX: 0,
    dx: 0,
    moved: false,
    pointerId: -1,
    slideIndex: null as number | null,
  });

  const [index, setIndex] = useState(0);
  const [dragShift, setDragShift] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [open, setOpen] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [paused, setPaused] = useState(false);
  const [measured, setMeasured] = useState<
    Record<string, { w: number; h: number }>
  >({});
  const [stageHeight, setStageHeight] = useState<number | null>(null);
  const cardAspect = useMemo(() => {
    const ratios = sorted.map((image) => {
      const size = imageSize(image, measured);
      if (!size.known || !size.w) return null;
      return size.h / size.w;
    });
    const known = ratios.filter((ratio): ratio is number => ratio != null);
    if (known.length === 0) return 10 / 16;
    if (known.length < sorted.length) {
      return Math.min(10 / 16, ...known);
    }
    return Math.min(...known);
  }, [sorted, measured]);

  indexRef.current = index;

  const go = useCallback(
    (next: number) => {
      if (count === 0) return;
      const wrapped = ((next % count) + count) % count;
      indexRef.current = wrapped;
      setIndex(wrapped);
      setDragShift(0);
    },
    [count],
  );

  const goPrev = useCallback(() => go(indexRef.current - 1), [go]);
  const goNext = useCallback(() => go(indexRef.current + 1), [go]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (count < 2 || reducedMotion || paused || open) return;
    const timer = window.setInterval(goNext, 3800);
    return () => window.clearInterval(timer);
  }, [count, reducedMotion, paused, open, goNext]);

  useEffect(() => {
    if (open || count < 2) return;

    function onKeyDown(event: KeyboardEvent) {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT")
      ) {
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, count, goNext, goPrev]);

  const measureStage = useCallback(() => {
    const deck = deckRef.current;
    if (!deck) return;
    let max = 0;
    deck.querySelectorAll<HTMLElement>(".coverflow__slide").forEach((slide) => {
      max = Math.max(max, slide.offsetHeight);
    });
    if (max > 0) setStageHeight(max);
  }, []);

  useLayoutEffect(() => {
    measureStage();
  }, [measureStage, sorted, measured]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => measureStage());
    observer.observe(stage);
    return () => observer.disconnect();
  }, [measureStage]);

  const slideWidth = useCallback(() => {
    const width = stageRef.current?.clientWidth ?? 320;
    return Math.max(160, width * 0.32);
  }, []);

  function slideIndexAtPoint(clientX: number, clientY: number) {
    const hits = document.elementsFromPoint(clientX, clientY);
    for (const el of hits) {
      const slide = el.closest("[data-slide-index]");
      if (slide instanceof HTMLElement && deckRef.current?.contains(slide)) {
        const next = Number(slide.getAttribute("data-slide-index"));
        if (Number.isInteger(next)) return next;
      }
    }
    return null;
  }

  function slideIndexFromEvent(event: PointerEvent<HTMLDivElement>) {
    const fromTarget = (() => {
      const target = event.target;
      if (!(target instanceof Element)) return null;
      const slide = target.closest("[data-slide-index]");
      if (!slide) return null;
      const next = Number(slide.getAttribute("data-slide-index"));
      return Number.isInteger(next) ? next : null;
    })();
    return fromTarget ?? slideIndexAtPoint(event.clientX, event.clientY);
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    dragRef.current = {
      dragging: true,
      startX: event.clientX,
      dx: 0,
      moved: false,
      pointerId: event.pointerId,
      slideIndex: slideIndexFromEvent(event),
    };
    setPaused(true);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag.dragging || count < 2) return;
    drag.dx = event.clientX - drag.startX;
    if (Math.abs(drag.dx) <= 6) return;
    if (!drag.moved) {
      drag.moved = true;
      deckRef.current?.setPointerCapture(event.pointerId);
    }
    if (!dragging) setDragging(true);
    setDragShift(-drag.dx / slideWidth());
  }

  function endDrag() {
    const drag = dragRef.current;
    if (!drag.dragging) return;
    const moved = drag.moved;
    const slideIndex = drag.slideIndex;
    drag.dragging = false;
    setDragging(false);

    if (moved && count >= 2) {
      const shift = Math.round(-drag.dx / slideWidth());
      if (shift !== 0) go(indexRef.current + shift);
      else setDragShift(0);
    } else {
      setDragShift(0);
      if (slideIndex != null) {
        setStartIndex(slideIndex);
        setOpen(true);
      }
    }
    setPaused(false);
  }

  function openLightbox(imageIndex: number) {
    if (dragRef.current.moved) return;
    setStartIndex(imageIndex);
    setOpen(true);
  }

  if (count === 0 && !seeItLive) return null;

  if (count === 0) {
    return (
      <section className="coverflow mt-12" aria-label="Project links">
        <div className="coverflow__inner">
          <div className="coverflow__live">
            <SeeItLiveButton href={seeItLive!} />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="coverflow mt-12"
      aria-roledescription="carousel"
      aria-labelledby="gallery-heading"
    >
      <div className="coverflow__inner">
        <header>
          <h2 id="gallery-heading" className="coverflow__title">
            Gallery
          </h2>
          {count > 1 ? (
            <p className="coverflow__sub">
              Drag, swipe, arrow keys, or the controls below
            </p>
          ) : null}
        </header>

        <div
          ref={stageRef}
          className="coverflow__stage"
          style={
            stageHeight
              ? { height: stageHeight }
              : undefined
          }
          onPointerEnter={() => setPaused(true)}
          onPointerLeave={() => {
            if (!dragRef.current.dragging) setPaused(false);
          }}
        >
          <div
            ref={deckRef}
            className="coverflow__deck"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            {sorted.map((image, i) => {
              const caption = image.caption?.trim() || "";
              const style = slideTransform(
                ringOffset(i, index, count) + dragShift,
              );
              const active = i === index && !dragging;

              return (
                <button
                  key={image.id}
                  type="button"
                  data-slide-index={i}
                  className={`coverflow__slide${active ? " is-active" : ""}${dragging ? " is-dragging" : ""}`}
                  style={{
                    ...style,
                    aspectRatio: `${1} / ${cardAspect}`,
                  }}
                  onClick={() => openLightbox(i)}
                  aria-label={`Open gallery image ${i + 1}${caption ? `: ${caption}` : ""}`}
                  aria-current={active ? "true" : undefined}
                >
                  {image.url ? (
                    <Image
                      src={image.url}
                      alt={caption || image.alt || ""}
                      fill
                      draggable={false}
                      sizes="(max-width: 640px) 70vw, 300px"
                      className="coverflow__image object-cover"
                      onLoad={(event) => {
                        const img = event.currentTarget;
                        const w = img.naturalWidth;
                        const h = img.naturalHeight;
                        if (!w || !h) return;
                        setMeasured((prev) => {
                          const current = prev[image.id];
                          if (current?.w === w && current?.h === h) return prev;
                          return { ...prev, [image.id]: { w, h } };
                        });
                      }}
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {sorted.some((image) => image.caption?.trim()) ? (
          <div className="coverflow__caption-wrap" aria-live="polite">
            {sorted.map((image, i) => {
              const caption = image.caption?.trim() || "";
              if (!caption) return null;
              const visible = i === index && !dragging;
              return (
                <p
                  key={image.id}
                  className={`coverflow__caption${visible ? " is-visible" : ""}`}
                >
                  {caption}
                </p>
              );
            })}
          </div>
        ) : null}

        {count > 1 ? (
          <div className="coverflow__controls">
            <button
              type="button"
              className="coverflow__nav"
              onClick={goPrev}
              aria-label="Previous"
            >
              ‹
            </button>
            <div
              className="coverflow__dots"
              role="tablist"
              aria-label="Slides"
            >
              {sorted.map((image, i) => (
                <button
                  key={image.id}
                  type="button"
                  role="tab"
                  className={`coverflow__dot${i === index ? " is-active" : ""}`}
                  aria-label={`Go to slide ${i + 1}`}
                  aria-selected={i === index}
                  onClick={() => go(i)}
                />
              ))}
            </div>
            <button
              type="button"
              className="coverflow__nav"
              onClick={goNext}
              aria-label="Next"
            >
              ›
            </button>
          </div>
        ) : null}

        {seeItLive ? (
          <div className="coverflow__live">
            <SeeItLiveButton href={seeItLive} />
          </div>
        ) : null}
      </div>

      <Lightbox
        images={sorted}
        open={open}
        startIndex={startIndex}
        onClose={() => setOpen(false)}
      />
    </section>
  );
}
