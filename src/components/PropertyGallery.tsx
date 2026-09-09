"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Counter from "yet-another-react-lightbox/plugins/counter";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/counter.css";

// Thumbnail tile is w-20 (5rem = 80px) with a gap-2 (0.5rem = 8px) row gap
// — used below to work out, from the container's REAL measured width, how
// many tiles sit fully visible before the strip needs scrolling.
const THUMB_WIDTH = 80;
const THUMB_GAP = 8;
// How far scrollLeft has to move from 0 before we count the strip as
// "actually being scrolled" rather than just sitting at rest — a few
// pixels of slack for rounding/momentum, not a real scroll yet.
const SCROLL_START_THRESHOLD = 4;
// A pointerdown that never moves more than this counts as a click, not a
// drag — keeps a plain tap/click on a thumbnail working normally.
const DRAG_THRESHOLD = 5;

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  const d = direction === "left" ? "M9 1 1 8l8 7" : "M1 1l8 7-8 7";
  return (
    <svg width="10" height="16" viewBox="0 0 10 16" fill="none" aria-hidden="true">
      <path d={d} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Gold circle + navy icon — same look as the inline prev/next buttons
// below, used here for the lightbox's own prev/next/close controls so the
// full-screen view reads as a continuation of the page, not a different
// (dark, library-default-styled) UI dropped on top of it.
function CircleButton({
  onClick,
  label,
  children,
}: {
  onClick?: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-gold text-brand-navy shadow-lg hover:brightness-95 transition cursor-pointer"
    >
      {children}
    </button>
  );
}

/**
 * The scrollable/draggable thumbnail strip — shared by the inline gallery
 * card AND the full-screen lightbox modal (via its `render.controls`
 * slot), so both places behave identically: mouse-drag-to-scroll, a
 * "+N" badge over the last visible tile when more photos exist than fit,
 * with everything past that tile visually clipped until the strip is
 * actually scrolled away from the very start.
 *
 * yet-another-react-lightbox ships its own Thumbnails plugin, but its
 * strip only renders a small animated window of thumbnails synced to the
 * current slide (checked its source directly, `dist/plugins/thumbnails/
 * index.js` — no independent scrolling at all, just a carousel that
 * advances with prev/next). That's a different, more limited behavior
 * than the free-scrolling strip on the page itself, so the plugin isn't
 * used here — this same component replaces it in both places instead.
 */
function ThumbnailStrip({
  images,
  activeIndex,
  onSelect,
}: {
  images: string[];
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  // Measured on a stable, always-full-width wrapper — NOT the strip
  // itself, since the strip's own width becomes conditionally clipped
  // below (badge state depends on the measurement, so measuring the
  // clipped element would be circular).
  const measureRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState<number | null>(null);
  const [atStart, setAtStart] = useState(true);

  // Mouse-drag-to-scroll state, and which thumbnail (if any) the pointer
  // actually went down on — refs, not state, since these update on every
  // pointermove and don't need their own re-render (only scrollLeft
  // actually changing does, via the onScroll listener below). Selection
  // is resolved here, on pointerup, rather than via a plain onClick on
  // each thumbnail — setPointerCapture (needed so a drag doesn't stop
  // tracking if the pointer leaves the strip mid-gesture) turns out to
  // interfere with the browser's own decision to fire a click event on
  // the original target in some cases, so a real click on a thumbnail
  // silently did nothing. Doing selection ourselves in pointerup sidesteps
  // that entirely rather than fighting it.
  const dragState = useRef<{ dragging: boolean; startX: number; startScrollLeft: number; moved: boolean; targetIndex: number | null }>(
    { dragging: false, startX: 0, startScrollLeft: 0, moved: false, targetIndex: null }
  );

  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return;

    function measure() {
      const width = el!.clientWidth;
      const fit = Math.floor((width + THUMB_GAP) / (THUMB_WIDTH + THUMB_GAP));
      setVisibleCount(Math.max(1, fit));
    }

    measure();
    // Re-measures on any container resize — window resize, orientation
    // change, or the sidebar/layout reflowing for an unrelated reason —
    // not just once on mount.
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const hasOverflow = visibleCount !== null && images.length > visibleCount;
  const badgeIndex = visibleCount !== null ? visibleCount - 1 : -1;
  const overflowCount = hasOverflow ? images.length - badgeIndex : 0;
  const showBadge = hasOverflow && atStart;
  // Only constrains width while the badge is showing — the exact pixel
  // width of (badgeIndex + 1) tiles, no partial tile, so the clip edge
  // lands exactly on the badge tile's own right edge rather than
  // mid-thumbnail.
  const clipWidth = showBadge ? (badgeIndex + 1) * THUMB_WIDTH + badgeIndex * THUMB_GAP : undefined;

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const el = stripRef.current;
    if (!el) return;
    const targetButton = (e.target as HTMLElement).closest("[data-thumb-index]");
    const targetIndex = targetButton ? Number(targetButton.getAttribute("data-thumb-index")) : null;
    dragState.current = { dragging: true, startX: e.clientX, startScrollLeft: el.scrollLeft, moved: false, targetIndex };
    el.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = stripRef.current;
    const drag = dragState.current;
    if (!el || !drag.dragging) return;
    const delta = e.clientX - drag.startX;
    if (Math.abs(delta) > DRAG_THRESHOLD) drag.moved = true;
    el.scrollLeft = drag.startScrollLeft - delta;
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    const el = stripRef.current;
    if (el) el.releasePointerCapture(e.pointerId);
    const drag = dragState.current;
    // A real drag (moved past the threshold) is a scroll gesture, not a
    // selection — only a pointer that stayed put selects the thumbnail it
    // went down on.
    if (!drag.moved && drag.targetIndex !== null) {
      onSelect(drag.targetIndex);
    }
    drag.dragging = false;
  }

  function handleScroll() {
    const el = stripRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= SCROLL_START_THRESHOLD);
  }

  return (
    <div ref={measureRef} className="w-full">
      <div
        ref={stripRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onScroll={handleScroll}
        // Inside the lightbox modal, the library itself attaches a
        // non-passive wheel listener DIRECTLY on its own outer container
        // via addEventListener (`preventDefaultWheelX`, on by default —
        // meant to stop a horizontal trackpad swipe from triggering the
        // browser's back/forward gesture) that calls preventDefault() on
        // any horizontal-dominant wheel event anywhere inside the modal,
        // including here — silently blocking this strip's native
        // wheel/trackpad scroll specifically inside the modal (mouse-drag
        // still worked fine, since that's this component's own pointer
        // handlers above, not native scroll).
        //
        // A plain onWheel + stopPropagation() here does NOT fix it: React
        // 17+ delegates every onWheel to ONE listener at the app's root,
        // physically attached further up the DOM than the library's own
        // direct addEventListener on its container — so in real bubble
        // order, the library's listener already fires (and already calls
        // preventDefault) before React's delegated dispatch even reaches
        // this handler, making stopPropagation here too late to matter.
        // onWheelCapture fires in the CAPTURE phase, which completes
        // before the bubble phase starts at all, so it genuinely runs
        // before the library's bubble-phase listener gets a chance —
        // confirmed via a real wheel-scroll test in the modal, not
        // assumed. Harmless on the inline (non-modal) gallery card too —
        // no such ancestor listener exists there to matter against.
        onWheelCapture={(e) => e.stopPropagation()}
        style={{ maxWidth: clipWidth }}
        // select-none stops the drag from also selecting page text;
        // draggable={false} on each image below stops the browser's
        // own native "drag an image out" ghost — both fight with a
        // click-and-drag scroll gesture otherwise.
        className="flex gap-2 overflow-x-auto pb-1 cursor-grab active:cursor-grabbing select-none"
      >
        {images.map((src, i) => (
          <div
            key={src}
            data-thumb-index={i}
            role="button"
            tabIndex={0}
            aria-label={`Show photo ${i + 1}`}
            aria-current={i === activeIndex}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onSelect(i);
            }}
            className={`relative h-16 w-20 shrink-0 rounded overflow-hidden cursor-pointer ${
              i === activeIndex ? "ring-2 ring-brand-gold" : "opacity-70 hover:opacity-100"
            } transition-opacity`}
          >
            <Image src={src} alt="" fill sizes="80px" className="object-cover" draggable={false} />
            {showBadge && i === badgeIndex && (
              <span className="absolute inset-0 flex items-center justify-center bg-brand-navy/70 text-white text-sm font-semibold">
                +{overflowCount}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Previously just a static 3-image grid (hero + 2 thumbnails, everything
 * past the 3rd photo simply never shown) with no way to see a photo any
 * larger than its small on-page size. This is a real gallery: every photo
 * in `images`, a big inline preview with prev/next controls, a scrollable
 * thumbnail strip, and clicking through to a full-screen lightbox with
 * zoom and keyboard-driven navigation (arrow keys, Escape) — with the
 * SAME scrollable/draggable thumbnail strip carried into the modal too
 * (see ThumbnailStrip above for why that's a custom component rather
 * than the lightbox library's own thumbnails plugin).
 */
export function PropertyGallery({ images: rawImages, address }: { images: string[]; address: string }) {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);

  // Some migrated listings have the same photo URL twice in a row (a
  // migration-time quirk, not intentional — the same image genuinely
  // isn't meant to appear twice in a gallery). Deduping here fixes the
  // visible "same photo shown twice" symptom for every listing without
  // needing a data backfill, and avoids a React key collision below.
  const images = Array.from(new Set(rawImages));

  if (images.length === 0) return null;

  const slides = images.map((src, i) => ({
    src,
    alt: `Photo ${i + 1} of ${address}`,
  }));

  function go(delta: number) {
    setIndex((i) => (i + delta + images.length) % images.length);
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
      <h2 className="font-display text-xl text-brand-navy pb-2 border-b-2 border-brand-gold inline-block">
        Gallery
      </h2>

      <div className="mt-4 relative aspect-video rounded-lg overflow-hidden bg-slate-100">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="absolute inset-0 z-10 cursor-zoom-in"
          aria-label="View full screen"
        >
          <Image
            src={images[index]}
            alt={`Photo ${index + 1} of ${address}`}
            fill
            sizes="(min-width: 1024px) 66vw, 100vw"
            className="object-cover"
            priority={index === 0}
          />
        </button>

        {images.length > 1 && (
          <>
            <div className="absolute left-3 top-1/2 z-20 -translate-y-1/2">
              <CircleButton onClick={() => go(-1)} label="Previous photo">
                <ChevronIcon direction="left" />
              </CircleButton>
            </div>
            <div className="absolute right-3 top-1/2 z-20 -translate-y-1/2">
              <CircleButton onClick={() => go(1)} label="Next photo">
                <ChevronIcon direction="right" />
              </CircleButton>
            </div>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3">
          <ThumbnailStrip images={images} activeIndex={index} onSelect={setIndex} />
        </div>
      )}

      <Lightbox
        open={open}
        close={() => setOpen(false)}
        index={index}
        slides={slides}
        plugins={[Zoom, Counter]}
        on={{ view: ({ index: i }) => setIndex(i) }}
        // White background (matching the page, not the library's dark
        // default) and gold-circle/navy-icon prev/next/close — see
        // CircleButton above, same styling as the inline gallery controls
        // so the full-screen view doesn't look like a different UI.
        // Bottom padding on the slide reserves room for the custom
        // thumbnail bar below (render.controls, an absolutely-positioned
        // overlay that doesn't otherwise affect layout) — without it, a
        // tall "contain"-fit photo sits centered in the FULL height and
        // its bottom edge ends up hidden behind the opaque bar.
        styles={{ container: { backgroundColor: "#fff" }, slide: { paddingBottom: 96 } }}
        render={{
          // buttonPrev/buttonNext, unlike buttonClose below, completely
          // REPLACE the library's default button — its own positioning
          // wrapper (position:absolute, top:50%, left/right:0, defined by
          // the .yarl__navigation_prev/_next classes in the library's own
          // stylesheet) never gets applied to whatever's returned here.
          // Without it, the button rendered fine (confirmed via computed
          // style — correct colors, cursor, opacity 1) but sat thousands
          // of pixels off-screen inside the slide carousel's normal flow
          // instead of pinned to the viewport edge — invisible, not just
          // unstyled. Reusing those two class names directly is the fix.
          buttonPrev: () => (
            <div className="yarl__navigation_prev">
              <CircleButton onClick={() => setIndex((i) => (i - 1 + images.length) % images.length)} label="Previous photo">
                <ChevronIcon direction="left" />
              </CircleButton>
            </div>
          ),
          buttonNext: () => (
            <div className="yarl__navigation_next">
              <CircleButton onClick={() => setIndex((i) => (i + 1) % images.length)} label="Next photo">
                <ChevronIcon direction="right" />
              </CircleButton>
            </div>
          ),
          buttonClose: () => (
            <CircleButton onClick={() => setOpen(false)} label="Close">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </CircleButton>
          ),
          // Rendered as an overlay sibling of the current slide (see
          // node_modules/yet-another-react-lightbox/dist/index.js,
          // Controller component) — an absolutely-positioned bottom bar
          // carrying the exact same ThumbnailStrip used inline above, so
          // sideways drag-to-scroll works identically while the full-size
          // modal is open, not just on the page.
          controls: () =>
            images.length > 1 ? (
              <div className="absolute inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white px-4 py-3 sm:px-8">
                {/* No max-width cap here (unlike the inline gallery card,
                    which is genuinely narrow) — the modal itself spans
                    the full viewport, so the strip should be free to use
                    all of that width too. Capping it at max-w-3xl
                    previously meant the "+N" badge could show even on a
                    wide monitor with plenty of room left over, since the
                    ResizeObserver measurement was reading the artificial
                    cap's width instead of what was actually available. */}
                <ThumbnailStrip images={images} activeIndex={index} onSelect={setIndex} />
              </div>
            ) : null,
        }}
      />
    </div>
  );
}

export default PropertyGallery;
