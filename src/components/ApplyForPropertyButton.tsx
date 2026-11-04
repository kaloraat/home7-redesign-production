"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// Gold gradient (light gold to dark gold, diagonal) with navy text, a
// document-with-tick icon and an up-right arrow, plus a periodic shiny
// sweep (.btn-shine in globals.css) so the rental "Apply" call to action
// stands out from the navy/white page chrome around it.
const BUTTON_CLASS =
  "btn-shine group flex items-center justify-center gap-3 rounded-xl px-5 py-3.5 text-lg font-semibold text-brand-navy bg-linear-to-br from-[#f3d98c] via-[#dba653] to-[#b5843f] shadow-lg shadow-brand-gold-dark/30 hover:brightness-105 hover:shadow-xl transition";

function ButtonContent() {
  return (
    <>
      {/* Document with a tick */}
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5" />
        <path d="m9 14 2 2 4-4" />
      </svg>
      <span>Apply for This Property</span>
      {/* Up-right arrow, nudges further up-right on hover */}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
        <path d="M7 17 17 7" />
        <path d="M8 7h9v9" />
      </svg>
    </>
  );
}

/**
 * Rental "Apply for This Property" button.
 *
 * - `variant="sidebar"`: the in-flow button in the sidebar (desktop and up).
 * - `variant="floating"`: mobile only. On phones the sidebar stacks below the
 *   whole article, so the button was only reachable after scrolling past the
 *   gallery, description and map. This one sits in the page between the
 *   title/price block and the gallery, then sticks just under SiteNav's
 *   sticky header once scrolled to. The header's height varies (its mobile
 *   nav row can wrap to two lines), so it's measured rather than hardcoded.
 */
export default function ApplyForPropertyButton({
  slug,
  variant,
}: {
  slug: string;
  variant: "sidebar" | "floating";
}) {
  const href = `/property-tenant-application-download?property=${slug}`;

  if (variant === "sidebar") {
    return (
      <Link href={href} className={BUTTON_CLASS} data-apply-inline>
        <ButtonContent />
      </Link>
    );
  }

  return <FloatingApply href={href} />;
}

function FloatingApply({ href }: { href: string }) {
  // Starts at 0 (tucked behind the z-50 header) until measured.
  // ResizeObserver fires once on observe(), so no separate initial read.
  const [top, setTop] = useState(0);

  useEffect(() => {
    const header = document.querySelector("header");
    if (!header) return;
    const ro = new ResizeObserver(() => setTop(header.getBoundingClientRect().height));
    ro.observe(header);
    return () => ro.disconnect();
  }, []);

  // On phones the sidebar's own Apply button (under the map, above the
  // agent card) eventually scrolls into view. Hide this sticky copy while
  // any part of that one is on screen, so two identical buttons never show
  // at once; it comes back as soon as the inline one leaves the screen.
  const [inlineVisible, setInlineVisible] = useState(false);

  useEffect(() => {
    const inline = document.querySelector("[data-apply-inline]");
    if (!inline) return;
    const io = new IntersectionObserver(([entry]) => setInlineVisible(entry.isIntersecting));
    io.observe(inline);
    return () => io.disconnect();
  }, []);

  return (
    <div
      className={`lg:hidden sticky z-40 -mx-4 mt-4 px-4 py-2 bg-white/85 backdrop-blur transition-opacity duration-200 ${inlineVisible ? "pointer-events-none opacity-0" : "opacity-100"}`}
      style={{ top }}
      // Stays in the layout while hidden, so nothing below it shifts.
      aria-hidden={inlineVisible || undefined}
      inert={inlineVisible || undefined}
    >
      <Link href={href} className={BUTTON_CLASS}>
        <ButtonContent />
      </Link>
    </div>
  );
}
