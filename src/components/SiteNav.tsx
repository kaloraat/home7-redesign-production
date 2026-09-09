"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BRAND_GRADIENT, COMPANY, SITE_NAME } from "@/lib/constants";
import { PhoneIcon, MobileIcon, PinIcon } from "@/components/icons";

type NavItem = {
  label: string;
  // Used only on the mobile-only link bar (see `compact` on NavLinks below)
  // — the desktop inline nav always shows the full label.
  shortLabel?: string;
  href: string;
  children?: { label: string; href: string }[];
  // Admin quick-access only (see NavLinks' `isAdmin` prop) — gold at all
  // times rather than the usual white-with-gold-hover, so it visibly
  // stands apart from the site's own real navigation.
  gold?: boolean;
};

// Matches the live site's exact nav structure (see navbar.blade.php /
// primary_menu data) — dropdown items and hrefs pulled from a live crawl,
// not guessed. "Home" is dropped from the link list itself — the logo
// already links to "/", so it stayed a redundant entry.
const NAV: NavItem[] = [
  { label: "About Us", shortLabel: "About", href: "/about-us" },
  {
    label: "Buy",
    href: "/properties-for-sale",
    children: [
      { label: "Properties For Sale", href: "/properties-for-sale" },
      { label: "Open For Inspection", href: "/open-for-inspection" },
      { label: "Buyers Advisory", href: "/buyers-advisory" },
      { label: "Buyers Agent Request", href: "/buyers-agent-request" },
      { label: "Free Market Appraisal", href: "/free-market-appraisal" },
      { label: "Our Team", href: "/agents" },
    ],
  },
  {
    label: "Rent",
    href: "/properties-for-rent",
    children: [
      { label: "Properties For Rent", href: "/properties-for-rent" },
      { label: "Tenant Application Form", href: "/property-tenant-application-download" },
      { label: "Free Market Appraisal", href: "/free-market-appraisal?key=renting" },
      { label: "Our Team", href: "/agents" },
    ],
  },
  {
    label: "Sold",
    href: "/sold-properties",
    children: [
      { label: "All Sold Properties", href: "/sold-properties" },
      { label: "Free Market Appraisal", href: "/free-market-appraisal" },
      { label: "Our Team", href: "/agents" },
    ],
  },
  { label: "Blog", href: "/blog" },
  { label: "Contact Us", shortLabel: "Contact", href: "/contact" },
];

