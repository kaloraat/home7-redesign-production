"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// Bright gold with navy text plus a periodic shiny sweep (.btn-shine in
// globals.css) so the rental "Apply" call to action stands out from the
// navy/white page chrome around it.
const BUTTON_CLASS =
  "btn-shine block text-center rounded-lg px-5 py-3 font-bold text-brand-navy bg-linear-to-r from-[#ffe08a] via-brand-gold to-[#e9b04f] ring-1 ring-brand-gold-dark/50 shadow-lg shadow-brand-gold/40 hover:brightness-105 hover:shadow-xl transition";

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
      <Link href={href} className={BUTTON_CLASS}>
        Apply for This Property
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

  return (
    <div
      className="lg:hidden sticky z-40 -mx-4 mt-4 px-4 py-2 bg-white/85 backdrop-blur"
      style={{ top }}
    >
      <Link href={href} className={BUTTON_CLASS}>
        Apply for This Property
      </Link>
    </div>
  );
}