function NavLinks({
  itemClassName,
  compact = false,
  isAdmin = false,
}: {
  itemClassName: string;
  compact?: boolean;
  isAdmin?: boolean;
}) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  // Appended rather than baked into the shared NAV constant — NAV is
  // module-scope (shared across every render/visitor), so it can never
  // itself carry a specific visitor's admin status.
  const items: NavItem[] = isAdmin ? [...NAV, { label: "Admin", href: "/admin", gold: true }] : NAV;

  return (
    <>
      {items.map((item) => (
        <div
          key={item.href}
          className="relative"
          onMouseEnter={() => item.children && setOpenMenu(item.label)}
          onMouseLeave={() => item.children && setOpenMenu(null)}
        >
          <Link
            href={item.href}
            className={`flex items-center gap-1 transition-colors ${itemClassName} ${
              item.gold
                ? "text-brand-gold font-semibold hover:text-white"
                : openMenu === item.label
                  ? "text-brand-gold"
                  : "text-white hover:text-brand-gold"
            }`}
          >
            {compact ? (
              item.shortLabel ?? item.label
            ) : item.shortLabel ? (
              // Desktop nav also switches to the short label, but only in
              // the 1024–1079px window (the "lg" breakpoint's own lower
              // end) — full logo + nav + phone/mobile + address genuinely
              // don't all fit there, and the address (last, right-aligned)
              // was the one visibly clipped by the viewport edge as a
              // result. min-[1080px]: has no relation to any of Tailwind's
              // named breakpoints; it's this exact pixel value because
              // that's where the row actually stops being cramped.
              <>
                {/* Tailwind's max-[]: arbitrary variant compiles to a
                    fractionally-reduced max-width (not the literal value
                    given), confirmed via computed `display` at each exact
                    pixel width — max-[1079px] actually stopped matching AT
                    1079px, not just above it. Using 1080 here is what
                    empirically produces the intended cutoff: short label
                    through 1079px, full label from 1080px on. */}
                <span className="max-[1080px]:hidden">{item.label}</span>
                <span className="hidden max-[1080px]:inline">{item.shortLabel}</span>
              </>
            ) : (
              item.label
            )}
            {item.children && (
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true">
                <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            )}
          </Link>

          {item.children && openMenu === item.label && (
            <div className="absolute left-0 top-full pt-1 w-56 z-50">
              <ul className="bg-white text-brand-navy rounded shadow-lg overflow-hidden py-1">
                {item.children.map((child) => (
                  <li key={child.href}>
                    <Link
                      href={child.href}
                      className="block px-4 py-2.5 text-lg hover:bg-slate-100 hover:text-brand-gold-dark"
                    >
                      {child.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </>
  );
}

export function SiteNav({ isAdmin }: { isAdmin: boolean }) {
  return (
    <header className="sticky top-0 z-50 text-white">
      {/* Logo + inline desktop nav + contact details — unchanged from the
          original single-row layout at lg and up. */}
      <div style={{ background: BRAND_GRADIENT }}>
        <div className="mx-auto max-w-7xl px-2 sm:px-4 flex items-center justify-between gap-1 sm:gap-3 py-1.25">
          <Link href="/" className="shrink-0">
            <Image
              src="/images/logo.png"
              alt={SITE_NAME}
              width={160}
              height={57}
              priority
              className="h-11.5 sm:h-15.5 w-auto"
            />
          </Link>

          <nav className="hidden lg:flex items-center text-lg font-medium">
            <NavLinks itemClassName="px-2 py-2 rounded whitespace-nowrap" isAdmin={isAdmin} />
          </nav>

          <div className="flex flex-col items-end gap-0.5 text-sm sm:text-base">
            {/* Below `sm`, showing the landline + mobile SIDE BY SIDE, plus
                the full street address underneath — all whitespace-nowrap
                — forced this row wider than a phone screen, which had no
                containment anywhere above it: the whole page grew wider
                than the viewport, letting content be dragged sideways to
                reveal blank space past the true right edge (a real,
                reported bug, not cosmetic). The two phone numbers on their
                OWN separate stacked lines (this block) fit a phone screen
                fine on their own — it was specifically the address's
                length, and/or cramming both numbers onto one row, that
                overflowed. Address itself still only shows from `sm` up. */}
            <div className="flex flex-col items-end gap-0.5 sm:hidden">
              <a href={`tel:${COMPANY.phone}`} className="flex items-center gap-0.5 hover:text-brand-gold whitespace-nowrap">
                <PhoneIcon className="shrink-0 w-[1em] h-[1em]" />
                {COMPANY.phone}
              </a>
              {COMPANY.mobile && (
                <a href={`tel:${COMPANY.mobile}`} className="flex items-center gap-0.5 hover:text-brand-gold whitespace-nowrap">
                  <MobileIcon className="shrink-0 w-[1em] h-[1em]" />
                  {COMPANY.mobile}
                </a>
              )}
            </div>

            <div className="hidden items-center gap-1 sm:flex sm:gap-3">
              <a href={`tel:${COMPANY.phone}`} className="flex items-center gap-0.5 hover:text-brand-gold whitespace-nowrap">
                <PhoneIcon className="shrink-0 w-[1em] h-[1em]" />
                {COMPANY.phone}
              </a>
              {COMPANY.mobile && (
                <a href={`tel:${COMPANY.mobile}`} className="flex items-center gap-0.5 hover:text-brand-gold whitespace-nowrap">
                  <MobileIcon className="shrink-0 w-[1em] h-[1em]" />
                  {COMPANY.mobile}
                </a>
              )}
            </div>
            {/* <address> is the semantic HTML5 element for contact/location
                info — a real signal to search engines that this is the
                business's address, not just decorative text (a <span>
                carries none of that meaning). Wrapped in a link straight to
                Google Maps so the address is actually clickable, which it
                wasn't before. not-italic overrides the browser default
                <address> styling (italic) to match the rest of the header.
                Now sized the same as the phone/mobile row above (inherits
                from the shared parent) rather than its own larger size. The
                displayed text is still the full official address (with the
                "Suite 1/" unit) — only the map link's query uses
                `mapAddress` (the plain street number, no unit) since Maps
                geocodes a unit-prefixed address unreliably and can miss the
                actual building. Hidden below `sm` — see the comment on the
                mobile-only number above. */}
            <address className="hidden not-italic sm:block">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(COMPANY.mapAddress)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-0.5 whitespace-nowrap hover:text-brand-gold"
              >
                <PinIcon className="shrink-0 w-[1em] h-[1em]" />
                {COMPANY.address}
              </a>
            </address>
          </div>
        </div>
      </div>

      {/*
       * Mobile-only replacement for the old hamburger menu — a thin,
       * semi-transparent (50%) link bar under the main row, visible below
       * lg (1024px) where the inline nav above is hidden. On the homepage
       * this sits over the hero, which slides up underneath it via a
       * negative top margin (see page.tsx) so the photo shows through the
       * 50% tint; on every other page it shows through to the plain page
       * background, which is why it's a tint rather than fully transparent
       * — needs enough of its own darkness that white text stays legible
       * regardless of what's behind it.
       */}
      <div className="lg:hidden border-t border-white/10 bg-black/50">
        {/* Tighter padding/gap specifically when the extra "Admin" entry is
            present — without it the 6 real nav items already fit exactly
            one row at typical phone widths; adding a 7th pushed it onto a
            second row. Only admins get the tighter spacing; everyone
            else's layout is untouched. */}
        <nav
          className={`mx-auto max-w-7xl flex flex-wrap items-center justify-center text-xs font-medium ${
            isAdmin ? "px-1 gap-x-0" : "px-4 gap-x-1"
          }`}
        >
          <NavLinks itemClassName={isAdmin ? "px-1 py-1.5" : "px-2 py-1.5"} compact isAdmin={isAdmin} />
        </nav>
      </div>
    </header>
  );
}

export default SiteNav;
